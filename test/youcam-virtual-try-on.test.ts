import assert from "node:assert/strict";
import test from "node:test";
import { createLipstickVto, YouCamVtoError } from "../lib/youcam/virtual-try-on";
import { sampleLipstickCatalog } from "../lib/mock/catalog";

const originalAuthorization = process.env.YOUCAM_AUTHORIZATION;
const originalFetch = globalThis.fetch;

test.afterEach(() => {
  if (originalAuthorization === undefined) delete process.env.YOUCAM_AUTHORIZATION;
  else process.env.YOUCAM_AUTHORIZATION = originalAuthorization;
  globalThis.fetch = originalFetch;
});

test("uploads the selfie and renders the selected lipstick shade", async () => {
  process.env.YOUCAM_AUTHORIZATION = "Bearer test-token";
  const calls: Request[] = [];
  const responses = [
    new Response(JSON.stringify({
      data: { files: [{ file_id: "file-id", requests: [{ url: "https://upload.test/file", headers: { "Content-Type": "image/jpeg" } }] }] },
    })),
    new Response(null, { status: 200 }),
    new Response(JSON.stringify({ data: { task_id: "task-id" } })),
    new Response(JSON.stringify({ data: { task_status: "success", results: { url: "https://results.test/vto.jpg" } } })),
  ];
  globalThis.fetch = (async (input, init) => {
    calls.push(new Request(input, init));
    return responses.shift() ?? new Response("unexpected", { status: 500 });
  }) as typeof fetch;

  const result = await createLipstickVto(
    new File(["image"], "selfie.jpg", { type: "image/jpeg" }),
    sampleLipstickCatalog[0]!,
    undefined,
    { pollIntervalMs: 0 },
  );

  assert.equal(result, "https://results.test/vto.jpg");
  assert.equal(calls[1]?.headers.get("authorization"), null);
  const task = await calls[2]!.clone().json();
  assert.equal(task.src_file_id, "file-id");
  assert.deepEqual(task.effects[0], {
    category: "lip_color",
    shape: { name: "original" },
    style: { type: "full" },
    palettes: [{ color: sampleLipstickCatalog[0]!.swatchHex, texture: "matte", colorIntensity: 100 }],
  });
});

test("rejects insecure result URLs", async () => {
  process.env.YOUCAM_AUTHORIZATION = "Bearer test-token";
  const responses = [
    new Response(JSON.stringify({ data: { files: [{ file_id: "file-id", requests: [{ url: "https://upload.test/file" }] }] } })),
    new Response(null, { status: 200 }),
    new Response(JSON.stringify({ data: { task_id: "task-id" } })),
    new Response(JSON.stringify({ data: { task_status: "success", results: { url: "http://results.test/vto.jpg" } } })),
  ];
  globalThis.fetch = (async () => {
    return responses.shift()!;
  }) as typeof fetch;

  await assert.rejects(
    createLipstickVto(new File(["image"], "selfie.jpg", { type: "image/jpeg" }), sampleLipstickCatalog[0]!, undefined, { pollIntervalMs: 0 }),
    (error: unknown) => error instanceof YouCamVtoError && error.message.includes("insecure result URL"),
  );
});
