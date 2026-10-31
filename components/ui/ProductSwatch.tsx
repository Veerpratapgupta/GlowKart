import { readableTextColor } from "@/lib/color";
import type { Product } from "@/lib/types";

const sizeClasses = {
  sm: "h-16 w-14 text-[0.7rem]",
  md: "h-28 w-24 text-sm",
  lg: "h-full min-h-56 w-full text-xl sm:text-2xl",
} as const;

interface ProductSwatchProps {
  product: Product;
  size?: keyof typeof sizeClasses;
}

export function ProductSwatch({ product, size = "md" }: ProductSwatchProps) {
  const textColor = readableTextColor(product.swatchHex);

  return (
    <div
      className={`relative flex items-end overflow-hidden rounded-[2px] border border-line ${sizeClasses[size]}`}
      style={{ backgroundColor: product.swatchHex, color: textColor }}
      aria-hidden="true"
    >
      <span className="px-3 pb-3 font-display leading-tight font-medium">
        {product.shadeName}
      </span>
    </div>
  );
}
