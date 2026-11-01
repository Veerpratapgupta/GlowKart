import { demoSkinSnapshot } from "./skin-snapshot";

export const recordedAnalysisResponse = {
  mode: "recorded" as const,
  snapshot: demoSkinSnapshot,
};
