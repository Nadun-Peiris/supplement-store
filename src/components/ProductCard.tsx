"use client";

import Image from "next/image";
import Link from "next/link";
import "./styles/productCard.css";

interface ProductCardProps {
  name: string;
  category: string;
  price: number;
  image: string;
  hoverImage?: string;
  href: string;
}

export default function ProductCard({
  name,
  category,
  price,
  image,
  hoverImage,
  href,
}: ProductCardProps) {
  return (
    <div className="product-card">
      <Link href={href} className="image-container">
        <div className="image-wrapper">
          <Image
            src={image}
            alt={name}
            width={500}
            height={600}
            className="product-image base"
            priority={false}
          />
          {hoverImage && (
            <Image
              src={hoverImage}
              alt={`${name} hover`}
              width={500}
              height={600}
              className="product-image hover"
              priority={false}
            />
          )}
        </div>
      </Link>

      <div className="product-info">
        <h3 className="product-name">{name}</h3>
        <p className="product-category">{category}</p>
        <p className="product-price">
          LKR{price.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  );
}
