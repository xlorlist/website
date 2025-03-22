import React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const loaderVariants = cva(
  "flex flex-col items-center justify-center",
  {
    variants: {
      variant: {
        default: "text-white",
        blurple: "text-[#5865F2]",
        green: "text-[#3BA55D]",
        red: "text-[#ED4245]",
      },
      size: {
        sm: "scale-75",
        default: "scale-100",
        lg: "scale-150",
      },
    },
    defaultVariants: {
      variant: "blurple",
      size: "default",
    },
  }
);

export interface DiscordLoaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loaderVariants> {
  text?: string;
}

export function DiscordLoader({
  className,
  variant,
  size,
  text,
  ...props
}: DiscordLoaderProps) {
  return (
    <div
      className={cn(loaderVariants({ variant, size }), className)}
      {...props}
    >
      <div className="relative w-16 h-16 mb-2">
        {/* Outer circle */}
        <div className="absolute inset-0 rounded-full border-4 border-current opacity-20"></div>
        
        {/* Spinning segment */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-current animate-spin"></div>
        
        {/* Center pulsing dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
        </div>
      </div>
      
      {text && (
        <div className="text-sm font-medium mt-2 animate-pulse">
          {text}
        </div>
      )}
    </div>
  );
}

export function DiscordThreeDotsLoader({
  variant = "default",
  className,
}: {
  variant?: "default" | "blurple" | "green" | "red";
  className?: string;
}) {
  const colors = {
    default: "bg-[#b9bbbe]",
    blurple: "bg-[#5865F2]",
    green: "bg-[#3BA55D]",
    red: "bg-[#ED4245]",
  };
  
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="discord-typing-indicator scale-150">
        <span className={colors[variant]}></span>
        <span className={colors[variant]}></span>
        <span className={colors[variant]}></span>
      </div>
    </div>
  );
}