"use client";

import { cn } from "@/lib/utils";

interface RippleProps {
  mainCircleSize?: number;
  mainCircleOpacity?: number;
  numCircles?: number;
  className?: string;
}

export const Ripple = ({
  mainCircleSize = 210,
  mainCircleOpacity = 0.24,
  numCircles = 8,
  className,
}: RippleProps) => {
  return (
    <div className={cn("absolute inset-0 flex items-center justify-center", className)}>
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + (i * 70);
        const opacity = mainCircleOpacity - (i * 0.03);
        const animationDelay = `${i * 0.06}s`;

        return (
          <div
            key={i}
            className={cn(
              "absolute border border-[#133656] rounded-full animate-ping",
              "opacity-0"
            )}
            style={{
              width: size,
              height: size,
              animationDelay,
              animationDuration: "3s",
              opacity: opacity,
            }}
          />
        );
      })}
      <div
        className="absolute border-2 border-[#133656] rounded-full animate-pulse"
        style={{
          width: mainCircleSize * 0.3,
          height: mainCircleSize * 0.3,
          opacity: mainCircleOpacity * 2,
        }}
      />
    </div>
  );
};
