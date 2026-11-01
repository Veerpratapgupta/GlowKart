export type ConcernId =
  | "undertone-warm"
  | "dryness-mild"
  | "contrast-soft"
  | "acne"
  | "pore"
  | "moisture";

export interface SkinObservation {
  id: ConcernId;
  title: string;
  detail: string;
  uiScore?: number;
}

export interface SkinSnapshot {
  source: "recorded" | "live";
  disclaimer: string;
  observations: SkinObservation[];
}

export interface SkinAnalysisResponse {
  mode: "recorded" | "live";
  snapshot: SkinSnapshot;
}

export interface VirtualTryOnResponse {
  mode: VtoSource;
  resultUrl: string;
  demoFaceUrl?: string;
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
  finish: FinishPreference;
  occasion: OccasionPreference;
}

export type FinishPreference = "sheer" | "satin" | "matte";
export type OccasionPreference = "everyday" | "bold";

export interface ShoppingPreferences {
  finish: FinishPreference;
  occasion: OccasionPreference;
}

export interface Recommendation {
  product: Product;
  isPrimary: boolean;
  matchedConcernIds: ConcernId[];
  reason: string;
  evidence: {
    noticed: string;
    offers: string;
    startingPoint: string;
  };
}

export type FlowStepId =
  | "discover"
  | "capture"
  | "snapshot"
  | "matches"
  | "tryOn"
  | "result";

export type AnalysisPhase = "idle" | "loading" | "ready";
export type VtoPhase = "idle" | "loading" | "ready" | "error";
export type VtoSource = "recorded" | "live";
