import { useEffect, useRef, useState } from "react";
import { Action } from "@/components/ui/Action";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { ProductSwatch } from "@/components/ui/ProductSwatch";
import { formatUsd } from "@/lib/format";
import type { Product } from "@/lib/types";
import { StepShell } from "./StepShell";

interface ResultStepProps {
  product: Product;
  reason: string | null;
  cartProducts: Product[];
  isInCart: boolean;
  onAddToCart: (product: Product) => void;
  onBuildAnother: () => void;
}

export function ResultStep({
  product,
  reason,
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
      meta={<DemoBadge label="Prototype cart · sample products" />}
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
