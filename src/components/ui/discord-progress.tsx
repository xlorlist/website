import React, { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface DiscordProgressProps {
  value: number;
  max?: number;
  showValue?: boolean;
  valueFormatter?: (value: number, max: number) => string;
  animated?: boolean;
  animationSpeed?: "slow" | "normal" | "fast";
  size?: "sm" | "md" | "lg";
  variant?: "default" | "blurple" | "green" | "red";
  className?: string;
}

export function DiscordProgress({
  value,
  max = 100,
  showValue = false,
  valueFormatter,
  animated = true,
  animationSpeed = "normal",
  size = "md",
  variant = "blurple",
  className,
}: DiscordProgressProps) {
  const [displayValue, setDisplayValue] = useState(0);
  
  // Animate the value
  useEffect(() => {
    if (!animated) {
      setDisplayValue(value);
      return;
    }

    // Duration based on animation speed
    const duration = animationSpeed === "slow" ? 1500 : animationSpeed === "fast" ? 500 : 1000;
    const step = 10; // Update every 10ms
    const increment = (value / (duration / step));
    
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        current = value;
        clearInterval(timer);
      }
      setDisplayValue(current);
    }, step);
    
    return () => clearInterval(timer);
  }, [value, animated, animationSpeed]);
  
  // Format the value if a formatter is provided
  const formattedValue = valueFormatter 
    ? valueFormatter(displayValue, max) 
    : `${Math.round(displayValue)}%`;
  
  // Size based classes
  const sizeClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4",
  };
  
  // Variant based classes
  const variantClasses = {
    default: "bg-gray-700",
    blurple: "bg-[#5865F2]",
    green: "bg-[#3BA55D]",
    red: "bg-[#ED4245]",
  };
  
  // Animation based on variant
  const animationClass = animated ? "discord-progress-animated" : "";
  
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        {showValue && (
          <div className="flex justify-between w-full">
            <span className="text-gray-300">Progress</span>
            <span className="text-white font-medium">{formattedValue}</span>
          </div>
        )}
      </div>
      <div className={cn("relative w-full overflow-hidden rounded-full bg-[#2f3136]", sizeClasses[size])}>
        <div
          className={cn(
            "h-full transition-all rounded-full",
            variantClasses[variant],
            animationClass,
            className
          )}
          style={{ width: `${(displayValue / max) * 100}%` }}
        >
          {animated && (
            <div className="absolute inset-0 discord-progress-shimmer"></div>
          )}
        </div>
      </div>
    </div>
  );
}