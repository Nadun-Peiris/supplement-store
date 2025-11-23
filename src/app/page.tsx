import HeroSlider from "@/components/HeroSlider";
import ProductCarousel from "@/components/ProductCarousel";
import BrandLogoSlider from "@/components/BrandLogoSlider";
import CategoryCarousel from "@/components/CategoryCarousel";

export default function HomePage() {
  const slides = [
    { src: "/banners/banner1.png", alt: "Hero 1" },
    { src: "/banners/banner2.png", alt: "Hero 2" },
  ];

  return (
    <main>
      <HeroSlider slides={slides} autoPlayMs={5000} />

      <CategoryCarousel />

      <ProductCarousel category="Protein" />

      <BrandLogoSlider />

      <HeroSlider slides={slides} autoPlayMs={5000} />

      <ProductCarousel category="Protein" />
    </main>
  );
}
