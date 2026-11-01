import { useEffect, useState } from "react";
import { Action } from "@/components/ui/Action";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { Notice } from "@/components/ui/Notice";
import { ProductSwatch } from "@/components/ui/ProductSwatch";
import { readableTextColor } from "@/lib/color";
import { formatUsd } from "@/lib/format";
import type { Product, VtoPhase, VtoSource } from "@/lib/types";
import { StepShell } from "./StepShell";

interface TryOnStepProps {
  selfieUrl: string | null;
  product: Product;
  reason: string | null;
  onKeep: () => void;
  onTryAnother: () => void;
  vtoPhase: VtoPhase;
  vtoSource: VtoSource | null;
  vtoResultUrl: string | null;
  vtoError: string | null;
  onRetry: () => void;
  onResultError: () => void;
}

export function TryOnStep({
  selfieUrl,
  product,
  reason,
  onKeep,
  onTryAnother,
  vtoPhase,
  vtoSource,
  vtoResultUrl,
  vtoError,
  onRetry,
  onResultError,
}: TryOnStepProps) {
  const [recordedAssetMissing, setRecordedAssetMissing] = useState(false);

  useEffect(() => {
    setRecordedAssetMissing(false);
  }, [product.id, vtoResultUrl]);

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
              ? "Recorded YouCam VTO · demo face"
              : vtoSource === "live"
                ? "Live YouCam VTO"
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
          {vtoPhase === "ready" && vtoSource === "recorded" ? (
            <div className="grid gap-px bg-line sm:grid-cols-2">
              <figure className="bg-paper-deep">
                {selfieUrl ? (
                  <img
                    src={selfieUrl}
                    alt="Your uploaded selfie"
                    className="aspect-[4/5] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[4/5] items-center justify-center px-5 text-center text-sm text-stone-deep">
                    Your uploaded photo is unavailable.
                  </div>
                )}
                <figcaption className="border-t border-line px-4 py-3 text-[0.8rem] font-medium text-stone-deep">
                  Your photo
                </figcaption>
              </figure>
              <figure className="bg-paper-deep">
                {vtoResultUrl && !recordedAssetMissing ? (
                  <img
                    key={vtoResultUrl}
                    src={vtoResultUrl}
                    alt={`Recorded YouCam preview of ${product.shadeName} on a demo face`}
                    className="aspect-[4/5] w-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={() => setRecordedAssetMissing(true)}
                  />
                ) : selfieUrl ? (
                  <div className="relative aspect-[4/5] w-full overflow-hidden">
                    <img
                      src={selfieUrl}
                      alt={`Your uploaded selfie paired with a ${product.shadeName} color simulation`}
                      className="h-full w-full object-cover"
                    />
                    <div
                      className="absolute inset-x-0 bottom-0 h-[46%] opacity-25 mix-blend-multiply"
                      style={{ backgroundColor: product.swatchHex }}
                      aria-hidden="true"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[4/5] items-center justify-center px-5 text-center text-sm text-stone-deep">
                    Recorded preview unavailable.
                  </div>
                )}
                <figcaption className="border-t border-line px-4 py-3 text-[0.8rem] font-medium text-stone-deep">
                  Recorded reference · demo face
                </figcaption>
              </figure>
            </div>
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

        {vtoPhase === "loading" ? (
          <Notice tone="info" title="Rendering your shade">
            {vtoSource === "recorded"
              ? "Loading the recorded YouCam preview."
              : "YouCam is preparing a live lipstick preview."}
          </Notice>
        ) : null}
        {vtoPhase === "ready" &&
        vtoSource === "recorded" &&
        !recordedAssetMissing ? (
          <Notice tone="info" title="Recorded preview simulation">
            This recorded YouCam result uses the labeled demo face rather than
            a fresh render of your photo.
          </Notice>
        ) : null}
        {vtoPhase === "ready" &&
        vtoSource === "recorded" &&
        recordedAssetMissing ? (
          <Notice tone="info" title="Recorded asset unavailable">
            The saved preview is not available yet, so this labeled swatch
            fallback is for shade direction only.
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
