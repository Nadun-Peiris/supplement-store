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
  brandName?: string;
  category?: string;
  isLabTested?: boolean;
  score?: number;
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
    <div className="group relative overflow-hidden rounded-[24px] border border-[#20323a] bg-[linear-gradient(145deg,rgba(16,24,29,0.98),rgba(11,17,21,0.98))] p-4 text-[#e6e6e6] shadow-[0_20px_45px_rgba(0,0,0,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#2f6575]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(3,199,254,0.13),transparent_24%),linear-gradient(180deg,transparent,rgba(255,255,255,0.02))]" />
      <div className="relative flex items-start gap-3">
        {/* PRODUCT IMAGE */}
        {product.image && (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-[20px] border border-white/8 bg-[linear-gradient(145deg,#ffffff,#dff9ff)] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
            <Image
              src={product.image}
              alt={product.name}
              width={96}
              height={96}
              className="h-full w-full object-contain"
            />
          </div>
        )}

        <div className="flex flex-1 flex-col">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {product.category && (
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white/70">
                {product.category}
              </span>
            )}
            {product.brandName && (
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white/70">
                {product.brandName}
              </span>
            )}
            {product.isLabTested && (
              <span className="rounded-full border border-[#1e5466] bg-[#09151b] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#7bdcff]">
                Verified
              </span>
            )}
          </div>

          {/* NAME + PRICE */}
          <h4 className="text-[15px] font-bold leading-tight text-white line-clamp-2">
            {product.name}
          </h4>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {hasDiscount ? (
              <>
                <p className="rounded-full bg-[#0e2028] px-3 py-1.5 text-[13px] font-black text-[#7bdcff]">
                  LKR {product.discountPrice?.toLocaleString()}
                </p>
                <p className="text-[12px] text-[#8c8c8c] line-through">
                  LKR {product.price?.toLocaleString()}
                </p>
              </>
            ) : (
              <p className="rounded-full bg-[#0e2028] px-3 py-1.5 text-[13px] font-black text-[#7bdcff]">
                LKR {product.price?.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* AI REASON - This makes the recommendation feel personal */}
      {product.reason && (
        <p className="relative mt-4 rounded-[18px] border border-white/8 bg-white/5 p-3 text-[12px] leading-6 text-gray-300 italic">
          “{product.reason}”
        </p>
      )}

      {typeof product.score === "number" && product.score > 0 && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-[18px] border border-[#20313a] bg-[#0f171c] px-3 py-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/54">
            Match confidence
          </span>
          <span className="text-[11px] font-black uppercase tracking-[0.12em] text-[#7bdcff]">
            {product.score}/10
          </span>
        </div>
      )}

      {/* BUTTONS */}
      <div className="relative mt-4 flex gap-2">
        <Link
          href={productHref}
          className="flex-1 rounded-[16px] border border-white/10 bg-white/5 py-3 text-center text-[12px] font-bold uppercase tracking-[0.08em] text-[#e6e6e6] transition-colors hover:border-white/18 hover:bg-white/8"
        >
          View Details
        </Link>

        <button
          className="flex-1 rounded-[16px] bg-[linear-gradient(145deg,#03c7fe,#59dbff)] py-3 text-center text-[12px] font-black uppercase tracking-[0.08em] text-[#041018] shadow-[0_10px_24px_rgba(3,199,254,0.22)] transition-transform hover:scale-[1.01]"
          type="button"
          onClick={() => onAdd?.(product)}
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
