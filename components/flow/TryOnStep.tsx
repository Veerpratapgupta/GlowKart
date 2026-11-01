import { Action } from "@/components/ui/Action";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { Notice } from "@/components/ui/Notice";
import { ProductSwatch } from "@/components/ui/ProductSwatch";
import { readableTextColor } from "@/lib/color";
import { formatUsd } from "@/lib/format";
import type { Product, Recommendation, VtoPhase, VtoSource } from "@/lib/types";
import { StepShell } from "./StepShell";

interface TryOnStepProps {
  selfieUrl: string | null;
  product: Product;
  analysisMode: "recorded" | "live";
  reason: string | null;
  shades: Recommendation[];
  onSelectShade: (product: Product) => void;
  onKeep: () => void;
  onTryAnother: () => void;
  vtoPhase: VtoPhase;
  vtoSource: VtoSource | null;
  vtoResultUrl: string | null;
  recordedRenderUrl: string | null;
  demoFaceUrl: string | null;
  vtoError: string | null;
  onRetry: () => void;
  onResultError: () => void;
}

export function TryOnStep({
  selfieUrl,
  product,
  analysisMode,
  reason,
  shades,
  onSelectShade,
  onKeep,
  onTryAnother,
  vtoPhase,
  vtoSource,
  vtoResultUrl,
  recordedRenderUrl,
  demoFaceUrl,
  vtoError,
  onRetry,
  onResultError,
}: TryOnStepProps) {
  const previewReady =
    vtoPhase === "ready" &&
    Boolean(vtoResultUrl) &&
    (vtoSource === "live" || vtoSource === "recorded");

  return (
    <StepShell
      title="Preview the shade"
      lede={`A preview of ${product.shadeName} paired with your photo.`}
      meta={
        <DemoBadge
          label={
            vtoSource === "recorded"
              ? "Recorded shade direction · your photo"
              : vtoSource === "live"
                ? "Live YouCam VTO"
                : analysisMode === "recorded"
                  ? "Recorded YouCam VTO"
                  : "YouCam VTO"
          }
        />
      }
      onBack={onTryAnother}
      backLabel="Try another shade"
      actions={
        <>
          <Action variant="lip" onClick={onKeep} disabled={!previewReady}>
            Keep this shade
          </Action>
          <Action variant="quiet" onClick={onTryAnother}>
            Try another shade
          </Action>
        </>
      }
    >
      <div className="space-y-5">
        <div className="relative overflow-hidden border border-ink bg-paper-deep">
          {vtoPhase === "ready" && vtoSource === "recorded" && recordedRenderUrl ? (
            <figure className="bg-paper-deep">
              <div className="relative aspect-[4/5] overflow-hidden">
                <img
                  key={recordedRenderUrl}
                  src={recordedRenderUrl}
                  alt={`Recorded YouCam VTO render of the demo face wearing ${product.shadeName}`}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={onResultError}
                />
                <span className="absolute inset-x-3 bottom-3 border border-paper/70 bg-ink/75 px-2 py-1 text-center text-[0.7rem] font-medium text-paper">
                  Recorded YouCam VTO · demo face · not your photo
                </span>
              </div>
              <figcaption className="flex items-center gap-3 border-t border-line px-4 py-3 text-[0.8rem] font-medium text-stone-deep">
                {demoFaceUrl ? (
                  <img
                    src={demoFaceUrl}
                    alt="Demo face before the recorded try-on"
                    className="h-10 w-8 border border-line object-cover"
                  />
                ) : null}
                <span>
                  Before (demo face) → After (recorded render) · {product.shadeName}
                </span>
              </figcaption>
            </figure>
          ) : vtoPhase === "ready" && vtoSource === "recorded" ? (
            <figure className="bg-paper-deep">
              {selfieUrl ? (
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={selfieUrl}
                    alt="Your uploaded selfie with a labeled shade-direction simulation"
                    className="h-full w-full object-cover"
                  />
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 opacity-20 mix-blend-multiply"
                    style={{
                      background: `linear-gradient(to top, ${product.swatchHex}, transparent)`,
                    }}
                    aria-hidden="true"
                  />
                  <span className="absolute inset-x-3 bottom-3 border border-paper/70 bg-ink/75 px-2 py-1 text-center text-[0.7rem] font-medium text-paper">
                    Your uploaded photo · shade direction
                  </span>
                </div>
              ) : (
                <div className="flex aspect-[4/5] items-center justify-center px-5 text-center text-sm text-stone-deep">
                  Your uploaded photo is unavailable.
                </div>
              )}
              <figcaption className="border-t border-line px-4 py-3 text-[0.8rem] font-medium text-stone-deep">
                Your photo · shade direction
              </figcaption>
            </figure>
          ) : vtoPhase === "ready" && vtoSource === "live" && vtoResultUrl ? (
            <img
              key={vtoResultUrl}
              src={vtoResultUrl}
              alt={`Your selfie with ${product.shadeName} lipstick applied`}
              className="aspect-[4/5] w-full object-cover"
              referrerPolicy="no-referrer"
              onError={onResultError}
            />
          ) : vtoPhase === "loading" ? (
            <div
              className="flex aspect-[4/5] w-full items-center justify-center bg-paper-deep px-8"
              role="status"
              aria-label="Rendering your selected shade"
            >
              <div className="text-center">
                <div
                  className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-line border-t-lip-deep"
                  aria-hidden="true"
                />
                <p className="mt-4 font-medium">Rendering {product.shadeName}</p>
                <p className="mt-1 text-[0.88rem] text-stone-deep">
                  The preview will appear when the result is ready.
                </p>
              </div>
            </div>
          ) : selfieUrl ? (
            <img
              src={selfieUrl}
              alt={`Your uploaded selfie paired with a ${product.shadeName} color swatch`}
              className="aspect-[4/5] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[4/5] w-full items-center justify-center px-6">
              <p className="text-center text-[0.92rem] text-stone-deep">
                Your photo is unavailable. Go back and add one to preview the
                shade.
              </p>
            </div>
          )}
          {vtoSource !== "recorded" ? (
            <div
              className="absolute inset-x-0 bottom-0 px-5 pt-10 pb-5"
              style={{
                background:
                  "linear-gradient(to top, rgba(36, 28, 23, 0.72), rgba(36, 28, 23, 0))",
              }}
            >
              <p className="font-display text-3xl leading-none font-medium text-paper">
                {product.shadeName}
              </p>
              <div
                className="mt-3 h-2 w-28"
                style={{
                  backgroundColor: product.swatchHex,
                  outline: `1px solid ${readableTextColor(product.swatchHex)}`,
                }}
                aria-hidden="true"
              />
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-4 border border-line bg-paper px-4 py-3">
          <ProductSwatch product={product} size="sm" />
          <div>
            <p className="font-display text-base font-medium">
              {product.brand} · {product.name}
            </p>
            <p className="text-[0.88rem] text-stone-deep">
              {formatUsd(product.priceUsd)}
            </p>
          </div>
        </div>

        {shades.length > 1 ? (
          <div className="border border-line bg-paper px-4 py-3">
            <p className="text-[0.82rem] font-medium text-stone-deep">
              Compare shades
            </p>
            <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Compare shades">
              {shades.map((shade) => {
                const isCurrent = shade.product.id === product.id;
                return (
                  <button
                    key={shade.product.id}
                    type="button"
                    onClick={() => onSelectShade(shade.product)}
                    disabled={isCurrent || vtoPhase === "loading"}
                    aria-pressed={isCurrent}
                    aria-label={`Preview ${shade.product.shadeName}`}
                    className={`border px-3 py-2 text-[0.85rem] font-medium transition-colors disabled:cursor-not-allowed ${
                      isCurrent
                        ? "border-ink bg-ink text-paper"
                        : "border-line hover:border-ink"
                    }`}
                    style={
                      isCurrent
                        ? undefined
                        : {
                            backgroundColor: shade.product.swatchHex,
                            color: readableTextColor(shade.product.swatchHex),
                          }
                    }
                  >
                    {shade.product.shadeName}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {vtoPhase === "loading" ? (
          <Notice tone="info" title="Rendering your shade">
            {analysisMode === "recorded"
              ? "Loading the recorded YouCam preview."
              : "YouCam is preparing a live lipstick preview."}
          </Notice>
        ) : null}
        {vtoPhase === "ready" && vtoSource === "recorded" ? (
          <Notice tone="info" title="Recorded YouCam preview">
            {recordedRenderUrl
              ? "This is a recorded YouCam VTO render of our labeled demo face for this shade (see CREDITS.md). Your uploaded photo is not analyzed in recorded mode, so it is not a fresh render of your photo."
              : "This recorded preview keeps your uploaded photo on screen. It is a labeled shade direction, not a fresh lipstick render."}
          </Notice>
        ) : null}
        {vtoPhase === "error" ? (
          <Notice tone="error" title="Virtual try-on unavailable" alert>
            {vtoError ?? "We couldn’t render this shade."}{" "}
            <button type="button" className="underline" onClick={onRetry}>
              Try again
            </button>
          </Notice>
        ) : null}

        {reason ? (
          <p className="text-[0.92rem] leading-relaxed text-stone-deep">
            <span className="font-medium text-ink">Why this match: </span>
            {reason}
          </p>
        ) : null}
      </div>
    </StepShell>
  );
}
