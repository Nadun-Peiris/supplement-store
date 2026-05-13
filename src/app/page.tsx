import HeroSlider from "@/components/HeroSlider";
import AIConciergeSpotlight from "@/components/AIConciergeSpotlight";
import ProductCarousel from "@/components/ProductCarousel";
import BrandLogoSlider from "@/components/BrandLogoSlider";
import CategoryCarousel from "@/components/CategoryCarousel";
import PromoSection from "@/components/PromoSection";
import FeaturesSection from "@/components/FeaturesSection";

export default function HomePage() {
  return (
    <main>
      <HeroSlider className="!pt-2 md:!pt-3 xl:!pt-4" autoPlayMs={5000} />

      <CategoryCarousel />

      <PromoSection />

      <ProductCarousel category="Protein" />

      <BrandLogoSlider />

      <AIConciergeSpotlight />

      <ProductCarousel category="Health and Beauty" />

      <FeaturesSection />
    </main>
  );
}
