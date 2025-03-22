import React from "react";
import { Button } from "@/components/ui/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const discordButtonVariants = cva(
  "discord-click-effect relative inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "discord-button-hover bg-indigo-500 hover:bg-indigo-600 text-white shadow-md hover:shadow-lg transition-all duration-200",
        blurple: "discord-button-hover bg-[#5865F2] hover:bg-[#4752C4] text-white shadow-md hover:shadow-lg transition-all duration-200",
        green: "discord-button-hover bg-[#3BA55D] hover:bg-[#2D8B4E] text-white shadow-md hover:shadow-lg transition-all duration-200",
        red: "discord-button-hover bg-[#ED4245] hover:bg-[#D53134] text-white shadow-md hover:shadow-lg transition-all duration-200",
        gray: "discord-button-hover bg-[#4F545C] hover:bg-[#2E3136] text-white shadow-md hover:shadow-lg transition-all duration-200",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
      animation: {
        none: "",
        pulse: "animate-pulse",
        bounce: "animate-bounce",
        discord: "relative overflow-hidden",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      animation: "none",
    },
  }
);

export interface DiscordButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof discordButtonVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
}

const DiscordButton = React.forwardRef<HTMLButtonElement, DiscordButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    animation,
    children, 
    leftIcon, 
    rightIcon, 
    isLoading, 
    loadingText,
    disabled,
    ...props 
  }, ref) => {
    return (
      <Button
        className={cn(discordButtonVariants({ variant, size, animation, className }))}
        ref={ref}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading ? (
          <>
            <span className="mr-2 inline-block animate-spin">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
              </svg>
            </span>
            {loadingText || children}
          </>
        ) : (
          <>
            {leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-2">{rightIcon}</span>}
          </>
        )}
      </Button>
    );
  }
);

DiscordButton.displayName = "DiscordButton";
export { DiscordButton };