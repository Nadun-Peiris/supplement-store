"use client";

import Image from "next/image";
import { Trash2 } from "lucide-react";

type CartItemData = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  originalPrice?: number;
};

type CartItemProps = {
  item: CartItemData;
  updateQuantity: (productId: string, quantity: number) => void | Promise<void>;
  removeItem: (productId: string) => void | Promise<void>;
};

export default function CartItem({
  item,
  updateQuantity,
  removeItem,
}: CartItemProps) {
  return (
    <div className="group relative flex items-center gap-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md max-[600px]:flex-col max-[600px]:items-start">
      
      {/* PRODUCT IMAGE CONTAINER */}
      <div className="h-[100px] w-[100px] shrink-0 rounded-xl bg-[#f8f8f8] p-2 max-[600px]:h-[120px] max-[600px]:w-[120px]">
        <Image
          src={item.image}
          width={100}
          height={100}
          alt={item.name}
          className="h-full w-full object-contain mix-blend-multiply"
        />
      </div>

      {/* PRODUCT INFO (Stretches to fill empty space) */}
      <div className="flex flex-1 flex-col justify-center">
        <h3 className="text-lg font-extrabold text-[#111]">{item.name}</h3>
        <div className="mt-1 flex items-center gap-2 text-sm font-semibold">
          <span className="text-gray-500">LKR {item.price.toLocaleString()}</span>
          {typeof item.originalPrice === "number" &&
          item.originalPrice > item.price ? (
            <span className="text-gray-400 line-through">
              LKR {item.originalPrice.toLocaleString()}
            </span>
          ) : null}
        </div>
      </div>

      {/* CONTROLS & SUBTOTAL */}
      <div className="flex items-center gap-10 max-[600px]:w-full max-[600px]:justify-between max-[600px]:gap-4">
        
        {/* QUANTITY PILL */}
        <div className="flex h-11 items-center rounded-full border border-gray-200 bg-gray-50 p-1">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg font-bold text-gray-600 shadow-sm transition-transform hover:scale-105 hover:text-black active:scale-95 disabled:opacity-50"
            disabled={item.quantity === 1}
            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
          >
            –
          </button>
          <span className="w-10 text-center text-[0.95rem] font-bold text-[#111]">
            {item.quantity}
          </span>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg font-bold text-gray-600 shadow-sm transition-transform hover:scale-105 hover:text-black active:scale-95"
            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
          >
            +
          </button>
        </div>

        {/* SUBTOTAL */}
        <span className="w-[120px] text-right text-xl font-black text-[#111] max-[600px]:w-auto max-[600px]:text-lg">
          LKR {(item.price * item.quantity).toLocaleString()}
        </span>
      </div>

      {/* FLOATING REMOVE BUTTON */}
      <button
        onClick={() => removeItem(item.productId)}
        className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-500 opacity-0 shadow-sm transition-all duration-200 hover:bg-red-500 hover:text-white group-hover:opacity-100 max-[900px]:opacity-100 max-[600px]:right-4 max-[600px]:top-4 max-[600px]:bg-transparent max-[600px]:shadow-none"
        aria-label="Remove item"
      >
        <Trash2 size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
}
