import { motion } from "framer-motion";
import { useMemo } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  color: string;
  duration: number;
  delay: number;
  offsetX: number;
  offsetY: number;
}

const COLORS = ["#6366f1", "#ec4899", "#ffffff"];

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export default function ParticleBackground() {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: randomBetween(0, 100),
      y: randomBetween(0, 100),
      size: randomBetween(2, 6),
      opacity: randomBetween(0.1, 0.3),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      duration: randomBetween(10, 25),
      delay: randomBetween(0, 8),
      offsetX: randomBetween(-50, 50),
      offsetY: randomBetween(-100, 100),
    }));
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            opacity: p.opacity,
          }}
          animate={{
            x: [0, p.offsetX, -p.offsetX * 0.5, p.offsetX * 0.7, 0],
            y: [0, p.offsetY, -p.offsetY * 0.6, p.offsetY * 0.4, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
