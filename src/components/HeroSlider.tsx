"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import "./styles/hero.css";

type Slide = { src: string; alt: string; href?: string };

export default function HeroSlider({
  slides,
  autoPlayMs = 6000,
}: {
  slides: Slide[];
  autoPlayMs?: number;
}) {
  const realCount = slides.length;
  const extended =
    realCount > 1 ? [slides[realCount - 1], ...slides, slides[0]] : slides;

  const [idx, setIdx] = useState(realCount > 1 ? 1 : 0);
  const [animate, setAnimate] = useState(true);

  // ✅ useRef with browser-safe type (fixes NodeJS.Timeout warning)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // 🔁 Autoplay logic
  useEffect(() => {
    if (!autoPlayMs || realCount <= 1) return;

    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => setIdx((i) => i + 1), autoPlayMs);

    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [autoPlayMs, realCount, setIdx]);

  // Reset when slides change
  useEffect(() => {
    setIdx(realCount > 1 ? 1 : 0);
  }, [realCount]);

  const goto = (i: number) => {
    if (realCount <= 1) return;
    setAnimate(true);
    setIdx(i + 1);
  };

  // 🔁 Seamless looping logic
  const onTransitionEnd = () => {
    if (realCount <= 1) return;

    if (idx === realCount + 1) {
      setAnimate(false);
      setIdx(1);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setAnimate(true))
      );
    }

    if (idx === 0) {
      setAnimate(false);
      setIdx(realCount);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => setAnimate(true))
      );
    }
  };

  const dotIndex = realCount <= 1 ? 0 : (idx - 1 + realCount) % realCount;

  return (
    <section className="slider">
      <div className="slider-viewport">
        <div
          className="slider-track"
          style={{
            transform: `translateX(-${idx * 100}%)`,
            transition: animate ? "transform 500ms ease-in-out" : "none",
          }}
          onTransitionEnd={onTransitionEnd}
        >
          {extended.map((s, i) => {
            const img = <img src={s.src} alt={s.alt} className="slide-img" />;
            return (
              <div className="slide" key={i}>
                {s.href ? <Link href={s.href}>{img}</Link> : img}
              </div>
            );
          })}
        </div>

        {/* Dots */}
        {realCount > 1 && (
          <div className="dots">
            {slides.map((_, i) => (
              <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                className={`dot ${i === dotIndex ? "active" : ""}`}
                onClick={() => goto(i)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
