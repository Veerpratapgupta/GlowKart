import assert from "node:assert/strict";
import test from "node:test";
import {
  initialJourneyState,
  journeyReducer,
} from "../components/flow/journey";
import type { SkinSnapshot } from "../lib/types";

const snapshot: SkinSnapshot = {
  source: "recorded",
  disclaimer: "Reference only.",
  observations: [
    {
      id: "moisture",
      title: "Good hydration",
      detail: "Reference observation.",
      uiScore: 72,
    },
  ],
};

test("selecting a match enters the shade preview", () => {
  const readyState = journeyReducer(
    journeyReducer(initialJourneyState, { type: "start" }),
    { type: "photoAccepted", url: "blob:photo" },
  );
  const analyzedState = journeyReducer(readyState, {
    type: "analysisReady",
    snapshot,
  });
  const matchesState = journeyReducer(analyzedState, {
    type: "navigate",
    step: "matches",
  });
  const previewState = journeyReducer(matchesState, {
    type: "selectProduct",
    productId: "sun-coral-balm",
  });

  assert.equal(previewState.step, "tryOn");
  assert.equal(previewState.selectedProductId, "sun-coral-balm");
  assert.equal(previewState.vtoPhase, "idle");
  assert.equal(
    journeyReducer(previewState, { type: "navigate", step: "result" }).step,
    "tryOn",
  );
});

test("cancelling analysis clears loading before navigating away", () => {
  const loadingState = journeyReducer(
    journeyReducer(initialJourneyState, { type: "start" }),
    { type: "photoAccepted", url: "blob:photo" },
  );
  const cancelledState = journeyReducer(loadingState, {
    type: "analysisCancelled",
  });
  const navigatedState = journeyReducer(cancelledState, {
    type: "navigate",
    step: "discover",
  });

  assert.equal(cancelledState.analysisPhase, "idle");
  assert.equal(navigatedState.step, "discover");
  assert.equal(navigatedState.analysisPhase, "idle");
});

test("navigation itself resets an in-flight analysis", () => {
  const loadingState = journeyReducer(
    journeyReducer(initialJourneyState, { type: "start" }),
    { type: "photoAccepted", url: "blob:photo" },
  );
  const navigatedState = journeyReducer(loadingState, {
    type: "navigate",
    step: "discover",
  });

  assert.equal(navigatedState.step, "discover");
  assert.equal(navigatedState.analysisPhase, "idle");
});

test("cancelling VTO clears loading and recorded previews unlock the keep action", () => {
  const readyState = journeyReducer(
    journeyReducer(
      journeyReducer(initialJourneyState, { type: "start" }),
      { type: "photoAccepted", url: "blob:photo" },
    ),
    { type: "analysisReady", snapshot },
  );
  const matchesState = journeyReducer(readyState, {
    type: "navigate",
    step: "matches",
  });
  const previewState = journeyReducer(matchesState, {
    type: "selectProduct",
    productId: "sun-coral-balm",
  });
  const loadingState = journeyReducer(previewState, { type: "vtoLoading" });
  const cancelledState = journeyReducer(loadingState, { type: "vtoCancelled" });
  const recordedState = journeyReducer(cancelledState, {
    type: "vtoRecordedReady",
  });

  assert.equal(cancelledState.vtoPhase, "idle");
  assert.equal(cancelledState.vtoSource, null);
  assert.equal(recordedState.vtoPhase, "ready");
  assert.equal(recordedState.vtoSource, "recorded");
});
