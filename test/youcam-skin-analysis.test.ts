import assert from "node:assert/strict";
import test from "node:test";
import { analyzeSkin, YouCamError } from "../lib/youcam/skin-analysis";

const originalAuthorization = process.env.YOUCAM_AUTHORIZATION;
const originalApiKey = process.env.YOUCAM_API_KEY;
const originalBaseUrl = process.env.YOUCAM_API_BASE_URL;
const originalFetch = globalThis.fetch;

function restoreEnvironment() {
  if (originalAuthorization === undefined) delete process.env.YOUCAM_AUTHORIZATION;
  else process.env.YOUCAM_AUTHORIZATION = originalAuthorization;
  if (originalApiKey === undefined) delete process.env.YOUCAM_API_KEY;
  else process.env.YOUCAM_API_KEY = originalApiKey;
  if (originalBaseUrl === undefined) delete process.env.YOUCAM_API_BASE_URL;
  else process.env.YOUCAM_API_BASE_URL = originalBaseUrl;
}

function uploadRegistration() {
  return {
    data: {
      files: [
        {
          file_id: "file-id",
          requests: [{ url: "https://uploads.example.test/file", headers: { "Content-Type": "image/png" } }],
        },
      ],
    },
  };
}

function taskResponse(status: "running" | "success" | "error") {
  return {
    data: {
      task_id: "task-id",
      task_status: status,
      ...(status === "success"
        ? {
            results: {
              output: [
                { type: "acne", ui_score: 99 },
                { type: "moisture", ui_score: 72 },
                { type: "pore", ui_score: 61 },
                { type: "unknown", ui_score: 100 },
              ],
            },
          }
        : {}),
    },
  };
}

test.afterEach(() => {
  restoreEnvironment();
  globalThis.fetch = originalFetch;
});

test("requires server authorization", async () => {
  delete process.env.YOUCAM_AUTHORIZATION;
  delete process.env.YOUCAM_API_KEY;
  globalThis.fetch = (async () => {
    throw new Error("network must not be called");
  }) as typeof fetch;
  await assert.rejects(
    analyzeSkin(new File(["image"], "selfie.png", { type: "image/png" })),
    (error: unknown) =>
      error instanceof YouCamError && error.status === 503,
  );
});

test("falls back to legacy YOUCAM_API_KEY when YOUCAM_AUTHORIZATION is missing", async () => {
  delete process.env.YOUCAM_AUTHORIZATION;
  process.env.YOUCAM_API_KEY = "legacy-key";
  const calls: Request[] = [];
  const responses = [
    new Response(JSON.stringify(uploadRegistration()), { status: 200 }),
    new Response(null, { status: 200 }),
    new Response(JSON.stringify({ data: { task_id: "task-id" } }), { status: 200 }),
    new Response(JSON.stringify(taskResponse("success")), { status: 200 }),
  ];
  globalThis.fetch = (async (input, init) => {
    calls.push(new Request(input, init));
    const response = responses.shift();
    if (!response) throw new Error("unexpected provider request");
    return response;
  }) as typeof fetch;

  await analyzeSkin(
    new File(["image"], "selfie.png", { type: "image/png" }),
    undefined,
    { pollIntervalMs: 0 },
  );

  assert.equal(calls[0]?.headers.get("authorization"), "legacy-key");
});

test("normalizes the verified provider sequence", async () => {
  process.env.YOUCAM_AUTHORIZATION = "Bearer test-only";
  const calls: Request[] = [];
  const responses = [
    new Response(JSON.stringify(uploadRegistration()), { status: 200 }),
    new Response(null, { status: 200 }),
    new Response(JSON.stringify({ data: { task_id: "task-id" } }), { status: 200 }),
    new Response(JSON.stringify(taskResponse("running")), { status: 200 }),
    new Response(JSON.stringify(taskResponse("success")), { status: 200 }),
  ];
  globalThis.fetch = (async (input, init) => {
    calls.push(new Request(input, init));
    const response = responses.shift();
    if (!response) throw new Error("unexpected provider request");
    return response;
  }) as typeof fetch;

  const snapshot = await analyzeSkin(
    new File(["image"], "selfie.png", { type: "image/png" }),
    undefined,
    { pollIntervalMs: 0 },
  );

  assert.equal(snapshot.source, "live");
  assert.deepEqual(
    snapshot.observations.map((item) => item.id),
    ["acne", "moisture", "pore"],
  );
  const taskBody = await calls[2]?.clone().json();
  assert.equal(taskBody.format, "json");
  assert.equal(taskBody.src_file_id, "file-id");
  assert.deepEqual(taskBody.dst_actions, ["acne", "pore", "moisture"]);
  assert.equal(calls[1]?.method, "PUT");
  assert.equal(calls[1]?.url, "https://uploads.example.test/file");
  assert.equal(calls[1]?.headers.get("authorization"), null);
});

