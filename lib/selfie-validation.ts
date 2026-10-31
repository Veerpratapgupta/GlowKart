export const MAX_SELFIE_BYTES = 8 * 1024 * 1024;

export const ALLOWED_SELFIE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type SelfieValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export function validateSelfieFile(file: {
  type: string;
  size: number;
}): SelfieValidationResult {
  if (!(ALLOWED_SELFIE_TYPES as readonly string[]).includes(file.type)) {
    return {
      ok: false,
      message: "That file type is not supported. Choose a JPG, PNG, or WebP image.",
    };
  }
  if (file.size === 0) {
    return {
      ok: false,
      message: "That file looks empty. Choose another photo.",
    };
  }
  if (file.size > MAX_SELFIE_BYTES) {
    return {
      ok: false,
      message: "That image is larger than 8 MB. Choose a smaller photo.",
    };
  }
  return { ok: true };
}
