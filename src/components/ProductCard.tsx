"use client";

import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";
import { useCart } from "@/context/CartContext";
import type { MouseEvent } from "react";

interface Props {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  slug: string; // REQUIRED
  isNew?: boolean;
}

export default function ProductCard({
  id,
  name,
  category,
  price,
  image,
  slug,
  isNew = true,
}: Props) {
  // 🌟 Use global cart context
  const { addToCart } = useCart();

  // ------------------------------
  // ADD TO CART (Using Context)
  // ------------------------------
  const handleAddToCart = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // avoid navigating to product page

    await addToCart({
      productId: id,
      name,
      price,
      image,
    });

    toast.success("Added to cart!");
  };

  return (
    <div className="group relative flex w-full flex-col overflow-hidden rounded-[24px] border border-[#ececec] bg-white transition-all duration-300 ease-in-out hover:border-[#d4d4d4] hover:bg-[#F8F8F8] h-[520px] max-[992px]:h-[480px] max-sm:h-auto max-sm:rounded-[20px]">
      
      {/* CLICKABLE PRODUCT AREA */}
      <Link href={`/product/${slug}`} className="relative flex flex-1 flex-col p-[1.8rem] max-[992px]:p-6 max-sm:p-5">
        
        {/* TITLE */}
        <div className="mb-4">
          <h3 className="text-[1.28rem] font-semibold text-[#111] max-sm:text-[1.1rem]">
            {name}
          </h3>
          <p className="text-[0.95rem] text-[#8b8b8b]">
            {category}
          </p>
        </div>

        {/* PRODUCT IMAGE */}
        <div className="flex h-[250px] w-full items-center justify-center overflow-hidden max-[992px]:h-[220px] max-sm:h-[200px]">
          <Image
            src={image}
            alt={name}
            width={500}
            height={500}
            className="max-h-[250px] object-contain transition-transform duration-[400ms] ease-in-out group-hover:-translate-y-[14px] max-[992px]:max-h-[220px] max-sm:max-h-[200px] max-sm:group-hover:translate-y-0"
          />
        </div>

        {/* PRICE + BADGE */}
        <div className="mt-auto flex items-center justify-between pt-4 transition-transform duration-300 ease-in-out group-hover:-translate-y-[25px] max-sm:flex-col max-sm:items-start max-sm:gap-2 max-sm:group-hover:translate-y-0">
          <p className="text-[1.18rem] font-bold text-[#111]">
            LKR {price.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
          </p>
          {isNew && (
            <span className="rounded-[14px] border border-[#cfe0ff] bg-[#eef5ff] px-[0.8rem] py-[0.32rem] text-[0.75rem]">
              New
            </span>
          )}
        </div>
      </Link>

      {/* ADD TO CART BUTTON */}
      <button
        className="absolute -bottom-[70px] left-0 w-full rounded-b-[24px] border-none bg-[#15D1F5] p-[0.8rem] text-center text-[0.9rem] font-bold text-white opacity-0 transition-all duration-300 ease-in-out group-hover:bottom-0 group-hover:opacity-100 max-sm:static max-sm:my-4 max-sm:mx-5 max-sm:w-[calc(100%-2.5rem)] max-sm:rounded-[16px] max-sm:opacity-100"
        onClick={handleAddToCart}
      >
        ADD TO CART
      </button>
    </div>
  );
}