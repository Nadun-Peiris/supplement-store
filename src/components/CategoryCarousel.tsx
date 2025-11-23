"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import "./styles/categoryCarousel.css";
import Link from "next/link";

interface Category {
  _id: string;
  name: string;
  image: string;
}

export default function CategoryCarousel() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function loadCategories() {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data.categories);
    }

    loadCategories();
  }, []);

  return (
    <section className="category-section">
      <h2 className="category-title"><span className="shopby">SHOP BY</span> CATEGORY</h2>

      <div className="category-carousel">
        {categories.map((cat) => (
          <Link href={`/category/${cat._id}`} key={cat._id} className="category-item">
            
            <div className="circle-bg">
              <Image
                src={cat.image}
                alt={cat.name}
                width={120}
                height={120}
                className="category-img"
              />
            </div>

            <p className="cat-name">{cat.name}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
