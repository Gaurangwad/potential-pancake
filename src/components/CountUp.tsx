"use client";

import { useEffect } from "react";
import { animate, useMotionValue, useTransform, motion } from "framer-motion";
import { inrGroup } from "@/lib/format";

/**
 * The reveal number counts up. Subtle, premium — not bouncy.
 * Respects prefers-reduced-motion by jumping to the final value.
 */
export function CountUp({
  value,
  prefix = "₹",
  durationMs = 1400,
  className,
}: {
  value: number;
  prefix?: string;
  durationMs?: number;
  className?: string;
}) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => `${prefix}${inrGroup(v)}`);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, {
      duration: durationMs / 1000,
      ease: [0.16, 1, 0.3, 1], // easeOutExpo — a confident settle
    });
    return () => controls.stop();
  }, [value, durationMs, mv]);

  return <motion.span className={className}>{text}</motion.span>;
}
