export const MAX_ANALYSIS_IMAGE_DIMENSION = 1600;

export interface ImageDimensions {
  width: number;
  height: number;
}

export function downscaledDimensions(
  dimensions: ImageDimensions,
  maxDimension = MAX_ANALYSIS_IMAGE_DIMENSION,
): ImageDimensions {
  if (
    !Number.isFinite(dimensions.width) ||
    !Number.isFinite(dimensions.height) ||
    dimensions.width <= 0 ||
    dimensions.height <= 0 ||
    !Number.isFinite(maxDimension) ||
    maxDimension <= 0
  ) {
    throw new Error("Invalid image dimensions.");
  }

  const longestSide = Math.max(dimensions.width, dimensions.height);
  const scale = Math.min(1, maxDimension / longestSide);
  return {
    width: Math.max(1, Math.round(dimensions.width * scale)),
    height: Math.max(1, Math.round(dimensions.height * scale)),
  };
}
