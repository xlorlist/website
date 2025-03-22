import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: "primary" | "success" | "secondary" | "accent";
}

export function StatsCard({ title, value, icon, color }: StatsCardProps) {
  const getColorClasses = (color: "primary" | "success" | "secondary" | "accent") => {
    switch (color) {
      case "primary":
        return {
          bg: "bg-primary/20",
          text: "text-primary",
          glow: "neon-glow"
        };
      case "success":
        return {
          bg: "bg-success/20",
          text: "text-success",
          glow: "status-online"
        };
      case "secondary":
        return {
          bg: "bg-secondary/20",
          text: "text-secondary",
          glow: "blue-glow"
        };
      case "accent":
        return {
          bg: "bg-accent/20",
          text: "text-accent",
          glow: "pink-glow"
        };
      default:
        return {
          bg: "bg-primary/20",
          text: "text-primary",
          glow: "neon-glow"
        };
    }
  };
  
  const colorClasses = getColorClasses(color);
  
  return (
    <div className="bg-background-light p-4 rounded-lg neon-border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-300">{title}</p>
          <h3 className="text-2xl font-semibold mt-1">{value}</h3>
        </div>
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          colorClasses.bg,
          colorClasses.glow
        )}>
          <i className={`fas fa-${icon} ${colorClasses.text}`}></i>
        </div>
      </div>
    </div>
  );
}
