import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../app/api/virtual-try-on/route";
import { demoFaceUrl, recordedVtoResults } from "../lib/mock/recorded-vto";
import { sampleLipstickCatalog } from "../lib/mock/catalog";

const originalMode = process.env.GLOWCART_ANALYSIS_MODE;
const originalDeployment = process.env.GLOWCART_LIVE_DEPLOYMENT;
const originalAuthorization = process.env.YOUCAM_AUTHORIZATION;
const originalBaseUrl = process.env.YOUCAM_API_BASE_URL;
const originalFetch = globalThis.fetch;

function restoreEnvironment() {
  if (originalMode === undefined) delete process.env.GLOWCART_ANALYSIS_MODE;
  else process.env.GLOWCART_ANALYSIS_MODE = originalMode;
  if (originalDeployment === undefined) delete process.env.GLOWCART_LIVE_DEPLOYMENT;
  else process.env.GLOWCART_LIVE_DEPLOYMENT = originalDeployment;
  if (originalAuthorization === undefined) delete process.env.YOUCAM_AUTHORIZATION;
  else process.env.YOUCAM_AUTHORIZATION = originalAuthorization;
  if (originalBaseUrl === undefined) delete process.env.YOUCAM_API_BASE_URL;
  else process.env.YOUCAM_API_BASE_URL = originalBaseUrl;
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

test("returns each recorded asset without provider configuration or fetches", async () => {
  delete process.env.GLOWCART_ANALYSIS_MODE;
  delete process.env.YOUCAM_AUTHORIZATION;
  delete process.env.YOUCAM_API_BASE_URL;
  delete process.env.GLOWCART_LIVE_DEPLOYMENT;
  let fetchCalls = 0;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    throw new Error("recorded mode must not call the network");
  }) as typeof fetch;

  const expectedUrls = {
    "sun-coral-balm": "/demo/vto-sun-coral.jpg",
    "soft-berry-tint": "/demo/vto-soft-berry.jpg",
    "peach-nude-cream": "/demo/vto-peach-nude.jpg",
  } as const;

  for (const product of sampleLipstickCatalog) {
    const response = await POST(requestFor(product.id));
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(body, {
      mode: "recorded",
      resultUrl: expectedUrls[product.id as keyof typeof expectedUrls],
      demoFaceUrl: "/demo/demo-selfie.jpg",
    });
  }
  assert.deepEqual(recordedVtoResults, expectedUrls);
  assert.equal(demoFaceUrl, "/demo/demo-selfie.jpg");
  assert.equal(fetchCalls, 0);
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

test("maps a provider TimeoutError to the safe 504 timeout response", async () => {
  process.env.GLOWCART_ANALYSIS_MODE = "live";
  process.env.GLOWCART_LIVE_DEPLOYMENT = "protected";
  process.env.YOUCAM_AUTHORIZATION = "******";
  globalThis.fetch = (async () => {
    throw new DOMException("timed out", "TimeoutError");
  }) as typeof fetch;

  const response = await POST(requestFor(sampleLipstickCatalog[0]!.id));

  assert.equal(response.status, 504);
  assert.equal(
    (await response.json()).error,
    "Live virtual try-on took too long to respond. Please try again.",
  );
});
