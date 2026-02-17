"use client";

import Image from "next/image";
import Link from "next/link";
import "./styles/productCard.css";
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
    <div className="card clean">

      {/* CLICKABLE PRODUCT AREA */}
      <Link href={`/product/${slug}`} className="card-wrapper">

        {/* TITLE */}
        <div className="card-header">
          <h3 className="card-title">{name}</h3>
          <p className="card-category">{category}</p>
        </div>

        {/* PRODUCT IMAGE */}
        <div className="image-container large">
          <Image
            src={image}
            alt={name}
            width={500}
            height={500}
            className="card-image"
          />
        </div>

        {/* PRICE + BADGE */}
        <div className="card-bottom">
          <p className="card-price">
            LKR {price.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
          </p>
          {isNew && <span className="badge">New</span>}
        </div>
      </Link>

      {/* ADD TO CART BUTTON */}
      <button className="add-to-cart" onClick={handleAddToCart}>
        ADD TO CART
      </button>
    </div>
  );
}
