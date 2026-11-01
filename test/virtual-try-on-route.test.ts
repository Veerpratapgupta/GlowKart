import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../app/api/virtual-try-on/route";
import { demoFaceUrl, recordedVtoResults } from "../lib/mock/recorded-vto";
import { sampleLipstickCatalog } from "../lib/mock/catalog";

const originalMode = process.env.GLOWCART_ANALYSIS_MODE;
const originalDeployment = process.env.GLOWCART_LIVE_DEPLOYMENT;
const originalFetch = globalThis.fetch;

function restoreEnvironment() {
  if (originalMode === undefined) delete process.env.GLOWCART_ANALYSIS_MODE;
  else process.env.GLOWCART_ANALYSIS_MODE = originalMode;
  if (originalDeployment === undefined) delete process.env.GLOWCART_LIVE_DEPLOYMENT;
  else process.env.GLOWCART_LIVE_DEPLOYMENT = originalDeployment;
  globalThis.fetch = originalFetch;
}

function requestFor(productId: string): Request {
  const form = new FormData();
  form.set("image", new File(["selfie"], "selfie.png", { type: "image/png" }));
  form.set("productId", productId);
  return new Request("http://localhost/api/virtual-try-on", {
    method: "POST",
    body: form,
  });
}

test.afterEach(restoreEnvironment);

test("returns the mapped recorded asset without calling YouCam", async () => {
  process.env.GLOWCART_ANALYSIS_MODE = "recorded";
  globalThis.fetch = (async () => {
    throw new Error("recorded mode must not call the network");
  }) as typeof fetch;

  for (const product of sampleLipstickCatalog) {
    const response = await POST(requestFor(product.id));
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(body, {
      mode: "recorded",
      resultUrl: recordedVtoResults[product.id as keyof typeof recordedVtoResults],
      demoFaceUrl,
    });
  }
});

test("rejects an invalid VTO mode safely", async () => {
  process.env.GLOWCART_ANALYSIS_MODE = "staging";
  const response = await POST(requestFor(sampleLipstickCatalog[0]!.id));

  assert.equal(response.status, 500);
  assert.equal(
    (await response.json()).error,
    "GlowCart virtual try-on mode is not configured correctly.",
  );
});

test("keeps live mode behind the protected deployment gate", async () => {
  process.env.GLOWCART_ANALYSIS_MODE = "live";
  delete process.env.GLOWCART_LIVE_DEPLOYMENT;
  const response = await POST(requestFor(sampleLipstickCatalog[0]!.id));

  assert.equal(response.status, 503);
  assert.equal(
    (await response.json()).error,
    "Live virtual try-on is available only on a protected deployment.",
  );
});
