import React, { useState } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

interface DiscordTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delay?: number;
  variant?: "default" | "blurple" | "green" | "red";
  showArrow?: boolean;
  animated?: boolean;
}

export function DiscordTooltip({
  content,
  children,
  side = "top",
  align = "center",
  delay = 200,
  variant = "default",
  showArrow = true,
  animated = true,
}: DiscordTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const variantClasses = {
    default: "bg-[#18191c] text-white border border-[#2f3136]",
    blurple: "bg-[#5865F2] text-white",
    green: "bg-[#3BA55D] text-white",
    red: "bg-[#ED4245] text-white",
  };
  
  const animatedClass = animated ? "transition-opacity duration-300" : "";
  
  return (
    <TooltipPrimitive.Provider delayDuration={delay}>
      <TooltipPrimitive.Root 
        open={isOpen} 
        onOpenChange={setIsOpen}
      >
        <TooltipPrimitive.Trigger asChild>
          <div>{children}</div>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            align={align}
            sideOffset={5}
            className={cn(
              "z-50 overflow-hidden rounded-md px-3 py-1.5 text-sm shadow-md",
              variantClasses[variant],
              animatedClass,
              isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95",
            )}
          >
            {content}
            {showArrow && (
              <TooltipPrimitive.Arrow 
                className={cn(
                  "fill-current", 
                  variant === "default" ? "text-[#18191c]" : `text-[${variantClasses[variant].split(" ")[0].replace("bg-", "")}]`
                )} 
                width={11} 
                height={5} 
              />
            )}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}