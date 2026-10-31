import { Action } from "@/components/ui/Action";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { Notice } from "@/components/ui/Notice";
import { ProductSwatch } from "@/components/ui/ProductSwatch";
import { readableTextColor } from "@/lib/color";
import { formatUsd } from "@/lib/format";
import type { Product, Recommendation } from "@/lib/types";
import { StepShell } from "./StepShell";

interface TryOnStepProps {
  selfieUrl: string | null;
  product: Product;
  reason: string | null;
  onKeep: () => void;
  onTryAnother: () => void;
}

export function TryOnStep({
  selfieUrl,
  product,
  reason,
  onKeep,
  onTryAnother,
}: TryOnStepProps) {
  return (
    <StepShell
      title="Try the look"
      lede={`A preview of ${product.shadeName} beside your photo.`}
      meta={<DemoBadge label="Preview only · try-on not live" />}
      onBack={onTryAnother}
      backLabel="Try another shade"
      actions={
        <>
          <Action variant="lip" onClick={onKeep}>
            Keep this look
          </Action>
          <Action variant="quiet" onClick={onTryAnother}>
            Try another shade
          </Action>
        </>
      }
    >
      <div className="space-y-5">
        <div className="relative overflow-hidden border border-ink bg-paper-deep">
          {selfieUrl ? (
            <img
              src={selfieUrl}
              alt="Your uploaded selfie with the selected shade previewed below"
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

        <Notice tone="info" title="Virtual try-on is not live yet">
          This preview pairs your photo with the selected shade side by side.
          Live virtual try-on arrives in Phase 4 — nothing here is a rendered
          try-on result.
        </Notice>

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
