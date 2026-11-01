import { NextResponse } from "next/server";
import { recordedAnalysisResponse } from "@/lib/mock/recorded-analysis";
import {
  MAX_SELFIE_REQUEST_BYTES,
  validateSelfieFile,
} from "@/lib/selfie-validation";
import { analyzeSkin, YouCamError } from "@/lib/youcam/skin-analysis";

export const runtime = "nodejs";
export const maxDuration = 60;

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

function isTimeoutError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  );
}

export async function POST(request: Request) {
  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    const requestBytes = Number(contentLength);
    if (
      !Number.isSafeInteger(requestBytes) ||
      requestBytes < 0 ||
      requestBytes > MAX_SELFIE_REQUEST_BYTES
    ) {
      return errorResponse("That upload is larger than 8 MB.", 413);
    }
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("We couldn’t read the uploaded form.", 400);
  }

  const image = formData.get("image");
  if (!(image instanceof File)) {
    return errorResponse("Please upload a selfie image.", 400);
  }

  const validation = validateSelfieFile(image);
  if (!validation.ok) {
    return errorResponse(validation.message, 415);
  }

  const mode = process.env.GLOWCART_ANALYSIS_MODE ?? "recorded";
  if (mode === "recorded") {
    return NextResponse.json(recordedAnalysisResponse, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (mode === "live") {
    if (process.env.GLOWCART_LIVE_DEPLOYMENT !== "protected") {
      return errorResponse(
        "Live Skin AI is available only on a protected deployment.",
        503,
      );
    }
    try {
      return NextResponse.json(
        {
          mode: "live",
          snapshot: await analyzeSkin(image, request.signal),
        },
        {
          headers: { "Cache-Control": "no-store" },
        },
      );
    } catch (error) {
      if (error instanceof YouCamError) {
        const message =
          error.status === 504
            ? "Live Skin AI took too long to respond. Please try again."
            : error.status === 422
              ? error.message
            : "Live Skin AI is temporarily unavailable.";
        return errorResponse(message, error.status);
      }
      if (isTimeoutError(error)) {
        return errorResponse(
          "Live Skin AI took too long to respond. Please try again.",
          504,
        );
      }
      return errorResponse("Live Skin AI is temporarily unavailable.", 503);
    }
  }

  return errorResponse("GlowKart analysis mode is not configured correctly.", 500);
}
