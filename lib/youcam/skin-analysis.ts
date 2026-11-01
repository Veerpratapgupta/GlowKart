import type { SkinObservation, SkinSnapshot } from "@/lib/types";

const DEFAULT_BASE_URL = "https://yce-api-01.makeupar.com";
const UPLOAD_PATH = "/s2s/v2.0/file";
const TASK_PATH = "/s2s/v2.1/task/skin-analysis";
const ACTIONS = ["acne", "pore", "moisture"] as const;
const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 10;

export interface SkinAnalysisOptions {
  pollIntervalMs?: number;
  maxPolls?: number;
}

export class YouCamError extends Error {
  constructor(
    message: string,
    readonly status = 502,
  ) {
    super(message);
    this.name = "YouCamError";
  }
}

interface YouCamConfig {
  baseUrl: string;
  authorization: string;
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function getConfig(): YouCamConfig {
  const authorization =
    process.env.YOUCAM_AUTHORIZATION?.trim() ??
    process.env.YOUCAM_API_KEY?.trim();
  if (!authorization) {
    throw new YouCamError(
      "Live Skin AI is not configured. Add server-only YOUCAM_AUTHORIZATION (or legacy YOUCAM_API_KEY).",
      503,
    );
  }
  const baseUrl = process.env.YOUCAM_API_BASE_URL?.trim() || DEFAULT_BASE_URL;
  try {
    const parsedUrl = new URL(baseUrl);
    if (parsedUrl.protocol !== "https:") {
      throw new Error("The YouCam base URL must use HTTPS.");
    }
  } catch {
    throw new YouCamError("Live Skin AI has an invalid provider URL.", 503);
  }
  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    authorization,
  };
}

function headers(config: YouCamConfig, contentType = "application/json") {
  return {
    Authorization: config.authorization,
    "Content-Type": contentType,
    "X-Pxy-Src": "glowcart",
  };
}

function requestSignal(
  parentSignal: AbortSignal | undefined,
  timeoutMs: number,
): AbortSignal {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  return parentSignal
    ? AbortSignal.any([parentSignal, timeoutSignal])
    : timeoutSignal;
}

async function readJson(
  response: Response,
  operation: string,
): Promise<unknown> {
  if (!response.ok) {
    throw new YouCamError(
      `YouCam ${operation} request failed with status ${response.status}.`,
      response.status >= 400 && response.status < 500 ? 502 : 503,
    );
  }
  try {
    return await response.json();
  } catch {
    throw new YouCamError(`YouCam returned an invalid ${operation} response.`);
  }
}

function recordFromResponse(payload: unknown): JsonRecord {
  if (!isRecord(payload)) {
    throw new YouCamError("YouCam returned an unexpected response.");
  }
  return payload;
}

function taskFailure(data: JsonRecord): { message: string; status: number } {
  const code = typeof data.error === "string" ? data.error : "";
  switch (code) {
    case "error_src_face_too_small":
    case "error_face_position_too_small":
    case "error_below_min_image_size":
      return {
        message:
          "Your face is too small in this photo. Move closer and keep your face upright.",
        status: 422,
      };
    case "error_large_face_angle":
    case "error_face_angle_invalid":
    case "error_face_position_invalid":
      return {
        message:
          "Please face the camera directly with your head upright and try again.",
        status: 422,
      };
    case "error_no_face":
      return {
        message:
          "We couldn’t find a face. Use a clear, front-facing selfie and try again.",
        status: 422,
      };
    case "error_multiple_people":
      return { message: "Use a selfie with only one person visible.", status: 422 };
    case "error_exceed_max_image_size":
      return {
        message: "That image is too large for Skin AI. Choose a smaller photo.",
        status: 422,
      };
    default:
      return { message: "YouCam could not analyze that image.", status: 502 };
  }
}

function uploadHeaders(value: unknown, fallbackContentType: string) {
  if (!isRecord(value)) {
    return { "Content-Type": fallbackContentType };
  }
  const safeHeaders: Record<string, string> = {};
  for (const [name, headerValue] of Object.entries(value)) {
    if (typeof headerValue === "string") {
      safeHeaders[name] = headerValue;
    }
  }
  return Object.keys(safeHeaders).length > 0
    ? safeHeaders
    : { "Content-Type": fallbackContentType };
}

