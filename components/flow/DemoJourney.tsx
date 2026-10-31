"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { CaptureStep } from "./CaptureStep";
import { DiscoverStep } from "./DiscoverStep";
import { MatchesStep } from "./MatchesStep";
import {
  initialJourneyState,
  journeyReducer,
} from "./journey";
import { ResultStep } from "./ResultStep";
import { SnapshotStep } from "./SnapshotStep";
import { StepRail } from "./StepRail";
import { TryOnStep } from "./TryOnStep";
import { demoSkinSnapshot } from "@/lib/mock/skin-snapshot";
import { sampleLipstickCatalog } from "@/lib/mock/catalog";
import { recommendLipsticks } from "@/lib/recommendations";
import { validateSelfieFile } from "@/lib/selfie-validation";
import type { FlowStepId, Product } from "@/lib/types";

export function DemoJourney() {
  const [state, dispatch] = useReducer(journeyReducer, initialJourneyState);
  const selfieUrlRef = useRef<string | null>(null);
  const stepContainerRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    selfieUrlRef.current = state.selfieUrl;
  }, [state.selfieUrl]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    stepContainerRef.current?.focus();
  }, [state.step]);

  useEffect(() => {
    return () => {
      if (selfieUrlRef.current) {
        URL.revokeObjectURL(selfieUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (state.analysisPhase !== "loading") return;
    const timer = window.setTimeout(() => {
      dispatch({ type: "analysisReady", snapshot: demoSkinSnapshot });
    }, 900);
    return () => window.clearTimeout(timer);
  }, [state.analysisPhase]);

  const revokeCurrentUrl = useCallback(() => {
    if (selfieUrlRef.current) {
      URL.revokeObjectURL(selfieUrlRef.current);
      selfieUrlRef.current = null;
    }
  }, []);

  const handleFileAccepted = useCallback(
    (file: File) => {
      const validation = validateSelfieFile(file);
      if (!validation.ok) {
        dispatch({ type: "captureFailed", message: validation.message });
        return;
      }

      let url: string;
      try {
        url = URL.createObjectURL(file);
      } catch {
        dispatch({
          type: "captureFailed",
          message: "We couldn’t read that photo.",
        });
        return;
      }

      revokeCurrentUrl();
      selfieUrlRef.current = url;
      dispatch({ type: "photoAccepted", url });
    },
    [revokeCurrentUrl],
  );

  const handleNavigate = useCallback((step: FlowStepId) => {
    dispatch({ type: "navigate", step });
  }, []);

  const handleRestart = useCallback(() => {
    revokeCurrentUrl();
    dispatch({ type: "restart" });
  }, [revokeCurrentUrl]);

  const handleSelectProduct = useCallback((product: Product) => {
    dispatch({ type: "selectProduct", productId: product.id });
  }, []);

  const recommendations = state.analysis
    ? recommendLipsticks(state.analysis, sampleLipstickCatalog)
    : [];

  const selectedProduct =
    state.selectedProductId !== null
      ? sampleLipstickCatalog.find(
          (product) => product.id === state.selectedProductId,
        ) ?? null
      : null;

  const selectedRecommendation = recommendations.find(
    (item) => item.product.id === state.selectedProductId,
  );

  const cartProducts = state.cartProductIds
    .map((id) => sampleLipstickCatalog.find((product) => product.id === id))
    .filter((product): product is Product => product !== undefined);

  function renderStep() {
    switch (state.step) {
      case "discover":
        return <DiscoverStep onStart={() => dispatch({ type: "start" })} />;
      case "capture":
        return (
          <CaptureStep
            selfieUrl={state.selfieUrl}
            error={state.captureError}
            isAnalyzing={state.analysisPhase === "loading"}
            onFileAccepted={handleFileAccepted}
            onBack={() => handleNavigate("discover")}
            onStartOver={handleRestart}
          />
        );
      case "snapshot":
        if (!state.analysis) {
          return (
            <CaptureStep
              selfieUrl={state.selfieUrl}
              error={state.captureError}
              isAnalyzing={false}
              onFileAccepted={handleFileAccepted}
              onBack={() => handleNavigate("discover")}
              onStartOver={handleRestart}
            />
          );
        }
        return (
          <SnapshotStep
            selfieUrl={state.selfieUrl}
            snapshot={state.analysis}
            onContinue={() => handleNavigate("matches")}
            onBack={() => handleNavigate("capture")}
          />
        );
      case "matches":
        return (
          <MatchesStep
            recommendations={recommendations}
            selectedProductId={state.selectedProductId}
            onSelect={handleSelectProduct}
            onBack={() => handleNavigate("snapshot")}
            onTryAnotherPhoto={() => handleNavigate("capture")}
          />
        );
      case "tryOn":
        if (!selectedProduct) {
          return (
            <MatchesStep
              recommendations={recommendations}
              selectedProductId={state.selectedProductId}
              onSelect={handleSelectProduct}
              onBack={() => handleNavigate("snapshot")}
              onTryAnotherPhoto={() => handleNavigate("capture")}
            />
          );
        }
        return (
          <TryOnStep
            selfieUrl={state.selfieUrl}
            product={selectedProduct}
            reason={selectedRecommendation?.reason ?? null}
            onKeep={() => handleNavigate("result")}
            onTryAnother={() => handleNavigate("matches")}
          />
        );
      case "result":
        if (!selectedProduct) {
          return (
            <MatchesStep
              recommendations={recommendations}
              selectedProductId={state.selectedProductId}
              onSelect={handleSelectProduct}
              onBack={() => handleNavigate("snapshot")}
              onTryAnotherPhoto={() => handleNavigate("capture")}
            />
          );
        }
        return (
          <ResultStep
            product={selectedProduct}
            reason={selectedRecommendation?.reason ?? null}
            cartProducts={cartProducts}
            isInCart={state.cartProductIds.includes(selectedProduct.id)}
            onAddToCart={(product) =>
              dispatch({ type: "addToCart", productId: product.id })
            }
            onBuildAnother={() => handleNavigate("matches")}
          />
        );
    }
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <a
        href="#journey-main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-10 focus:border focus:border-ink focus:bg-paper focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <StepRail
        state={state}
        onNavigate={handleNavigate}
        onStartOver={handleRestart}
      />
      <main
        id="journey-main"
        className="flex-1 px-5 py-10 sm:px-8 md:px-12 md:py-16 lg:px-16"
      >
        <div
          key={state.step}
          ref={stepContainerRef}
          tabIndex={-1}
          className="step-enter outline-none"
        >
          {renderStep()}
        </div>
      </main>
    </div>
  );
}
