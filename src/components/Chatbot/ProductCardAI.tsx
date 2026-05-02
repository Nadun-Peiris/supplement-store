"use client";
import Image from "next/image";
import Link from "next/link";

type AIProductCardData = {
  id: string;
  name: string;
  price: number;
  discountPrice?: number;
  image?: string;
  slug?: string;
  reason?: string;
};

type ProductCardProps = {
  product: AIProductCardData;
  onAdd?: (product: AIProductCardData) => void;
};

export default function ProductCardAI({ product, onAdd }: ProductCardProps) {
  const productHref = product.slug ? `/product/${product.slug}` : "/shop";
  const hasDiscount =
    typeof product.discountPrice === "number" &&
    product.discountPrice < product.price;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#222] bg-[#181818] p-3 text-[#e6e6e6] shadow-[0_4px_10px_rgba(0,0,0,0.25)] transition-all hover:border-[#333]">
      <div className="flex items-start gap-3">
        {/* PRODUCT IMAGE */}
        {product.image && (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-white p-1.5">
            <Image
              src={product.image}
              alt={product.name}
              width={80}
              height={80}
              className="h-full w-full object-contain"
            />
          </div>
        )}

        <div className="flex flex-1 flex-col">
          {/* NAME + PRICE */}
          <h4 className="text-[14px] font-bold leading-tight text-white line-clamp-2">
            {product.name}
          </h4>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            {hasDiscount ? (
              <>
                <p className="text-[13px] font-semibold text-[#03c7fe]">
                  LKR {product.discountPrice?.toLocaleString()}
                </p>
                <p className="text-[12px] text-[#8c8c8c] line-through">
                  LKR {product.price?.toLocaleString()}
                </p>
              </>
            ) : (
              <p className="text-[13px] font-semibold text-[#03c7fe]">
                LKR {product.price?.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* AI REASON - This makes the recommendation feel personal */}
      {product.reason && (
        <p className="text-[12px] leading-relaxed text-gray-400 italic bg-[#222]/30 p-2 rounded-lg border border-[#333]/50">
          “{product.reason}”
        </p>
      )}

      {/* BUTTONS */}
      <div className="flex gap-2 mt-1">
        <Link 
          href={productHref} 
          className="flex-1 rounded-lg bg-[#2b2b2b] py-2 text-center text-[12px] font-medium text-[#e6e6e6] transition-colors hover:bg-[#383838]"
        >
          View Details
        </Link>

        <button
          className="flex-1 rounded-lg bg-[#03c7fe] py-2 text-center text-[12px] font-bold text-[#041018] transition-colors hover:bg-[#02b5e6]"
          type="button"
          onClick={() => onAdd?.(product)}
        >
          + Add to Cart
        </button>
      </div>
    </div>
  );
}
