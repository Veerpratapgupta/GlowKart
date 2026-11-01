import { useEffect, useRef, useState } from "react";
import { Action } from "@/components/ui/Action";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { Notice } from "@/components/ui/Notice";
import { ProductSwatch } from "@/components/ui/ProductSwatch";
import { formatUsd } from "@/lib/format";
import type { Product, SkinSnapshot, VtoSource } from "@/lib/types";
import { StepShell } from "./StepShell";

interface ResultStepProps {
  product: Product;
  reason: string | null;
  snapshot: SkinSnapshot | null;
  selfieUrl: string | null;
  beforeImageUrl: string | null;
  resultUrl: string | null;
  vtoSource: VtoSource | null;
  cartProducts: Product[];
  isInCart: boolean;
  onAddToCart: (product: Product) => void;
  onBuildAnother: () => void;
}

export function ResultStep({
  product,
  reason,
  snapshot,
  selfieUrl,
  beforeImageUrl,
  resultUrl,
  vtoSource,
  cartProducts,
  isInCart,
  onAddToCart,
  onBuildAnother,
}: ResultStepProps) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const previousIsInCart = useRef(isInCart);

  useEffect(() => {
    if (isInCart && !previousIsInCart.current) {
      setStatusMessage(`${product.shadeName} is in your prototype cart.`);
    }
    previousIsInCart.current = isInCart;
  }, [isInCart, product.shadeName]);

  const subtotal = cartProducts.reduce(
    (sum, item) => sum + item.priceUsd,
    0,
  );

  return (
    <StepShell
      title="Your edit"
      lede="The look you kept, with a lightweight prototype cart. No account, no checkout."
      meta={
        <DemoBadge
          label={
            vtoSource === "recorded"
              ? "Recorded shade direction · your photo"
              : "Live YouCam VTO"
          }
        />
      }
      actions={
        <>
          <Action
            variant="lip"
            onClick={() => onAddToCart(product)}
            disabled={isInCart}
          >
            {isInCart ? "In your cart" : "Add to cart"}
          </Action>
          <Action variant="quiet" onClick={onBuildAnother}>
            Build another look
          </Action>
        </>
      }
    >
      <div className="space-y-6">
        <section aria-label="Before and after preview" className="border border-ink bg-paper">
          <div className="grid gap-px bg-line sm:grid-cols-2">
            <figure className="bg-paper-deep">
              {beforeImageUrl ? (
                <img
                  src={beforeImageUrl}
                  alt={
                    vtoSource === "recorded"
                      ? "Your uploaded selfie before the recorded lipstick preview"
                      : "Your selfie before lipstick"
                  }
                  className="aspect-[4/5] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[4/5] items-center justify-center px-5 text-center text-sm text-stone-deep">
                  Before image unavailable
                </div>
              )}
              <figcaption className="border-t border-line px-4 py-3 text-[0.8rem] font-medium text-stone-deep">
                Before
              </figcaption>
            </figure>
            <figure className="bg-paper-deep">
              {vtoSource === "recorded" && selfieUrl ? (
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={selfieUrl}
                    alt={`Your uploaded selfie with a ${product.shadeName} shade-direction simulation`}
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
                    Shade direction only · not a lip render
                  </span>
                </div>
              ) : resultUrl ? (
                <img
                  src={resultUrl}
                  alt={`YouCam preview of ${product.shadeName} lipstick`}
                  className="aspect-[4/5] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[4/5] items-center justify-center px-5 text-center text-sm text-stone-deep">
                  Result image unavailable
                </div>
              )}
              <figcaption className="border-t border-line px-4 py-3 text-[0.8rem] font-medium text-stone-deep">
                {vtoSource === "recorded"
                  ? "After direction · your photo"
                  : "After · YouCam VTO"}
              </figcaption>
            </figure>
          </div>
        </section>

        {vtoSource === "recorded" ? (
          <Notice tone="info" title="Recorded shade direction">
            This before/after direction uses your uploaded photo with a labeled
            shade simulation. It is not a fresh personalized render.
          </Notice>
        ) : null}

        <section aria-label="Kept product" className="border border-line bg-paper">
          <div className="flex gap-4 px-5 py-5">
            <ProductSwatch product={product} size="md" />
            <div className="min-w-0">
              <h3 className="font-display text-xl font-medium">
                {product.shadeName}
              </h3>
              <p className="mt-1 text-[0.92rem] text-stone-deep">
                {product.brand} · {product.name}
              </p>
              <p className="mt-2 text-[0.95rem] font-medium">
                {formatUsd(product.priceUsd)}
              </p>
            </div>
          </div>
          {reason ? (
            <p className="border-t border-line px-5 py-4 text-[0.92rem] leading-relaxed">
              <span className="font-medium">Why it works for your starting point: </span>
              <span className="text-stone-deep">{reason}</span>
            </p>
          ) : null}
        </section>

        <section aria-label="AI trail" className="border border-line bg-paper">
          <div className="border-b border-line px-5 py-4">
            <p className="text-[0.78rem] font-medium text-botanic">YouCam Skin AI</p>
            <h3 className="mt-1 font-display text-xl font-medium">
              How this look was chosen
            </h3>
          </div>
          <div className="space-y-4 px-5 py-5">
            {snapshot?.observations.map((observation) => (
              <div key={observation.id} className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{observation.title}</p>
                  <p className="mt-1 text-[0.88rem] leading-relaxed text-stone-deep">
                    {observation.detail}
                  </p>
                </div>
                {observation.uiScore !== undefined ? (
                  <span className="shrink-0 text-[0.85rem] font-medium text-botanic">
                    {observation.uiScore}/100
                  </span>
                ) : null}
              </div>
            ))}
            {reason ? (
              <p className="border-t border-line pt-4 text-[0.92rem] leading-relaxed">
                <span className="font-medium">Rationale: </span>
                <span className="text-stone-deep">{reason}</span>
              </p>
            ) : null}
          </div>
        </section>

        <section aria-label="Prototype cart" className="border border-line bg-paper">
          <h3 className="border-b border-line px-5 py-3 font-display text-lg font-medium">
            Your prototype cart
          </h3>
          {cartProducts.length === 0 ? (
            <p className="px-5 py-5 text-[0.92rem] text-stone-deep">
              Your cart is empty. Add the look you kept to see it here.
            </p>
          ) : (
            <>
              <ul className="divide-y divide-line">
                {cartProducts.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-4 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <p className="text-[0.95rem] font-medium">
                        {item.shadeName}
                      </p>
                      <p className="text-[0.85rem] text-stone-deep">
                        {item.brand} · {item.name}
                      </p>
                    </div>
                    <p className="shrink-0 text-[0.92rem]">
                      {formatUsd(item.priceUsd)}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between border-t border-line px-5 py-4">
                <p className="text-[0.92rem] font-medium">Subtotal</p>
                <p className="text-[0.95rem] font-medium">{formatUsd(subtotal)}</p>
              </div>
            </>
          )}
          <p className="border-t border-line px-5 py-3 text-[0.82rem] text-stone-deep">
            Prototype cart only — no payment or checkout in this demo.
          </p>
        </section>

        <p role="status" aria-live="polite" className="min-h-5 text-[0.9rem] font-medium text-botanic">
          {statusMessage}
        </p>
      </div>
    </StepShell>
  );
}
