import type { Product } from "@/lib/types";

const DEFAULT_BASE_URL = "https://yce-api-01.makeupar.com";
const FILE_PATH = "/s2s/v2.0/file";
const TASK_PATH = "/s2s/v2.0/task/makeup-vto";
const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 20;

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

function signalWithTimeout(parent: AbortSignal | undefined, timeoutMs: number) {
  const timeout = AbortSignal.timeout(timeoutMs);
  return parent ? AbortSignal.any([parent, timeout]) : timeout;
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

async function registerAndUpload(
  value: Config,
  image: File,
  signal?: AbortSignal,
) {
  const registration = await fetch(`${value.baseUrl}${FILE_PATH}`, {
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
    signal: signalWithTimeout(signal, 20_000),
  });
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
  const result = await fetch(uploadUrl, {
    method: "PUT",
    headers: uploadHeaders(upload.headers, image.type),
    body: await image.arrayBuffer(),
    signal: signalWithTimeout(signal, 120_000),
  });
  if (!result.ok) throw new YouCamVtoError("YouCam VTO image upload failed.");
  return info.file_id;
}

export async function createLipstickVto(
  image: File,
  product: Product,
  signal?: AbortSignal,
  options: VtoOptions = {},
): Promise<string> {
  const value = config();
  const fileId = await registerAndUpload(value, image, signal);
  const taskResponse = await fetch(`${value.baseUrl}${TASK_PATH}`, {
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
              texture: "matte",
              colorIntensity: 100,
            },
          ],
        },
      ],
    }),
    signal: signalWithTimeout(signal, 20_000),
  });
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
    const statusResponse = await fetch(
      `${value.baseUrl}${TASK_PATH}/${encodeURIComponent(taskData.task_id)}`,
      {
        headers: apiHeaders(value),
        signal: signalWithTimeout(signal, 20_000),
      },
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
    await new Promise<void>((resolve, reject) => {
      if (signal?.aborted) {
        reject(signal.reason);
        return;
      }
      const timer = setTimeout(resolve, pollIntervalMs);
      signal?.addEventListener(
        "abort",
        () => {
          clearTimeout(timer);
          reject(signal.reason);
        },
        { once: true },
      );
    });
  }
  throw new YouCamVtoError("YouCam VTO took too long to respond.", 504);
}
