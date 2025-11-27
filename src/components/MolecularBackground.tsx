"use client";

import { useEffect, useRef } from "react";
import "@/components/styles/molecular.css"; // Ensure this path matches where you save the CSS below

export default function MolecularBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const particles: Array<{ x: number; y: number; vx: number; vy: number; radius: number }> = [];

    // --- CONFIGURATION FOR SUPPLEMENT THEME ---
    const particleCount = 50;   // Number of "atoms"
    const maxDistance = 150;    // Distance for chemical bonds to form
    const r = 3, g = 199, b = 254; // Brand Color: Cyan (#03C7FE)

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.offsetWidth;
        canvas.height = parent.offsetHeight;
      }

      particles.length = 0;
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          // Slower velocity for a "suspended in liquid" feel
          vx: (Math.random() - 0.5) * 0.4, 
          vy: (Math.random() - 0.5) * 0.4,
          // Random sizes to represent different elements
          radius: Math.random() * 2.5 + 1.5, 
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        
        // Move particles
        p1.x += p1.vx;
        p1.y += p1.vy;

        // Bounce off edges
        if (p1.x < 0 || p1.x > canvas.width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > canvas.height) p1.vy *= -1;

        // Draw Atom (Dot)
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`; // Solid core
        ctx.fill();

        // Draw Bonds (Lines)
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);

          if (dist < maxDistance) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            // Opacity fades as distance increases
            const opacity = 1 - dist / maxDistance;
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity * 0.3})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    animate();

    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="molecular-canvas" />
  );
}