import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const discordCardVariants = cva(
  "overflow-hidden relative transition-all discord-hover-pop",
  {
    variants: {
      variant: {
        default: "bg-[#2f3136] border-[#42464D]",
        elevated: "bg-[#36393f] border-[#42464D] shadow-lg",
        blurple: "bg-[#5865F2]/10 border-[#5865F2]/20",
        green: "bg-[#3BA55D]/10 border-[#3BA55D]/20",
        red: "bg-[#ED4245]/10 border-[#ED4245]/20",
      },
      animation: {
        none: "",
        pop: "discord-pop-in",
        fade: "discord-fade-in",
        slide: "discord-slide-in",
      },
      hover: {
        none: "",
        glow: "hover:border-[#5865F2]/40 hover:shadow-[0_0_15px_rgba(88,101,242,0.15)]",
        scale: "hover:scale-[1.02]",
        shine: "discord-hover-shine",
      }
    },
    defaultVariants: {
      variant: "default",
      animation: "none",
      hover: "none",
    },
  }
);

type CardProps = Omit<React.ComponentPropsWithoutRef<typeof Card>, 'title'>;

export interface DiscordCardProps extends
  CardProps,
  VariantProps<typeof discordCardVariants> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  icon?: React.ReactNode;
  withShine?: boolean;
  withRipple?: boolean;
  withBadge?: boolean;
  badgeContent?: React.ReactNode;
}

export function DiscordCard({
  className,
  variant,
  animation,
  hover,
  title,
  description,
  children,
  footer,
  icon,
  withShine = false,
  withRipple = false,
  withBadge = false,
  badgeContent,
  ...props
}: DiscordCardProps) {
  return (
    <Card
      className={cn(
        discordCardVariants({ variant, animation, hover }), 
        withRipple ? "discord-click-effect" : "", 
        className
      )}
      {...props}
    >
      {/* Animated shine effect */}
      {withShine && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="discord-progress-shimmer w-[200%] h-[200%] opacity-20" />
        </div>
      )}

      {/* Notification badge */}
      {withBadge && (
        <div className="absolute top-2 right-2 bg-[#ED4245] text-white min-w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold discord-badge-pulse px-1.5">
          {badgeContent || "1"}
        </div>
      )}

      {title && (
        <CardHeader className="pb-2">
          <div className="flex items-center space-x-2">
            {icon && <div className="text-[#b9bbbe]">{icon}</div>}
            <div>
              <CardTitle className="text-white">{title}</CardTitle>
              {description && (
                <CardDescription className="text-[#b9bbbe]">{description}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className="pt-0">{children}</CardContent>

      {footer && (
        <CardFooter className="border-t border-[#42464D] bg-[#2b2d31]/40 py-2 px-6">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}