"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { useCart } from "@/context/CartContext";
import { Maximize2, X, ShoppingCart, Info } from "lucide-react";
import type { MouseEvent } from "react";

interface Props {
  id: string;
  name: string;
  category: string;
  price: number;
  discountPrice?: number;
  stock?: number;
  image: string;
  slug: string;
  description?: string; 
  isNew?: boolean; 
}

export default function ProductCard({
  id,
  name,
  category,
  price,
  discountPrice,
  stock = 0,
  image,
  slug,
  description = "Premium grade formula designed for professional performance and rapid recovery.",
}: Props) {
  const { addToCart } = useCart();
  const [showQuickView, setShowQuickView] = useState(false);
  const hasDiscount =
    typeof discountPrice === "number" && discountPrice < price;
  const effectivePrice = hasDiscount ? discountPrice : price;
  const isOutOfStock = stock <= 0;

  const handleAddToCart = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isOutOfStock) {
      toast.error("This product is out of stock.");
      return;
    }
    await addToCart({ productId: id, name, price: effectivePrice, image });
    toast.success("Added to cart!");
    if (showQuickView) setShowQuickView(false);
  };

  const openQuickView = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setShowQuickView(true);
  };

  return (
    <>
      <div
        className={`group relative flex w-full flex-col overflow-hidden rounded-[24px] border transition-all duration-300 ease-in-out h-[520px] max-[992px]:h-[480px] max-sm:h-auto max-sm:rounded-[20px] ${
          isOutOfStock
            ? "border-[#d8d8d8] bg-[#f1f1f1] grayscale"
            : "border-[#ececec] bg-white hover:border-[#d4d4d4] hover:bg-[#F8F8F8]"
        }`}
      >
        
        {/* CLICKABLE PRODUCT AREA */}
        <Link href={`/product/${slug}`} className="relative flex flex-1 flex-col p-[1.8rem] max-[992px]:p-6 max-sm:p-5">
          
          <div className="relative z-10 mb-4">
            <h3 className="text-[1.28rem] font-semibold text-[#111] max-sm:text-[1.1rem]">
              {name}
            </h3>
            <p className="text-[0.95rem] text-[#8b8b8b]">
              {category}
            </p>
          </div>

          {/* PRODUCT IMAGE */}
          <div className="relative z-20 flex h-[250px] w-full items-center justify-center pt-14 max-[992px]:h-[220px] max-[992px]:pt-11 max-sm:h-[200px] max-sm:pt-6">
            <Image
              src={image}
              alt={name}
              width={500}
              height={500}
              className="relative z-20 max-h-[250px] object-contain transition-transform duration-[400ms] ease-in-out group-hover:-translate-y-[14px] max-[992px]:max-h-[220px] max-sm:max-h-[200px] max-sm:group-hover:translate-y-0"
            />
          </div>

          {/* PRICE + ICON-ONLY QUICK VIEW BUTTON */}
          <div className="mt-auto flex items-center justify-between pt-4 transition-transform duration-300 ease-in-out group-hover:-translate-y-[25px] max-sm:flex-col max-sm:items-start max-sm:gap-2 max-sm:group-hover:translate-y-0">
            <div className="flex flex-col">
              <p className="text-[1.18rem] font-bold text-[#111]">
                LKR {effectivePrice.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
              </p>
              {hasDiscount && (
                <p className="text-[0.9rem] font-medium text-gray-400 line-through">
                  LKR {price.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>
            
            {/* ICON-ONLY QUICK VIEW BUTTON */}
            <button
              onClick={openQuickView}
              className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 shadow-sm ${
                isOutOfStock
                  ? "border-gray-300 bg-gray-200 text-gray-500"
                  : "border-[#cfeef7] bg-[#f0fbff] text-[#03c7fe] hover:bg-[#03c7fe] hover:text-white hover:border-[#03c7fe] hover:scale-110"
              }`}
              title="Quick View"
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </Link>

        {/* ORIGINAL ADD TO CART BUTTON */}
        <button
          disabled={isOutOfStock}
          className={`absolute -bottom-[70px] left-0 w-full rounded-b-[24px] border-none p-[0.8rem] text-center text-[0.9rem] font-bold text-white opacity-0 transition-all duration-300 ease-in-out group-hover:bottom-0 group-hover:opacity-100 max-sm:static max-sm:my-4 max-sm:mx-5 max-sm:w-[calc(100%-2.5rem)] max-sm:rounded-[16px] max-sm:opacity-100 ${
            isOutOfStock ? "bg-gray-400" : "bg-[#15D1F5]"
          }`}
          onClick={handleAddToCart}
        >
          {isOutOfStock ? "OUT OF STOCK" : "ADD TO CART"}
        </button>
      </div>

      {/* QUICK VIEW POPUP MODAL */}
      {showQuickView && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setShowQuickView(false)}
          />
          
          <div className="relative w-full max-w-[850px] overflow-hidden rounded-[32px] bg-white shadow-2xl animate-in zoom-in-95 duration-300 grid grid-cols-1 md:grid-cols-2">
            <button 
              onClick={() => setShowQuickView(false)}
              className="absolute right-6 top-6 z-10 rounded-full bg-gray-100 p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <X size={20} />
            </button>

            <div className="flex items-center justify-center bg-[#f9f9f9] p-10">
              <Image
                src={image}
                alt={name}
                width={500}
                height={500}
                className="max-h-[350px] object-contain"
              />
            </div>

            <div className="flex flex-col p-8 md:p-12">
              <span className="text-xs font-black uppercase tracking-widest text-[#03c7fe] mb-2">
                {category}
              </span>
              <h2 className="text-3xl font-black text-[#111] leading-tight">{name}</h2>
              <div className="mt-4 flex flex-col">
                <p className="text-2xl font-bold text-[#111]">
                  LKR {effectivePrice.toLocaleString()}
                </p>
                {hasDiscount && (
                  <p className="text-base font-medium text-gray-400 line-through">
                    LKR {price.toLocaleString()}
                  </p>
                )}
              </div>
              
              <div className="mt-6 border-t border-gray-100 pt-6">
                <h4 className="flex items-center gap-2 text-sm font-bold text-[#111] mb-3">
                  <Info size={16} /> Product Summary
                </h4>
                <p className="text-sm leading-relaxed text-gray-500">
                  {description}
                </p>
              </div>

              <div className="mt-auto flex gap-3 pt-8">
                <button
                  disabled={isOutOfStock}
                  onClick={handleAddToCart}
                  className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-[#15D1F5] py-4 text-sm font-bold text-white shadow-[0_10px_20px_rgba(21,209,245,0.3)] transition-all hover:bg-[#12b8d9] disabled:cursor-not-allowed disabled:bg-gray-300 disabled:shadow-none"
                >
                  <ShoppingCart size={18} />
                  {isOutOfStock ? "OUT OF STOCK" : "ADD TO CART"}
                </button>
                <Link
                  href={`/product/${slug}`}
                  className="flex-1 flex items-center justify-center rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  DETAILS
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
