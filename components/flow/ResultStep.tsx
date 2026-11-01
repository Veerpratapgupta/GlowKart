import { useEffect, useRef, useState } from "react";
import { Action } from "@/components/ui/Action";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { Notice } from "@/components/ui/Notice";
import { ProductSwatch } from "@/components/ui/ProductSwatch";
import { formatUsd } from "@/lib/format";
import type { Product, SkinSnapshot, VtoSource } from "@/lib/types";
import { StepShell } from "./StepShell";

const EXPORT_WIDTH = 800;
const EXPORT_HEIGHT = 1000;

// Rebuilds the labeled recorded shade-direction preview (photo + bottom swatch
// gradient) on a canvas so the saved file matches what the user saw.
async function composeRecordedLook(
  selfieUrl: string,
  swatchHex: string,
): Promise<Blob> {
  const image = new Image();
  image.src = selfieUrl;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("image-load-failed"));
  });
  const canvas = document.createElement("canvas");
  canvas.width = EXPORT_WIDTH;
  canvas.height = EXPORT_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas-unavailable");
  // Cover-fit the photo into the 4:5 frame, same as the on-screen preview.
  const scale = Math.max(
    EXPORT_WIDTH / image.naturalWidth,
    EXPORT_HEIGHT / image.naturalHeight,
  );
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT);
  context.drawImage(
    image,
    (EXPORT_WIDTH - drawWidth) / 2,
    (EXPORT_HEIGHT - drawHeight) / 2,
    drawWidth,
    drawHeight,
  );
  const gradient = context.createLinearGradient(0, EXPORT_HEIGHT, 0, EXPORT_HEIGHT * (2 / 3));
  gradient.addColorStop(0, swatchHex);
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.save();
  context.globalAlpha = 0.2;
  context.globalCompositeOperation = "multiply";
  context.fillStyle = gradient;
  context.fillRect(0, EXPORT_HEIGHT * (2 / 3), EXPORT_WIDTH, EXPORT_HEIGHT / 3);
  context.restore();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.92),
  );
  if (!blob) throw new Error("export-failed");
  return blob;
}

async function saveBlob(blob: Blob, fileName: string): Promise<void> {
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}

interface ResultStepProps {
  product: Product;
  reason: string | null;
  snapshot: SkinSnapshot | null;
  selfieUrl: string | null;
  beforeImageUrl: string | null;
  resultUrl: string | null;
  recordedRenderUrl: string | null;
  demoFaceUrl: string | null;
  vtoSource: VtoSource | null;
  cartProducts: Product[];
  isInCart: boolean;
  onAddToCart: (product: Product) => void;
  onRemoveFromCart: (product: Product) => void;
  onBuildAnother: () => void;
}

export function ResultStep({
  product,
  reason,
  snapshot,
  selfieUrl,
  beforeImageUrl,
  resultUrl,
  recordedRenderUrl,
  demoFaceUrl,
  vtoSource,
  cartProducts,
  isInCart,
  onAddToCart,
  onRemoveFromCart,
  onBuildAnother,
}: ResultStepProps) {
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const previousIsInCart = useRef(isInCart);

  useEffect(() => {
    if (isInCart && !previousIsInCart.current) {
      setStatusMessage(`${product.shadeName} is in your prototype cart.`);
    }
    previousIsInCart.current = isInCart;
  }, [isInCart, product.shadeName]);

  async function handleSaveLook() {
    setIsSaving(true);
    try {
      const fileName = `glowcart-${product.id}.jpg`;
      if (vtoSource === "recorded" && selfieUrl) {
        await saveBlob(await composeRecordedLook(selfieUrl, product.swatchHex), fileName);
      } else if (resultUrl) {
        const response = await fetch(resultUrl);
        if (!response.ok) throw new Error("download-failed");
        await saveBlob(await response.blob(), fileName);
      } else {
        throw new Error("no-image");
      }
      setStatusMessage(`Saved ${product.shadeName} to your downloads.`);
    } catch {
      // Cross-origin live renders may refuse fetch/download; open instead.
      const target = recordedRenderUrl ?? (vtoSource === "recorded" ? selfieUrl : resultUrl);
      if (target) {
        window.open(target, "_blank", "noopener");
        setStatusMessage("Opened the look in a new tab to save it.");
      } else {
        setStatusMessage("We couldn’t save this look right now.");
      }
    } finally {
      setIsSaving(false);
    }
  }

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
          <Action variant="quiet" onClick={() => void handleSaveLook()} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save this look"}
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
              {vtoSource === "recorded" && recordedRenderUrl && demoFaceUrl ? (
                <img
                  src={demoFaceUrl}
                  alt="Demo face before the recorded lipstick preview"
                  className="aspect-[4/5] w-full object-cover"
                />
              ) : beforeImageUrl ? (
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
                {vtoSource === "recorded" && recordedRenderUrl
                  ? "Before · demo face (recorded)"
                  : "Before"}
              </figcaption>
            </figure>
            <figure className="bg-paper-deep">
              {vtoSource === "recorded" && recordedRenderUrl ? (
                <img
                  key={recordedRenderUrl}
                  src={recordedRenderUrl}
                  alt={`Recorded YouCam VTO render of the demo face with ${product.shadeName} lipstick`}
                  className="aspect-[4/5] w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : vtoSource === "recorded" && selfieUrl ? (
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
                  ? recordedRenderUrl
                    ? "After · recorded YouCam VTO · demo face"
                    : "After direction · your photo"
                  : "After · YouCam VTO"}
              </figcaption>
            </figure>
          </div>
        </section>

        {vtoSource === "recorded" ? (
          <Notice tone="info" title="Recorded demo result">
            {recordedRenderUrl
              ? "This before/after is a recorded YouCam VTO render of our labeled demo face (see public/demo/CREDITS.md). It is not a fresh personalized render of your uploaded photo — recorded mode never sends your photo to YouCam."
              : "This before/after direction uses your uploaded photo with a labeled shade simulation. It is not a fresh personalized render."}
          </Notice>
        ) : null}

        {vtoSource === "recorded" && selfieUrl ? (
          <figure className="inline-block border border-line bg-paper-deep p-2">
            <img
              src={selfieUrl}
              alt="Your uploaded photo — not analyzed in recorded mode"
              className="h-28 w-24 object-cover"
            />
            <figcaption className="mt-2 px-1 pb-1 text-[0.75rem] text-stone-deep">
              Your photo · this session only · not analyzed in recorded mode
            </figcaption>
          </figure>
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
                    <div className="flex shrink-0 items-center gap-3">
                      <p className="text-[0.92rem]">{formatUsd(item.priceUsd)}</p>
                      <button
                        type="button"
                        onClick={() => {
                          onRemoveFromCart(item);
                          setStatusMessage(
                            `${item.shadeName} was removed from your prototype cart.`,
                          );
                        }}
                        aria-label={`Remove ${item.shadeName} from cart`}
                        className="flex size-8 items-center justify-center border border-line text-stone-deep transition-colors hover:border-lip-deep hover:text-lip-deep"
                      >
                        <span aria-hidden="true">×</span>
                      </button>
                    </div>
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
