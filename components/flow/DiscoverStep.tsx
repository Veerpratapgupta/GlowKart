import { Action } from "@/components/ui/Action";
import { readableTextColor } from "@/lib/color";
import { sampleLipstickCatalog } from "@/lib/mock/catalog";

interface DiscoverStepProps {
  onStart: () => void;
}

export function DiscoverStep({ onStart }: DiscoverStepProps) {
  const featured = sampleLipstickCatalog.slice(0, 3);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-center lg:gap-16">
        <div>
          <p className="text-[0.9rem] font-medium text-botanic">
            Skin-aware lipstick matching
          </p>
          <h1 className="mt-5 font-display text-[clamp(2.5rem,6vw,4rem)] leading-[1.02] font-medium">
            Meet the lipstick that makes sense for you.
          </h1>
          <p className="mt-6 max-w-[44ch] text-[1.08rem] leading-relaxed text-stone-deep">
            A quick skin-aware beauty match, then a try-on before you decide.
          </p>
          <div className="mt-10">
            <Action variant="botanic" onClick={onStart} className="px-8 py-3.5">
              Start with a selfie
            </Action>
          </div>
          <p className="mt-5 text-[0.88rem] text-stone-deep">
            No account required · Your image is used for this session
          </p>
        </div>

        <figure className="border border-line bg-paper-deep p-4">
          <div className="flex h-72 flex-col gap-3 sm:h-80">
            {featured.map((product) => (
              <div
                key={product.id}
                className="flex flex-1 items-end justify-between border border-line px-4 pb-3"
                style={{
                  backgroundColor: product.swatchHex,
                  color: readableTextColor(product.swatchHex),
                }}
              >
                <span className="font-display text-lg leading-none font-medium">
                  {product.shadeName}
                </span>
                <span className="text-[0.75rem] opacity-90">{product.brand}</span>
              </div>
            ))}
          </div>
          <figcaption className="mt-4 text-[0.8rem] text-stone-deep">
            Sample shades from the demo catalog
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
