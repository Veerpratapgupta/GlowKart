import type {
  AnalysisPhase,
  FlowStepId,
  SkinSnapshot,
  ShoppingPreferences,
  VtoPhase,
  VtoSource,
} from "@/lib/types";

export interface JourneyState {
  step: FlowStepId;
  selfieUrl: string | null;
  analysis: SkinSnapshot | null;
  analysisPhase: AnalysisPhase;
  selectedProductId: string | null;
  cartProductIds: string[];
  captureError: string | null;
  vtoPhase: VtoPhase;
  vtoSource: VtoSource | null;
  vtoResultUrl: string | null;
  vtoDemoFaceUrl: string | null;
  vtoError: string | null;
  preferences: ShoppingPreferences;
}

export type JourneyAction =
  | { type: "start" }
  | { type: "photoAccepted"; url: string }
  | { type: "captureFailed"; message: string }
  | { type: "analysisCancelled" }
  | { type: "analysisFailed"; message: string }
  | { type: "analysisReady"; snapshot: SkinSnapshot }
  | { type: "setPreferences"; preferences: ShoppingPreferences }
  | { type: "vtoLoading" }
  | { type: "vtoCancelled" }
  | {
      type: "vtoReady";
      resultUrl: string;
      source: VtoSource;
      demoFaceUrl?: string;
    }
  | { type: "vtoFailed"; message: string }
  | { type: "selectProduct"; productId: string }
  | { type: "addToCart"; productId: string }
  | { type: "removeFromCart"; productId: string }
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
  vtoPhase: "idle",
  vtoSource: null,
  vtoResultUrl: null,
  vtoDemoFaceUrl: null,
  vtoError: null,
  preferences: { finish: "sheer", occasion: "everyday" },
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
      return state.selectedProductId !== null;
    case "result":
      return state.selectedProductId !== null && state.vtoPhase === "ready";
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
        vtoPhase: "idle",
        vtoSource: null,
        vtoResultUrl: null,
        vtoDemoFaceUrl: null,
        vtoError: null,
      };
    case "captureFailed":
      return { ...state, captureError: action.message };
    case "analysisCancelled":
      if (state.analysisPhase !== "loading") return state;
      return {
        ...state,
        analysisPhase: "idle",
        captureError: null,
      };
    case "analysisFailed":
      return {
        ...state,
        analysisPhase: "idle",
        captureError: action.message,
      };
    case "analysisReady":
      if (state.analysisPhase !== "loading") return state;
      return {
        ...state,
        step: "snapshot",
        analysis: action.snapshot,
        analysisPhase: "ready",
        captureError: null,
      };
    case "setPreferences":
      return { ...state, preferences: action.preferences };
    case "selectProduct":
      if (
        (state.step !== "matches" && state.step !== "tryOn") ||
        state.analysisPhase !== "ready" ||
        state.analysis === null
      ) {
        return state;
      }
      return {
        ...state,
        step: "tryOn",
        selectedProductId: action.productId,
        vtoPhase: "idle",
        vtoSource: null,
        vtoResultUrl: null,
        vtoDemoFaceUrl: null,
        vtoError: null,
      };
    case "vtoLoading":
      return {
        ...state,
        vtoPhase: "loading",
        vtoSource: null,
        vtoResultUrl: null,
        vtoDemoFaceUrl: null,
        vtoError: null,
      };
    case "vtoCancelled":
      if (state.vtoPhase !== "loading") return state;
      return {
        ...state,
        vtoPhase: "idle",
        vtoSource: null,
        vtoResultUrl: null,
        vtoDemoFaceUrl: null,
        vtoError: null,
      };
    case "vtoReady":
      return {
        ...state,
        vtoPhase: "ready",
        vtoSource: action.source,
        vtoResultUrl: action.resultUrl,
        vtoDemoFaceUrl: action.demoFaceUrl ?? null,
        vtoError: null,
      };
    case "vtoFailed":
      return {
        ...state,
        vtoPhase: "error",
        vtoSource: null,
        vtoResultUrl: null,
        vtoDemoFaceUrl: null,
        vtoError: action.message,
      };
    case "addToCart":
      if (state.cartProductIds.includes(action.productId)) return state;
      return {
        ...state,
        cartProductIds: [...state.cartProductIds, action.productId],
      };
    case "removeFromCart":
      if (!state.cartProductIds.includes(action.productId)) return state;
      return {
        ...state,
        cartProductIds: state.cartProductIds.filter(
          (id) => id !== action.productId,
        ),
      };
    case "navigate":
      if (!canNavigate(state, action.step)) return state;
      return {
        ...state,
        step: action.step,
        analysisPhase:
          state.step === "capture" &&
          action.step !== "capture" &&
          state.analysisPhase === "loading"
            ? "idle"
            : state.analysisPhase,
        vtoPhase:
          state.step === "tryOn" &&
          action.step !== "tryOn" &&
          state.vtoPhase === "loading"
            ? "idle"
            : state.vtoPhase,
        vtoSource:
          state.step === "tryOn" &&
          action.step !== "tryOn" &&
          state.vtoPhase === "loading"
            ? null
            : state.vtoSource,
        vtoResultUrl:
          state.step === "tryOn" &&
          action.step !== "tryOn" &&
          state.vtoPhase === "loading"
            ? null
            : state.vtoResultUrl,
        vtoDemoFaceUrl:
          state.step === "tryOn" &&
          action.step !== "tryOn" &&
          state.vtoPhase === "loading"
            ? null
            : state.vtoDemoFaceUrl,
        vtoError:
          state.step === "tryOn" &&
          action.step !== "tryOn" &&
          state.vtoPhase === "loading"
            ? null
            : state.vtoError,
      };
    case "restart":
      return { ...initialJourneyState };
  }
}
