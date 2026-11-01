import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../app/api/skin-analysis/route";

const originalMode = process.env.GLOWCART_ANALYSIS_MODE;
const originalAuthorization = process.env.YOUCAM_AUTHORIZATION;
const originalBaseUrl = process.env.YOUCAM_API_BASE_URL;
const originalLiveDeployment = process.env.GLOWCART_LIVE_DEPLOYMENT;
const originalFetch = globalThis.fetch;

function imageFile(
  type = "image/png",
  contents = "selfie",
): File {
  return new File([contents], "selfie.png", { type });
}

function requestWithImage(file?: File, headers?: HeadersInit): Request {
  const form = new FormData();
  if (file) form.set("image", file);
  return new Request("http://localhost/api/skin-analysis", {
    method: "POST",
    body: form,
    headers,
  });
}

function restoreMode() {
  if (originalMode === undefined) delete process.env.GLOWCART_ANALYSIS_MODE;
  else process.env.GLOWCART_ANALYSIS_MODE = originalMode;
  if (originalAuthorization === undefined) delete process.env.YOUCAM_AUTHORIZATION;
  else process.env.YOUCAM_AUTHORIZATION = originalAuthorization;
  if (originalBaseUrl === undefined) delete process.env.YOUCAM_API_BASE_URL;
  else process.env.YOUCAM_API_BASE_URL = originalBaseUrl;
  if (originalLiveDeployment === undefined) delete process.env.GLOWCART_LIVE_DEPLOYMENT;
  else process.env.GLOWCART_LIVE_DEPLOYMENT = originalLiveDeployment;
  globalThis.fetch = originalFetch;
}

test.beforeEach(() => {
  globalThis.fetch = (async () => {
    throw new Error("network must not be called in route tests");
  }) as typeof fetch;
});

test.afterEach(restoreMode);

test("defaults to a recorded fixture without provider configuration or fetches", async () => {
  delete process.env.GLOWCART_ANALYSIS_MODE;
  delete process.env.YOUCAM_AUTHORIZATION;
  delete process.env.YOUCAM_API_BASE_URL;
  delete process.env.GLOWCART_LIVE_DEPLOYMENT;
  let fetchCalls = 0;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    throw new Error("recorded mode must not call the network");
  }) as typeof fetch;

  const response = await POST(requestWithImage(imageFile()));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(body.mode, "recorded");
  assert.equal(body.snapshot.source, "recorded");
  assert.equal(fetchCalls, 0);
  assert.deepEqual(
    body.snapshot.observations.map((item: { id: string }) => item.id),
    ["acne", "pore", "moisture"],
  );
});

test("rejects unsupported files before analysis", async () => {
  const response = await POST(
    requestWithImage(imageFile("text/plain", "not an image")),
  );

  assert.equal(response.status, 415);
  assert.match((await response.json()).error, /file type/i);
});

test("rejects empty and oversized files before analysis", async () => {
  const emptyResponse = await POST(requestWithImage(imageFile("image/png", "")));
  assert.equal(emptyResponse.status, 415);

  const oversizedResponse = await POST(
    requestWithImage(
      new File([new Uint8Array(8 * 1024 * 1024 + 1)], "large.png", {
        type: "image/png",
      }),
    ),
  );
  assert.equal(oversizedResponse.status, 415);
});

test("rejects a request without an image", async () => {
  const response = await POST(requestWithImage());
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "Please upload a selfie image.");
});

test("rejects oversized requests before parsing multipart data", async () => {
  const response = await POST(
    new Request("http://localhost/api/skin-analysis", {
      method: "POST",
      headers: { "content-length": "9000000" },
    }),
  );

  assert.equal(response.status, 413);
  assert.match((await response.json()).error, /larger than 8 MB/i);
});

test("fails closed for an unknown analysis mode", async () => {
  process.env.GLOWCART_ANALYSIS_MODE = "unknown";
  const response = await POST(requestWithImage(imageFile()));

  assert.equal(response.status, 500);
  assert.equal((await response.json()).error, "GlowKart analysis mode is not configured correctly.");
});

test("fails closed when live mode is not on a protected deployment", async () => {
  process.env.GLOWCART_ANALYSIS_MODE = "live";
  delete process.env.GLOWCART_LIVE_DEPLOYMENT;
  const response = await POST(requestWithImage(imageFile()));

  assert.equal(response.status, 503);
  assert.equal(
    (await response.json()).error,
    "Live Skin AI is available only on a protected deployment.",
  );
});

test("maps live provider success and failure to safe route responses", async () => {
  process.env.GLOWCART_ANALYSIS_MODE = "live";
  process.env.YOUCAM_AUTHORIZATION = "Bearer test-only";
  process.env.YOUCAM_API_BASE_URL = "https://provider.example.test";
  process.env.GLOWCART_LIVE_DEPLOYMENT = "protected";
  const successResponses = [
    new Response(JSON.stringify({
      data: { files: [{ file_id: "file-id", requests: [{ url: "https://uploads.example.test/file" }] }] },
    })),
    new Response(null, { status: 200 }),
    new Response(JSON.stringify({ data: { task_id: "task-id" } })),
    new Response(JSON.stringify({ data: { task_id: "task-id", task_status: "success", results: { output: [{ type: "moisture", ui_score: 72 }] } } })),
  ];
  globalThis.fetch = (async () => successResponses.shift() ?? new Response("unexpected", { status: 500 })) as typeof fetch;
  const successResponse = await POST(requestWithImage(imageFile()));
  const successBody = await successResponse.json();
  assert.equal(successResponse.status, 200);
  assert.equal(successResponse.headers.get("cache-control"), "no-store");
  assert.equal(successBody.mode, "live");
  assert.equal(successBody.snapshot.source, "live");
  assert.deepEqual(successBody.snapshot.observations.map((item: { id: string }) => item.id), ["moisture"]);

  const failureResponses = [
    new Response(JSON.stringify({
      data: { files: [{ file_id: "file-id", requests: [{ url: "https://uploads.example.test/file" }] }] },
    })),
    new Response(null, { status: 200 }),
    new Response(JSON.stringify({ data: { task_id: "task-id" } })),
    new Response(JSON.stringify({ data: { task_id: "task-id", task_status: "error" } })),
  ];
  globalThis.fetch = (async () => failureResponses.shift() ?? new Response("unexpected", { status: 500 })) as typeof fetch;

  const response = await POST(requestWithImage(imageFile()));
  const body = await response.json();
  assert.equal(response.status, 502);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(body.error, "Live Skin AI is temporarily unavailable.");
  assert.equal(JSON.stringify(body).includes("task-id"), false);
});

test("maps a provider TimeoutError to the safe 504 timeout response", async () => {
  process.env.GLOWCART_ANALYSIS_MODE = "live";
  process.env.YOUCAM_AUTHORIZATION = "******";
  process.env.GLOWCART_LIVE_DEPLOYMENT = "protected";
  globalThis.fetch = (async () => {
    throw new DOMException("timed out", "TimeoutError");
  }) as typeof fetch;

  const response = await POST(requestWithImage(imageFile()));

  assert.equal(response.status, 504);
  assert.equal(
    (await response.json()).error,
    "Live Skin AI took too long to respond. Please try again.",
  );
});

test("rejects malformed multipart requests", async () => {
  const response = await POST(
    new Request("http://localhost/api/skin-analysis", {
      method: "POST",
      body: "not multipart data",
      headers: { "content-type": "multipart/form-data" },
    }),
  );
  assert.equal(response.status, 400);
});
