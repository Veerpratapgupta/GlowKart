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
import { sampleLipstickCatalog } from "@/lib/mock/catalog";
import { recommendLipsticks } from "@/lib/recommendations";
import {
  getAnalysisErrorMessage,
  getVtoErrorMessage,
} from "@/lib/analysis-errors";
import {
  downscaledDimensions,
  MAX_ANALYSIS_IMAGE_DIMENSION,
} from "@/lib/image-normalization";
import { validateSelfieFile } from "@/lib/selfie-validation";
import type {
  FlowStepId,
  Product,
  SkinAnalysisResponse,
  ShoppingPreferences,
  VirtualTryOnResponse,
} from "@/lib/types";

const MAX_CLIENT_IMAGE_BYTES = 3.5 * 1024 * 1024;
const ORIGINAL_IMAGE_MAX_BYTES = 3.2 * 1024 * 1024;

async function normalizeAnalysisImage(file: File): Promise<File> {
  const objectUrl = URL.createObjectURL(file);
  let bitmap: ImageBitmap | null = null;
  try {
    let source: CanvasImageSource;
    if (typeof createImageBitmap === "function") {
      try {
        bitmap = await createImageBitmap(file, {
          imageOrientation: "from-image",
        });
        source = bitmap;
      } catch {
        const image = new Image();
        image.src = objectUrl;
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () => reject(new Error("image-load-failed"));
        });
        source = image;
      }
    } else {
      const image = new Image();
      image.src = objectUrl;
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("image-load-failed"));
      });
      source = image;
    }

    const sourceWidth = bitmap?.width ?? (source as HTMLImageElement).naturalWidth;
    const sourceHeight =
      bitmap?.height ?? (source as HTMLImageElement).naturalHeight;
    if (
      Math.max(sourceWidth, sourceHeight) <= MAX_ANALYSIS_IMAGE_DIMENSION &&
      file.size <= ORIGINAL_IMAGE_MAX_BYTES
    ) {
      return file;
    }

    const dimensions = downscaledDimensions({
      width: sourceWidth,
      height: sourceHeight,
    });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("canvas-unavailable");
    const drawingContext = context;

    async function convert(
      width: number,
      height: number,
      quality: number,
    ): Promise<Blob> {
      canvas.width = width;
      canvas.height = height;
      drawingContext.clearRect(0, 0, width, height);
      drawingContext.drawImage(source, 0, 0, width, height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality),
      );
      if (!blob) throw new Error("image-conversion-failed");
      return blob;
    }

    let blob = await convert(dimensions.width, dimensions.height, 0.85);
    if (blob.size > MAX_CLIENT_IMAGE_BYTES) {
      const smaller = downscaledDimensions(
        { width: sourceWidth, height: sourceHeight },
        1280,
      );
      blob = await convert(smaller.width, smaller.height, 0.8);
    }
    if (blob.size > MAX_CLIENT_IMAGE_BYTES) {
      throw new Error("image-too-large");
    }
    return new File([blob], "glowcart-selfie.jpg", { type: "image/jpeg" });
  } finally {
    bitmap?.close();
    URL.revokeObjectURL(objectUrl);
  }
}

