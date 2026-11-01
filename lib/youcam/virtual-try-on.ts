import type { Product } from "@/lib/types";

const DEFAULT_BASE_URL = "https://yce-api-01.makeupar.com";
const FILE_PATH = "/s2s/v2.0/file";
const TASK_PATH = "/s2s/v2.0/task/makeup-vto";
const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 20;
const ADAPTER_DEADLINE_MS = 50_000;
const MAX_REQUEST_MS = 20_000;

export class YouCamVtoError extends Error {
  constructor(
    message: string,
    readonly status = 502,
  ) {
    super(message);
    this.name = "YouCamVtoError";
  }
}

interface Config {
  baseUrl: string;
  authorization: string;
}

interface VtoOptions {
  pollIntervalMs?: number;
  maxPolls?: number;
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function config(): Config {
  const authorization =
    process.env.YOUCAM_AUTHORIZATION?.trim() ??
    process.env.YOUCAM_API_KEY?.trim();
  if (!authorization) {
    throw new YouCamVtoError("Live VTO is not configured.", 503);
  }
  const baseUrl = process.env.YOUCAM_API_BASE_URL?.trim() || DEFAULT_BASE_URL;
  try {
    const url = new URL(baseUrl);
    if (url.protocol !== "https:") throw new Error("https required");
  } catch {
    throw new YouCamVtoError("Live VTO has an invalid provider URL.", 503);
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ""), authorization };
}

