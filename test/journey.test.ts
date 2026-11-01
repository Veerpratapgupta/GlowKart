import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
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

test("selecting another shade from the preview re-enters the preview", () => {
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
  const switchedState = journeyReducer(previewState, {
    type: "selectProduct",
    productId: "soft-berry-tint",
  });

  assert.equal(switchedState.step, "tryOn");
  assert.equal(switchedState.selectedProductId, "soft-berry-tint");
  assert.equal(switchedState.vtoPhase, "idle");
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

test("cancelling VTO clears loading and recorded results unlock the keep action", () => {
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
    type: "vtoReady",
    resultUrl: "/demo/vto-sun-coral.jpg",
    source: "recorded",
    demoFaceUrl: "/demo/demo-selfie.jpg",
  });

  assert.equal(cancelledState.vtoPhase, "idle");
  assert.equal(cancelledState.vtoSource, null);
  assert.equal(recordedState.vtoPhase, "ready");
  assert.equal(recordedState.vtoSource, "recorded");
  assert.equal(recordedState.vtoResultUrl, "/demo/vto-sun-coral.jpg");
  assert.equal(recordedState.vtoDemoFaceUrl, "/demo/demo-selfie.jpg");
});

test("keeps all recorded demo images as non-empty JPEG assets", () => {
  for (const asset of [
    "demo-selfie.jpg",
    "vto-sun-coral.jpg",
    "vto-soft-berry.jpg",
    "vto-peach-nude.jpg",
  ]) {
    const path = resolve(process.cwd(), "public/demo", asset);
    assert.ok(statSync(path).size > 0, `${asset} should not be empty`);
    const bytes = readFileSync(path);
    assert.equal(bytes[0], 0xff, `${asset} should start with a JPEG marker`);
    assert.equal(bytes[1], 0xd8, `${asset} should start with a JPEG marker`);
    assert.equal(
      bytes[bytes.length - 2],
      0xff,
      `${asset} should end with a JPEG marker`,
    );
    assert.equal(
      bytes[bytes.length - 1],
      0xd9,
      `${asset} should end with a JPEG marker`,
    );
  }
});

test("keeps the locked stock-face disclosure copy", () => {
  const captureStep = readFileSync(
    resolve(process.cwd(), "components/flow/CaptureStep.tsx"),
    "utf8",
  );
  assert.match(
    captureStep,
    /Demo face · stock photo · not a customer or endorser\./,
  );
  const resultStep = readFileSync(
    resolve(process.cwd(), "components/flow/ResultStep.tsx"),
    "utf8",
  );
  assert.match(resultStep, /not a\s+fresh personalized render\./);
  const demoJourney = readFileSync(
    resolve(process.cwd(), "components/flow/DemoJourney.tsx"),
    "utf8",
  );
  assert.match(demoJourney, /beforeImageUrl=\{state\.selfieUrl\}/);
});