test("aborts during polling without starting another provider request", async () => {
  process.env.YOUCAM_AUTHORIZATION = "Bearer test-only";
  const controller = new AbortController();
  let requestCount = 0;
  const responses = [
    new Response(JSON.stringify(uploadRegistration())),
    new Response(null, { status: 200 }),
    new Response(JSON.stringify({ data: { task_id: "task-id" } })),
    new Response(JSON.stringify(taskResponse("running"))),
  ];
  globalThis.fetch = (async () => {
    requestCount += 1;
    return responses.shift() ?? new Response("unexpected", { status: 500 });
  }) as typeof fetch;

  const promise = analyzeSkin(
    new File(["image"], "selfie.png", { type: "image/png" }),
    controller.signal,
    { pollIntervalMs: 20 },
  );
  setTimeout(() => controller.abort(), 5);
  await assert.rejects(promise);
  assert.equal(requestCount, 4);
});

test("maps polling exhaustion to a 504 provider error", async () => {
  process.env.YOUCAM_AUTHORIZATION = "Bearer test-only";
  const responses = [
    new Response(JSON.stringify(uploadRegistration())),
    new Response(null, { status: 200 }),
    new Response(JSON.stringify({ data: { task_id: "task-id" } })),
    new Response(JSON.stringify(taskResponse("running"))),
  ];
  globalThis.fetch = (async () =>
    responses.shift() ?? new Response(JSON.stringify(taskResponse("running")))) as typeof fetch;

  await assert.rejects(
    analyzeSkin(
      new File(["image"], "selfie.png", { type: "image/png" }),
      undefined,
      { pollIntervalMs: 0, maxPolls: 1 },
    ),
    (error: unknown) =>
      error instanceof YouCamError && error.status === 504,
  );
});

test("rejects insecure upload targets", async () => {
  process.env.YOUCAM_AUTHORIZATION = "Bearer test-only";
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        data: {
          files: [
            {
              file_id: "file-id",
              requests: [{ url: "http://insecure.example.test/file" }],
            },
          ],
        },
      }),
      { status: 200 },
    )) as typeof fetch;

  await assert.rejects(
    analyzeSkin(new File(["image"], "selfie.png", { type: "image/png" })),
    /insecure upload URL/,
  );
});

test("maps provider task errors without exposing provider payloads", async () => {
  process.env.YOUCAM_AUTHORIZATION = "Bearer test-only";
  const responses = [
    new Response(JSON.stringify(uploadRegistration()), { status: 200 }),
    new Response(null, { status: 200 }),
    new Response(JSON.stringify({ data: { task_id: "task-id" } }), { status: 200 }),
    new Response(JSON.stringify(taskResponse("error")), { status: 200 }),
  ];
  globalThis.fetch = (async () => {
    const response = responses.shift();
    if (!response) throw new Error("unexpected provider request");
    return response;
  }) as typeof fetch;

  await assert.rejects(
    analyzeSkin(new File(["image"], "selfie.png", { type: "image/png" })),
    (error: unknown) =>
      error instanceof YouCamError &&
      error.status === 502 &&
      !error.message.includes("task-id"),
  );
});

test("maps known face-quality task errors to recoverable messages", async () => {
  process.env.YOUCAM_AUTHORIZATION = "******";
  const responses = [
    new Response(JSON.stringify(uploadRegistration()), { status: 200 }),
    new Response(null, { status: 200 }),
    new Response(JSON.stringify({ data: { task_id: "task-id" } }), { status: 200 }),
    new Response(
      JSON.stringify({
        data: {
          task_id: "task-id",
          task_status: "error",
          error: "error_src_face_too_small",
        },
      }),
    ),
  ];
  globalThis.fetch = (async () =>
    responses.shift() ?? new Response("unexpected", { status: 500 })) as typeof fetch;

  await assert.rejects(
    analyzeSkin(new File(["image"], "selfie.png", { type: "image/png" })),
    (error: unknown) =>
      error instanceof YouCamError &&
      error.status === 422 &&
      error.message.includes("face is too small"),
  );
});

test("maps provider HTTP failures to safe adapter errors", async () => {
  process.env.YOUCAM_AUTHORIZATION = "Bearer test-only";
  globalThis.fetch = (async () =>
    new Response("provider secret body", { status: 401 })) as typeof fetch;

  await assert.rejects(
    analyzeSkin(new File(["image"], "selfie.png", { type: "image/png" })),
    (error: unknown) =>
      error instanceof YouCamError &&
      error.status === 502 &&
      !error.message.includes("provider secret"),
  );
});

test("ignores non-finite and out-of-range provider scores", async () => {
  process.env.YOUCAM_AUTHORIZATION = "******";
  const responses = [
    new Response(JSON.stringify(uploadRegistration())),
    new Response(null, { status: 200 }),
    new Response(JSON.stringify({ data: { task_id: "task-id" } })),
    new Response(
      JSON.stringify({
        data: {
          task_id: "task-id",
          task_status: "success",
          results: {
            output: [
              { type: "acne", ui_score: -1 },
              { type: "moisture", ui_score: 101 },
              { type: "pore", ui_score: "72" },
              { type: "acne", ui_score: 99 },
            ],
          },
        },
      }),
    ),
  ];
  globalThis.fetch = (async () =>
    responses.shift() ?? new Response("unexpected", { status: 500 })) as typeof fetch;

  const snapshot = await analyzeSkin(
    new File(["image"], "selfie.png", { type: "image/png" }),
  );

  assert.deepEqual(
    snapshot.observations.map((item) => item.id),
    ["acne"],
  );
  assert.equal(snapshot.observations[0]?.uiScore, 99);
});
