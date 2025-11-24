"use client";

import {
  Truck,
  Gift,
  PackageSearch,
  SmilePlus,
  LucideIcon,
} from "lucide-react";

import "./styles/features.css";

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
    <section className="features-wrapper">
      <div className="features-card">
        {featureList.map(({ icon: Icon, title, description }) => (
          <div className="feature-item" key={title}>
            <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} />
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