export function DemoJourney() {
  const [state, dispatch] = useReducer(journeyReducer, initialJourneyState);
  const selfieUrlRef = useRef<string | null>(null);
  const selfieFileRef = useRef<File | null>(null);
  const analysisRequestRef = useRef(0);
  const analysisControllerRef = useRef<AbortController | null>(null);
  const vtoControllerRef = useRef<AbortController | null>(null);
  const vtoRequestRef = useRef(0);
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
      analysisRequestRef.current += 1;
      analysisControllerRef.current?.abort();
      vtoControllerRef.current?.abort();
      if (selfieUrlRef.current) {
        URL.revokeObjectURL(selfieUrlRef.current);
      }
      selfieFileRef.current = null;
    };
  }, []);

  const revokeCurrentUrl = useCallback(() => {
    if (selfieUrlRef.current) {
      URL.revokeObjectURL(selfieUrlRef.current);
      selfieUrlRef.current = null;
    }
    selfieFileRef.current = null;
  }, []);

  const handleFileAccepted = useCallback(
    async (file: File) => {
      const validation = validateSelfieFile(file);
      if (!validation.ok) {
        dispatch({ type: "captureFailed", message: validation.message });
        return;
      }

      let analysisFile: File;
      try {
        analysisFile = await normalizeAnalysisImage(file);
      } catch {
        dispatch({
          type: "captureFailed",
          message: "We couldn’t prepare that photo. Choose another image.",
        });
        return;
      }

      let url: string;
      try {
        url = URL.createObjectURL(analysisFile);
      } catch {
        dispatch({
          type: "captureFailed",
          message: "We couldn’t read that photo.",
        });
        return;
      }

      revokeCurrentUrl();
      selfieFileRef.current = analysisFile;
      selfieUrlRef.current = url;
      dispatch({ type: "photoAccepted", url });

      const requestId = analysisRequestRef.current + 1;
      analysisRequestRef.current = requestId;
      analysisControllerRef.current?.abort();
      const controller = new AbortController();
      analysisControllerRef.current = controller;
      const timeoutId = window.setTimeout(() => controller.abort(), 50_000);
      const formData = new FormData();
      formData.append("image", analysisFile);

      void fetch("/api/skin-analysis", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      })
        .then(async (response) => {
          let payload: unknown;
          try {
            payload = await response.json();
          } catch {
            throw new Error("The analysis response was incomplete.");
          }
          if (!response.ok) {
            const message =
              typeof payload === "object" &&
              payload !== null &&
              "error" in payload &&
              typeof payload.error === "string"
                ? payload.error
                : "We couldn’t analyze that photo. Please try again.";
            throw new Error(message);
          }
          return payload;
        })
        .then((payload) => {
          if (requestId !== analysisRequestRef.current) return;
          if (!isSkinAnalysisResponse(payload)) {
            throw new Error("The analysis response was incomplete.");
          }
          dispatch({
            type: "analysisReady",
            snapshot: payload.snapshot,
          });
        })
        .catch((error: unknown) => {
          if (requestId !== analysisRequestRef.current) return;
          dispatch({
            type: "analysisFailed",
            message: getAnalysisErrorMessage(
              error,
              controller.signal.aborted && requestId === analysisRequestRef.current,
            ),
          });
        })
        .finally(() => {
          window.clearTimeout(timeoutId);
          if (analysisControllerRef.current === controller) {
            analysisControllerRef.current = null;
          }
        });
    },
    [revokeCurrentUrl],
  );

  function isSkinAnalysisResponse(
    payload: unknown,
  ): payload is SkinAnalysisResponse {
    if (typeof payload !== "object" || payload === null) return false;
    if (!("snapshot" in payload) || !("mode" in payload)) return false;
    const response = payload as {
      mode?: unknown;
      snapshot?: unknown;
    };
    if (response.mode !== "recorded" && response.mode !== "live") {
      return false;
    }
    if (typeof response.snapshot !== "object" || response.snapshot === null) {
      return false;
    }
    const snapshot = response.snapshot as {
      source?: unknown;
      disclaimer?: unknown;
      observations?: unknown;
    };
    return (
      snapshot.source === response.mode &&
      typeof snapshot.disclaimer === "string" &&
      Array.isArray(snapshot.observations) &&
      snapshot.observations.every(
        (observation) =>
          typeof observation === "object" &&
          observation !== null &&
          "id" in observation &&
          "title" in observation &&
          "detail" in observation &&
          isConcernId(observation.id) &&
          typeof observation.title === "string" &&
          typeof observation.detail === "string" &&
          (!("uiScore" in observation) ||
            typeof observation.uiScore === "number"),
      )
    );
  }

  function isConcernId(value: unknown): value is SkinAnalysisResponse["snapshot"]["observations"][number]["id"] {
    return (
      value === "acne" ||
      value === "pore" ||
      value === "moisture" ||
      value === "undertone-warm" ||
      value === "dryness-mild" ||
      value === "contrast-soft"
    );
  }

  const handleNavigate = useCallback(
    (step: FlowStepId) => {
      if (
        state.step === "capture" &&
        state.analysisPhase === "loading" &&
        step !== "capture"
      ) {
        analysisRequestRef.current += 1;
        analysisControllerRef.current?.abort();
        analysisControllerRef.current = null;
        dispatch({ type: "analysisCancelled" });
      }
      if (state.step === "tryOn" && step !== "tryOn") {
        vtoRequestRef.current += 1;
        vtoControllerRef.current?.abort();
        vtoControllerRef.current = null;
        dispatch({ type: "vtoCancelled" });
      }
      dispatch({ type: "navigate", step });
    },
    [state.analysisPhase, state.step],
  );

  const handleRestart = useCallback(() => {
    analysisRequestRef.current += 1;
    analysisControllerRef.current?.abort();
    analysisControllerRef.current = null;
    vtoRequestRef.current += 1;
    vtoControllerRef.current?.abort();
    vtoControllerRef.current = null;
    dispatch({ type: "analysisCancelled" });
    dispatch({ type: "vtoCancelled" });
    revokeCurrentUrl();
    dispatch({ type: "restart" });
  }, [revokeCurrentUrl]);

  const requestVto = useCallback(
    (product: Product) => {
      const imageFile = selfieFileRef.current;
      if (!imageFile) {
        dispatch({
          type: "vtoFailed",
          message: "Your selfie is no longer available. Please choose it again.",
        });
        return;
      }
      const requestId = vtoRequestRef.current + 1;
      vtoRequestRef.current = requestId;
      vtoControllerRef.current?.abort();
      const controller = new AbortController();
      vtoControllerRef.current = controller;
      dispatch({ type: "vtoLoading" });
      const timeoutId = window.setTimeout(() => controller.abort(), 55_000);
      void fetch("/api/virtual-try-on", {
        method: "POST",
        body: (() => {
          const form = new FormData();
          form.append("image", imageFile);
          form.append("productId", product.id);
          return form;
        })(),
        signal: controller.signal,
      })
        .then(async (response) => {
          const payload: unknown = await response.json();
          if (!response.ok || !isVirtualTryOnResponse(payload)) {
            const errorPayload =
              typeof payload === "object" && payload !== null && "error" in payload
                ? payload.error
                : null;
            throw new Error(
              typeof errorPayload === "string"
                ? errorPayload
                : "We couldn’t render this shade.",
            );
          }
          return payload;
        })
        .then((payload) => {
          if (requestId === vtoRequestRef.current) {
            dispatch({
              type: "vtoReady",
              resultUrl: payload.resultUrl,
              source: payload.mode,
              demoFaceUrl: payload.demoFaceUrl,
            });
          }
        })
        .catch((error: unknown) => {
          if (requestId !== vtoRequestRef.current) return;
          dispatch({
            type: "vtoFailed",
            message: getVtoErrorMessage(
              error,
              controller.signal.aborted && requestId === vtoRequestRef.current,
            ),
          });
        })
        .finally(() => {
          window.clearTimeout(timeoutId);
          if (vtoControllerRef.current === controller) {
            vtoControllerRef.current = null;
          }
        });
    },
    [],
  );

  function isVirtualTryOnResponse(
    payload: unknown,
  ): payload is VirtualTryOnResponse {
    if (typeof payload !== "object" || payload === null) return false;
    if (!("mode" in payload) || !("resultUrl" in payload)) return false;
    const response = payload as {
      mode?: unknown;
      resultUrl?: unknown;
      demoFaceUrl?: unknown;
    };
    return (
      (response.mode === "recorded" || response.mode === "live") &&
      typeof response.resultUrl === "string" &&
      (!("demoFaceUrl" in response) || typeof response.demoFaceUrl === "string")
    );
  }

  const handleSelectProduct = useCallback((product: Product) => {
    dispatch({ type: "selectProduct", productId: product.id });
    requestVto(product);
  }, [requestVto]);

  const recommendations = state.analysis
    ? recommendLipsticks(state.analysis, sampleLipstickCatalog, state.preferences)
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
            preferences={state.preferences}
            onPreferencesChange={(preferences: ShoppingPreferences) =>
              dispatch({ type: "setPreferences", preferences })
            }
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
            vtoPhase={state.vtoPhase}
            vtoSource={state.vtoSource}
            vtoResultUrl={state.vtoResultUrl}
            vtoError={state.vtoError}
            onRetry={() => requestVto(selectedProduct)}
            onResultError={() =>
              dispatch({
                type: "vtoFailed",
                message: "The rendered preview could not be loaded. Please try again.",
              })
            }
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
            snapshot={state.analysis}
            beforeImageUrl={
              state.vtoSource === "recorded"
                ? state.vtoDemoFaceUrl
                : state.selfieUrl
            }
            resultUrl={state.vtoResultUrl}
            vtoSource={state.vtoSource}
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
