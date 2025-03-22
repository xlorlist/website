import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const notificationVariants = cva(
  "discord-pop-in discord-hover-pop flex items-start p-4 mb-2 rounded-md shadow-lg relative max-w-md",
  {
    variants: {
      variant: {
        default: "bg-[#36393f] border-l-4 border-[#b9bbbe]",
        info: "bg-[#36393f] border-l-4 border-[#5865f2]",
        success: "bg-[#36393f] border-l-4 border-[#3ba55d]",
        warning: "bg-[#36393f] border-l-4 border-[#faa61a]",
        error: "bg-[#36393f] border-l-4 border-[#ed4245]",
        mention: "bg-[#5865f2]/20 border-l-4 border-[#5865f2]",
      },
      floating: {
        true: "discord-float",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      floating: false,
    },
  }
);

interface DiscordNotificationProps extends VariantProps<typeof notificationVariants> {
  title?: string;
  message: string;
  icon?: React.ReactNode;
  autoClose?: boolean;
  duration?: number;
  onClose?: () => void;
  className?: string;
}

export function DiscordNotification({
  title,
  message,
  icon,
  variant,
  floating,
  autoClose = false,
  duration = 5000,
  onClose,
  className,
}: DiscordNotificationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (autoClose && visible) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose, visible]);

  if (!visible) return null;

  const variantIcons = {
    default: <div className="text-[#b9bbbe] mr-3">📝</div>,
    info: <div className="text-[#5865f2] mr-3">ℹ️</div>,
    success: <div className="text-[#3ba55d] mr-3">✅</div>,
    warning: <div className="text-[#faa61a] mr-3">⚠️</div>,
    error: <div className="text-[#ed4245] mr-3">❌</div>,
    mention: <div className="text-[#5865f2] mr-3">@</div>,
  };

  const displayIcon = icon || (variant && variantIcons[variant]) || variantIcons.default;

  return (
    <div className={cn(notificationVariants({ variant, floating }), className)}>
      {displayIcon}
      
      <div className="flex-1">
        {title && <h4 className="font-medium text-white mb-1">{title}</h4>}
        <p className="text-[#dcddde] text-sm">{message}</p>
      </div>
      
      <button 
        onClick={() => {
          setVisible(false);
          if (onClose) onClose();
        }}
        className="text-[#b9bbbe] hover:text-white transition-colors p-1 ml-2"
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}

// Usage example component showing notifications stacked
export function DiscordNotificationDemo() {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end space-y-2">
      <DiscordNotification
        variant="info"
        title="Information"
        message="Your Discord bot is now online and ready to use!"
        autoClose
        duration={8000}
      />
      
      <DiscordNotification
        variant="success"
        title="Success"
        message="Bot configuration saved successfully!"
        autoClose
        duration={5000}
      />
      
      <DiscordNotification
        variant="warning"
        title="Warning"
        message="Memory usage is approaching 80% capacity."
        floating
      />
      
      <DiscordNotification
        variant="error"
        title="Error"
        message="Failed to connect to Discord API. Please check your token."
      />
      
      <DiscordNotification
        variant="mention"
        title="Mention"
        message="You were mentioned in #general by @user"
        floating
      />
    </div>
  );
}