import HeroSlider from "@/components/HeroSlider";
import ProductCarousel from "@/components/ProductCarousel";
import BrandLogoSlider from "@/components/BrandLogoSlider";
import CategoryCarousel from "@/components/CategoryCarousel";
import PromoSection from "@/components/PromoSection";
import FeaturesSection from "@/components/FeaturesSection";

export default function HomePage() {
  return (
    <main>
      <HeroSlider className="pt-4 md:pt-5" autoPlayMs={5000} />

      <CategoryCarousel />

      <PromoSection />

      <ProductCarousel category="Protein" />

      <BrandLogoSlider />

      <HeroSlider autoPlayMs={5000} />

      <ProductCarousel category="Protein" />

      <FeaturesSection />
    </main>
  );
}
