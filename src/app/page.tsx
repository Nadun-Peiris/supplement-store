import HeroSlider from "@/components/HeroSlider";

export default function HomePage() {
  const slides = [
    { src: "/banners/banner1.png", alt: "Hero 1" },
    { src: "/banners/banner2.png", alt: "Hero 2" },
  ];

  return (
    <main>
      <HeroSlider slides={slides} autoPlayMs={5000} />
    </main>
  );
}
