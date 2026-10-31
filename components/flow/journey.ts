import type {
  AnalysisPhase,
  FlowStepId,
  SkinSnapshot,
} from "@/lib/types";

export interface JourneyState {
  step: FlowStepId;
  selfieUrl: string | null;
  analysis: SkinSnapshot | null;
  analysisPhase: AnalysisPhase;
  selectedProductId: string | null;
  cartProductIds: string[];
  captureError: string | null;
}

export type JourneyAction =
  | { type: "start" }
  | { type: "photoAccepted"; url: string }
  | { type: "captureFailed"; message: string }
  | { type: "analysisReady"; snapshot: SkinSnapshot }
  | { type: "selectProduct"; productId: string }
  | { type: "addToCart"; productId: string }
  | { type: "navigate"; step: FlowStepId }
  | { type: "restart" };

export const initialJourneyState: JourneyState = {
  step: "discover",
  selfieUrl: null,
  analysis: null,
  analysisPhase: "idle",
  selectedProductId: null,
  cartProductIds: [],
  captureError: null,
};

export function canNavigate(state: JourneyState, step: FlowStepId): boolean {
  switch (step) {
    case "discover":
    case "capture":
      return true;
    case "snapshot":
    case "matches":
      return state.analysisPhase === "ready" && state.analysis !== null;
    case "tryOn":
    case "result":
      return state.selectedProductId !== null;
  }
}

export function journeyReducer(
  state: JourneyState,
  action: JourneyAction,
): JourneyState {
  switch (action.type) {
    case "start":
      return { ...state, step: "capture", captureError: null };
    case "photoAccepted":
      return {
        ...state,
        step: "capture",
        selfieUrl: action.url,
        analysis: null,
        analysisPhase: "loading",
        selectedProductId: null,
        captureError: null,
      };
    case "captureFailed":
      return { ...state, captureError: action.message };
    case "analysisReady":
      if (state.analysisPhase !== "loading") return state;
      return {
        ...state,
        step: "snapshot",
        analysis: action.snapshot,
        analysisPhase: "ready",
        captureError: null,
      };
    case "selectProduct":
      if (!canNavigate(state, "tryOn")) return state;
      return {
        ...state,
        step: "tryOn",
        selectedProductId: action.productId,
      };
    case "addToCart":
      if (state.cartProductIds.includes(action.productId)) return state;
      return {
        ...state,
        cartProductIds: [...state.cartProductIds, action.productId],
      };
    case "navigate":
      if (!canNavigate(state, action.step)) return state;
      return { ...state, step: action.step };
    case "restart":
      return { ...initialJourneyState };
  }
}
