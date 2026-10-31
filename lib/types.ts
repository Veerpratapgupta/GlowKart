export type ConcernId =
  | "undertone-warm"
  | "dryness-mild"
  | "contrast-soft";

export interface SkinObservation {
  id: ConcernId;
  title: string;
  detail: string;
}

export interface SkinSnapshot {
  source: "demo";
  disclaimer: string;
  observations: SkinObservation[];
}

export interface Product {
  id: string;
  brand: string;
  name: string;
  shadeName: string;
  priceUsd: number;
  benefit: string;
  targetConcernIds: ConcernId[];
  swatchHex: string;
}

export interface Recommendation {
  product: Product;
  isPrimary: boolean;
  matchedConcernIds: ConcernId[];
  reason: string;
}

export type FlowStepId =
  | "discover"
  | "capture"
  | "snapshot"
  | "matches"
  | "tryOn"
  | "result";

export type AnalysisPhase = "idle" | "loading" | "ready";
