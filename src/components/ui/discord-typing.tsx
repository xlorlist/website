import React from "react";
import { cn } from "@/lib/utils";

interface DiscordTypingProps {
  username?: string;
  showText?: boolean;
  className?: string;
  dotColor?: string;
}

export function DiscordTyping({
  username,
  showText = true,
  className,
  dotColor = "#b9bbbe",
}: DiscordTypingProps) {
  return (
    <div className={cn("flex items-center text-xs text-[#b9bbbe]", className)}>
      <div className="discord-typing-indicator mr-1">
        <span style={{ backgroundColor: dotColor }}></span>
        <span style={{ backgroundColor: dotColor }}></span>
        <span style={{ backgroundColor: dotColor }}></span>
      </div>
      
      {showText && (
        <span>
          {username ? (
            <span>
              <span className="font-medium text-[#e0e0e0]">{username}</span> is typing...
            </span>
          ) : (
            "Someone is typing..."
          )}
        </span>
      )}
    </div>
  );
}

export function DiscordConnectionStatus({
  status = "connecting",
  className
}: {
  status: "connecting" | "connected" | "disconnected";
  className?: string;
}) {
  const statusColors = {
    connecting: {
      color: "#faa61a",
      text: "Connecting to server...",
      icon: "⚡"
    },
    connected: {
      color: "#3ba55d",
      text: "Connected to server",
      icon: "✓"
    },
    disconnected: {
      color: "#ed4245",
      text: "Disconnected from server",
      icon: "✗"
    }
  };

  const currentStatus = statusColors[status];

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div 
        className="flex items-center text-sm mb-1"
        style={{ color: currentStatus.color }}
      >
        <span className="mr-1.5">{currentStatus.icon}</span>
        <span>{currentStatus.text}</span>
      </div>
      
      {status === "connecting" && (
        <div className="discord-loading-bar w-full max-w-40 mb-2 mt-1"></div>
      )}
    </div>
  );
}