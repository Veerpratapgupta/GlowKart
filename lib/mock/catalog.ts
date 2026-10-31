import type { Product } from "../types";

export const sampleLipstickCatalog: Product[] = [
  {
    id: "sun-coral-balm",
    brand: "Aurelia Lab",
    name: "Sheer Color Balm",
    shadeName: "Sun Coral",
    priceUsd: 24,
    benefit: "A sheer wash of warm coral with a comfortable balm finish.",
    targetConcernIds: ["undertone-warm", "dryness-mild"],
    swatchHex: "#d9603f",
  },
  {
    id: "soft-berry-tint",
    brand: "Aurelia Lab",
    name: "Cushion Lip Tint",
    shadeName: "Soft Berry",
    priceUsd: 26,
    benefit: "A buildable berry tint that keeps lips looking hydrated.",
    targetConcernIds: ["contrast-soft", "dryness-mild"],
    swatchHex: "#9d3a52",
  },
  {
    id: "peach-nude-cream",
    brand: "Aurelia Lab",
    name: "Cream Lip Color",
    shadeName: "Peach Nude",
    priceUsd: 22,
    benefit: "A neutral peach that defines lips without overpowering them.",
    targetConcernIds: ["undertone-warm", "contrast-soft"],
    swatchHex: "#c97f63",
  },
];
