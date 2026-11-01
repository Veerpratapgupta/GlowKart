import { NextResponse } from "next/server";
import { MAX_SELFIE_REQUEST_BYTES, validateSelfieFile } from "@/lib/selfie-validation";
import { createLipstickVto, YouCamVtoError } from "@/lib/youcam/virtual-try-on";
import { sampleLipstickCatalog } from "@/lib/mock/catalog";

export const runtime = "nodejs";
export const maxDuration = 60;

function response(body: Record<string, string>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export async function POST(request: Request) {
  const length = request.headers.get("content-length");
  if (length !== null && (!Number.isSafeInteger(Number(length)) || Number(length) > MAX_SELFIE_REQUEST_BYTES)) {
    return response({ error: "That upload is larger than 8 MB." }, 413);
  }
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return response({ error: "We couldn’t read the uploaded form." }, 400);
  }
  const image = form.get("image");
  const productId = form.get("productId");
  if (!(image instanceof File) || typeof productId !== "string") {
    return response({ error: "A selfie and product are required." }, 400);
  }
  const validation = validateSelfieFile(image);
  if (!validation.ok) return response({ error: validation.message }, 415);
  const product = sampleLipstickCatalog.find((item) => item.id === productId);
  if (!product) return response({ error: "That product is not available." }, 404);
  if (process.env.GLOWCART_LIVE_DEPLOYMENT !== "protected") {
    return response(
      { error: "Live virtual try-on is available only on a protected deployment." },
      503,
    );
  }
  try {
    const resultUrl = await createLipstickVto(image, product, request.signal);
    return NextResponse.json(
      { mode: "live", resultUrl },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof YouCamVtoError) {
      if (error.status === 422 || error.status === 504) {
        return response({ error: error.message }, error.status);
      }
    }
    if (isAbortError(error)) {
      return response(
        { error: "Live virtual try-on took too long to respond. Please try again." },
        504,
      );
    }
    return response({ error: "Live virtual try-on is temporarily unavailable." }, 503);
  }
}