function apiHeaders(value: Config) {
  return {
    Authorization: value.authorization,
    "Content-Type": "application/json",
    "X-Pxy-Src": "glowcart",
  };
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function timeoutError(): YouCamVtoError {
  return new YouCamVtoError(
    "Live virtual try-on took too long to respond. Please try again.",
    504,
  );
}

function signalWithTimeout(parent: AbortSignal | undefined, deadline: number) {
  const remaining = deadline - Date.now();
  if (remaining <= 0) throw timeoutError();
  const timeout = AbortSignal.timeout(Math.min(MAX_REQUEST_MS, remaining));
  return parent ? AbortSignal.any([parent, timeout]) : timeout;
}

async function providerFetch(
  input: RequestInfo | URL,
  init: RequestInit,
  deadline: number,
  parentSignal?: AbortSignal,
): Promise<Response> {
  try {
    return await fetch(input, {
      ...init,
      signal: signalWithTimeout(parentSignal, deadline),
    });
  } catch (error) {
    if (isAbortError(error)) throw timeoutError();
    throw error;
  }
}

async function jsonResponse(response: Response, operation: string) {
  if (!response.ok) {
    throw new YouCamVtoError(
      `YouCam VTO ${operation} failed.`,
      response.status >= 400 && response.status < 500 ? 502 : 503,
    );
  }
  try {
    return await response.json();
  } catch {
    throw new YouCamVtoError(`YouCam VTO returned an invalid ${operation} response.`);
  }
}

function record(value: unknown, message: string): JsonRecord {
  if (!isRecord(value)) throw new YouCamVtoError(message);
  return value;
}

function uploadHeaders(value: unknown, fallback: string) {
  if (!isRecord(value)) return { "Content-Type": fallback };
  const headers: Record<string, string> = {};
  for (const [name, headerValue] of Object.entries(value)) {
    if (typeof headerValue === "string") headers[name] = headerValue;
  }
  return Object.keys(headers).length > 0
    ? headers
    : { "Content-Type": fallback };
}

function lipEffectFor(product: Product) {
  switch (product.finish) {
    case "sheer":
      return {
        texture: "sheer" as const,
        colorIntensity: 60,
        transparencyIntensity: 35,
      };
    case "satin":
      return { texture: "satin" as const, colorIntensity: 78 };
    case "matte":
      return { texture: "matte" as const, colorIntensity: 90 };
  }
}

async function registerAndUpload(
  value: Config,
  image: File,
  deadline: number,
  signal?: AbortSignal,
) {
  const registration = await providerFetch(`${value.baseUrl}${FILE_PATH}`, {
    method: "POST",
    headers: apiHeaders(value),
    body: JSON.stringify({
      files: [
        {
          content_type: image.type,
          file_name: image.name || "glowcart-selfie.jpg",
          file_size: image.size,
        },
      ],
    }),
  }, deadline, signal);
  const payload = record(
    await jsonResponse(registration, "file registration"),
    "YouCam VTO returned an unexpected registration response.",
  );
  const data = record(payload.data, "YouCam VTO returned no registration data.");
  const files = data.files;
  if (!Array.isArray(files) || files.length === 0) {
    throw new YouCamVtoError("YouCam VTO returned no upload target.");
  }
  const info = record(files[0], "YouCam VTO returned an invalid upload target.");
  const requests = info.requests;
  if (typeof info.file_id !== "string" || !Array.isArray(requests)) {
    throw new YouCamVtoError("YouCam VTO returned an incomplete upload target.");
  }
  const upload = record(requests[0], "YouCam VTO returned no upload request.");
  if (typeof upload.url !== "string") {
    throw new YouCamVtoError("YouCam VTO returned an invalid upload URL.");
  }
  const uploadUrl = new URL(upload.url);
  if (uploadUrl.protocol !== "https:") {
    throw new YouCamVtoError("YouCam VTO returned an insecure upload URL.");
  }
  const result = await providerFetch(uploadUrl, {
    method: "PUT",
    headers: uploadHeaders(upload.headers, image.type),
    body: await image.arrayBuffer(),
  }, deadline, signal);
  if (!result.ok) throw new YouCamVtoError("YouCam VTO image upload failed.");
  return info.file_id;
}

export async function createLipstickVto(
  image: File,
  product: Product,
  signal?: AbortSignal,
  options: VtoOptions = {},
): Promise<string> {
  const deadline = Date.now() + ADAPTER_DEADLINE_MS;
  const value = config();
  const fileId = await registerAndUpload(value, image, deadline, signal);
  const taskResponse = await providerFetch(`${value.baseUrl}${TASK_PATH}`, {
    method: "POST",
    headers: apiHeaders(value),
    body: JSON.stringify({
      version: "1.0",
      src_file_id: fileId,
      effects: [
        {
          category: "lip_color",
          shape: { name: "original" },
          style: { type: "full" },
          palettes: [
            {
              color: product.swatchHex,
              ...lipEffectFor(product),
            },
          ],
        },
      ],
    }),
  }, deadline, signal);
  const taskPayload = record(
    await jsonResponse(taskResponse, "task creation"),
    "YouCam VTO returned an unexpected task response.",
  );
  const taskData = record(taskPayload.data, "YouCam VTO returned no task data.");
  if (typeof taskData.task_id !== "string") {
    throw new YouCamVtoError("YouCam VTO did not return a task ID.");
  }

  const pollIntervalMs = options.pollIntervalMs ?? POLL_INTERVAL_MS;
  const maxPolls = options.maxPolls ?? MAX_POLLS;
  for (let poll = 0; poll < maxPolls; poll += 1) {
    const statusResponse = await providerFetch(
      `${value.baseUrl}${TASK_PATH}/${encodeURIComponent(taskData.task_id)}`,
      {
        headers: apiHeaders(value),
      },
      deadline,
      signal,
    );
    const statusPayload = record(
      await jsonResponse(statusResponse, "task status"),
      "YouCam VTO returned an unexpected status response.",
    );
    const statusData = record(statusPayload.data, "YouCam VTO returned no status data.");
    if (statusData.task_status === "success") {
      const results = record(statusData.results, "YouCam VTO returned no result.");
      if (typeof results.url !== "string") {
        throw new YouCamVtoError("YouCam VTO returned no result image.");
      }
      const resultUrl = new URL(results.url);
      if (resultUrl.protocol !== "https:") {
        throw new YouCamVtoError("YouCam VTO returned an insecure result URL.");
      }
      return resultUrl.toString();
    }
    if (statusData.task_status === "error") {
      throw new YouCamVtoError("YouCam VTO could not render that image.", 422);
    }
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw timeoutError();
    await new Promise<void>((resolve, reject) => {
      if (signal?.aborted) {
        reject(signal.reason);
        return;
      }
      const timer = setTimeout(() => {
        signal?.removeEventListener("abort", onAbort);
        if (deadline - Date.now() <= 0) reject(timeoutError());
        else resolve();
      }, Math.min(pollIntervalMs, remaining));
      const onAbort = () => {
        clearTimeout(timer);
        reject(signal?.reason);
      };
      signal?.addEventListener("abort", onAbort, { once: true });
    });
  }
  throw timeoutError();
}
