import { Action } from "@/components/ui/Action";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { Notice } from "@/components/ui/Notice";
import { ProductSwatch } from "@/components/ui/ProductSwatch";
import { formatUsd } from "@/lib/format";
import type { Product, Recommendation } from "@/lib/types";
import { StepShell } from "./StepShell";

interface MatchesStepProps {
  recommendations: Recommendation[];
  selectedProductId: string | null;
  onSelect: (product: Product) => void;
  onBack: () => void;
  onTryAnotherPhoto: () => void;
}

export function MatchesStep({
  recommendations,
  selectedProductId,
  onSelect,
  onBack,
  onTryAnotherPhoto,
}: MatchesStepProps) {
  if (recommendations.length === 0) {
    return (
      <StepShell
        title="No matches yet"
        lede="We couldn’t build a starting point from this snapshot."
        meta={<DemoBadge label="Demo catalog" />}
        onBack={onBack}
        backLabel="Back to snapshot"
        actions={
          <Action variant="botanic" onClick={onTryAnotherPhoto}>
            Try another photo
          </Action>
        }
      >
        <Notice tone="info">
          Start with a new selfie, or go back to review the observations.
        </Notice>
      </StepShell>
    );
  }

  const [primary, ...alternatives] = recommendations;

  return (
    <StepShell
      title="Your lipstick matches"
      lede="One best starting point, with two alternatives worth a look. Every pick explains why it appeared."
      meta={<DemoBadge label="Demo catalog · sample products" />}
      onBack={onBack}
      backLabel="Back to snapshot"
      actions={
        <Action variant="lip" onClick={() => onSelect(primary.product)}>
          Try the best match
        </Action>
      }
    >
      <div className="space-y-8">
        <section
          aria-label="Best starting point"
          className="border border-ink bg-paper"
        >
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
            <p className="text-[0.82rem] font-medium text-botanic">
              Best starting point
            </p>
            <span className="text-[0.82rem] text-stone-deep">
              {formatUsd(primary.product.priceUsd)}
            </span>
          </div>
          <div className="px-5 py-5">
            <ProductSwatch product={primary.product} size="lg" />
            <h3 className="mt-5 font-display text-xl font-medium">
              {primary.product.shadeName}
            </h3>
            <p className="mt-1 text-[0.92rem] text-stone-deep">
              {primary.product.brand} · {primary.product.name}
            </p>
            <p className="mt-3 max-w-[42ch] text-[0.95rem] leading-relaxed">
              {primary.product.benefit}
            </p>
            <div className="mt-4 border-l-4 border-botanic bg-botanic-tint px-4 py-3 text-[0.92rem] leading-relaxed">
              <p className="font-medium text-botanic">Why this match</p>
              <dl className="mt-2 space-y-2">
                <div>
                  <dt className="font-medium">We noticed</dt>
                  <dd>{primary.evidence.noticed}</dd>
                </div>
                <div>
                  <dt className="font-medium">This product offers</dt>
                  <dd>{primary.evidence.offers}</dd>
                </div>
                <div>
                  <dt className="font-medium">Starting point</dt>
                  <dd>{primary.evidence.startingPoint}</dd>
                </div>
              </dl>
            </div>
            {selectedProductId === primary.product.id ? (
              <p className="mt-4 text-[0.88rem] font-medium text-botanic">
                Currently selected
              </p>
            ) : null}
          </div>
        </section>

        {alternatives.length > 0 ? (
          <section aria-label="Alternatives">
            <h3 className="font-display text-lg font-medium">Also worth trying</h3>
            <ul className="mt-4 divide-y divide-line border-y border-line">
              {alternatives.map((alternative) => (
                <li
                  key={alternative.product.id}
                  className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center"
                >
                  <ProductSwatch product={alternative.product} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h4 className="font-display text-lg font-medium">
                        {alternative.product.shadeName}
                      </h4>
                      <span className="text-[0.88rem] text-stone-deep">
                        {alternative.product.brand} ·{" "}
                        {formatUsd(alternative.product.priceUsd)}
                      </span>
                    </div>
                    <p className="mt-1.5 max-w-[46ch] text-[0.92rem] leading-relaxed text-stone-deep">
                      {alternative.product.benefit}
                    </p>
                    <p className="mt-2 text-[0.88rem] text-stone-deep">
                      <span className="font-medium text-ink">Starting point: </span>
                      {alternative.evidence.startingPoint}
                    </p>
                  </div>
                  <Action
                    variant="quiet"
                    onClick={() => onSelect(alternative.product)}
                    className="shrink-0 self-start sm:self-center"
                  >
                    {selectedProductId === alternative.product.id
                      ? "Selected"
                      : "Try this instead"}
                  </Action>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </StepShell>
  );
}
