import type { Product } from "../types";

export const recordedVtoResults = {
  "sun-coral-balm": "/demo/vto-sun-coral.jpg",
  "soft-berry-tint": "/demo/vto-soft-berry.jpg",
  "peach-nude-cream": "/demo/vto-peach-nude.jpg",
} as const satisfies Record<Product["id"], string>;

export const demoFaceUrl = "/demo/demo-selfie.jpg";
