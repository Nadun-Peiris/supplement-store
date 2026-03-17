"use client";

import {
  Truck,
  Gift,
  PackageSearch,
  SmilePlus,
  LucideIcon,
} from "lucide-react";

export default function FeaturesSection() {
  const ICON_SIZE = 52;
  const ICON_STROKE = 0.7;
  
  const featureList: Array<{
    icon: LucideIcon;
    title: string;
    description: string;
  }> = [
    {
      icon: Truck,
      title: "FAST DELIVERY",
      description: "West & East coast dispatch",
    },
    {
      icon: Gift,
      title: "FREE GIFT WITH ORDER $150+",
      description: "Multiple gift options available",
    },
    {
      icon: PackageSearch,
      title: "CLICK & COLLECT",
      description: "Check your local stores now",
    },
    {
      icon: SmilePlus,
      title: "2M+ HAPPY CUSTOMERS",
      description: "Here to support your journey",
    },
  ];

  return (
    <section className="flex w-full justify-center bg-white px-5 py-10 md:px-8 md:py-12 xl:px-16 xl:py-16">
      <div className="grid w-full grid-cols-1 items-start gap-7 rounded-[22px] border border-[#e6e6e6] bg-white px-7 py-9 text-center min-[900px]:grid-cols-4 min-[900px]:gap-10 md:px-8 md:py-12">
        {featureList.map(({ icon: Icon, title, description }) => (
          <div
            className="relative flex flex-col items-center md:px-4 after:absolute after:-right-5 after:bottom-[12%] after:top-[12%] after:w-[1px] after:bg-[#e6e6e6] last:after:hidden max-[900px]:after:hidden"
            key={title}
          >
            <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} />
            <h3 className="mt-5 text-base font-extrabold tracking-[0.5px] text-[#111] md:text-[1.1rem]">
              {title}
            </h3>
            <p className="mt-1.5 text-[0.9rem] text-[#7a7a7a]">
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}