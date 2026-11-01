import assert from "node:assert/strict";
import test from "node:test";
import {
  downscaledDimensions,
  MAX_ANALYSIS_IMAGE_DIMENSION,
} from "../lib/image-normalization";

test("downscales landscape dimensions to the maximum longest side", () => {
  assert.deepEqual(downscaledDimensions({ width: 3200, height: 2000 }), {
    width: 1600,
    height: 1000,
  });
});

test("downscales portrait dimensions proportionally", () => {
  assert.deepEqual(downscaledDimensions({ width: 1000, height: 2400 }), {
    width: 667,
    height: 1600,
  });
});

test("never upscales small images", () => {
  const dimensions = { width: 320, height: 480 };
  assert.deepEqual(downscaledDimensions(dimensions), dimensions);
  assert.equal(
    Math.max(
      ...Object.values(downscaledDimensions({ width: 4000, height: 2000 })),
    ),
    MAX_ANALYSIS_IMAGE_DIMENSION,
  );
});