async function registerAndUpload(
  config: YouCamConfig,
  image: File,
  signal?: AbortSignal,
): Promise<string> {
  const metadataResponse = await fetch(`${config.baseUrl}${UPLOAD_PATH}`, {
    method: "POST",
    headers: headers(config),
    body: JSON.stringify({
      files: [
        {
          content_type: image.type,
          file_name: image.name || "glowcart-selfie.png",
          file_size: image.size,
        },
      ],
    }),
    signal: requestSignal(signal, 20_000),
  });
  const metadataPayload = recordFromResponse(
    await readJson(metadataResponse, "file registration"),
  );
  const data = recordFromResponse(metadataPayload.data);
  const files = data.files;
  if (!Array.isArray(files) || files.length === 0) {
    throw new YouCamError("YouCam did not return an upload target.");
  }
  const info = recordFromResponse(files[0]);
  const requests = info.requests;
  const fileId = info.file_id;
  if (
    typeof fileId !== "string" ||
    !Array.isArray(requests) ||
    requests.length === 0
  ) {
    throw new YouCamError("YouCam returned an incomplete upload target.");
  }
  const uploadRequest = recordFromResponse(requests[0]);
  if (typeof uploadRequest.url !== "string") {
    throw new YouCamError("YouCam returned an invalid upload URL.");
  }
  let uploadUrl: URL;
  try {
    uploadUrl = new URL(uploadRequest.url);
  } catch {
    throw new YouCamError("YouCam returned an invalid upload URL.");
  }
  if (uploadUrl.protocol !== "https:") {
    throw new YouCamError("YouCam returned an insecure upload URL.");
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: uploadHeaders(uploadRequest.headers, image.type),
    body: await image.arrayBuffer(),
    signal: requestSignal(signal, 120_000),
  });
  if (!uploadResponse.ok) {
    throw new YouCamError(
      `YouCam image upload failed with status ${uploadResponse.status}.`,
      502,
    );
  }
  return fileId;
}

function normalizeSnapshot(payload: unknown): SkinSnapshot {
  const root = recordFromResponse(payload);
  const data = recordFromResponse(root.data);
  const results = recordFromResponse(data.results);
  const output = results.output;
  if (!Array.isArray(output)) {
    throw new YouCamError("YouCam returned no Skin AI observations.");
  }

  const labels: Record<string, { id: SkinObservation["id"]; title: string }> = {
    acne: { id: "acne", title: "Clear-looking skin" },
    moisture: { id: "moisture", title: "Good hydration" },
    pore: { id: "pore", title: "Some visible pore texture" },
  };
  const observations: SkinObservation[] = [];
  for (const item of output) {
    if (!isRecord(item)) continue;
    const result = item;
    if (
      typeof result.type !== "string" ||
      !labels[result.type] ||
      typeof result.ui_score !== "number" ||
      !Number.isFinite(result.ui_score) ||
      result.ui_score < 0 ||
      result.ui_score > 100
    ) {
      continue;
    }
    const label = labels[result.type];
    observations.push({
      id: label.id,
      title: label.title,
      uiScore: Math.round(result.ui_score),
      detail:
        result.type === "moisture"
          ? `Your AI score was ${Math.round(result.ui_score)}/100 for moisture. A comfortable balm or cushion texture may be a good place to start.`
          : `Your AI score was ${Math.round(result.ui_score)}/100 for ${result.type}. This is a beauty reference score, not a diagnosis.`,
    });
  }
  if (observations.length === 0) {
    throw new YouCamError("YouCam returned no supported Skin AI observations.");
  }
  return {
    source: "live",
    disclaimer: "Beauty guidance, not a medical diagnosis.",
    observations,
  };
}

export async function analyzeSkin(
  image: File,
  signal?: AbortSignal,
  options: SkinAnalysisOptions = {},
): Promise<SkinSnapshot> {
  const pollIntervalMs = options.pollIntervalMs ?? POLL_INTERVAL_MS;
  const maxPolls = options.maxPolls ?? MAX_POLLS;
  const config = getConfig();
  const fileId = await registerAndUpload(config, image, signal);
  const taskResponse = await fetch(`${config.baseUrl}${TASK_PATH}`, {
    method: "POST",
    headers: headers(config),
    body: JSON.stringify({
      format: "json",
      src_file_id: fileId,
      dst_actions: [...ACTIONS],
      miniserver_args: { enable_mask_overlay: false },
    }),
    signal: requestSignal(signal, 20_000),
  });
  const taskPayload = recordFromResponse(
    await readJson(taskResponse, "task creation"),
  );
  const taskData = recordFromResponse(taskPayload.data);
  if (typeof taskData.task_id !== "string") {
    throw new YouCamError("YouCam did not return a task ID.");
  }

  for (let poll = 0; poll < maxPolls; poll += 1) {
    const statusResponse = await fetch(
      `${config.baseUrl}${TASK_PATH}/${taskData.task_id}`,
      {
        headers: headers(config),
        signal: requestSignal(signal, 20_000),
      },
    );
    const statusPayload = recordFromResponse(
      await readJson(statusResponse, "task status"),
    );
    const statusData = recordFromResponse(statusPayload.data);
    if (statusData.task_status === "success") {
      return normalizeSnapshot(statusPayload);
    }
    if (statusData.task_status === "error") {
      const failure = taskFailure(statusData);
      throw new YouCamError(failure.message, failure.status);
    }
    await new Promise<void>((resolve, reject) => {
      if (signal?.aborted) {
        reject(signal.reason);
        return;
      }
      let timer: ReturnType<typeof setTimeout>;
      const onAbort = () => {
        clearTimeout(timer);
        reject(signal?.reason);
      };
      timer = setTimeout(() => {
        signal?.removeEventListener("abort", onAbort);
        resolve();
      }, pollIntervalMs);
      signal?.addEventListener("abort", onAbort, { once: true });
    });
  }
  throw new YouCamError("YouCam analysis timed out. Please try again.", 504);
}
