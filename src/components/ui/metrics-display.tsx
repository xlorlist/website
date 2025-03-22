import { cn, formatPercentage } from "@/lib/utils";
import { Metric } from "@shared/schema";

interface MetricsDisplayProps {
  metrics?: Metric;
  serverStatus?: {
    primary: "operational" | "maintenance" | "offline";
    backup: "operational" | "maintenance" | "offline";
  };
}

export function MetricsDisplay({ 
  metrics, 
  serverStatus = { 
    primary: "operational", 
    backup: "maintenance" 
  } 
}: MetricsDisplayProps) {
  if (!metrics) {
    return (
      <div className="bg-background-light rounded-lg p-4 neon-border">
        <h3 className="font-semibold mb-4">System Metrics</h3>
        <div className="p-6 flex items-center justify-center">
          <div className="text-gray-400">
            <i className="fas fa-spinner fa-spin mr-2"></i>
            Loading metrics...
          </div>
        </div>
      </div>
    );
  }
  
  const cpuPercentage = metrics.cpuUsage || 0;
  const memoryPercentage = formatPercentage(
    metrics.memoryUsage || 0, 
    metrics.memoryTotal || 1
  );
  const diskPercentage = formatPercentage(
    metrics.diskUsage || 0, 
    metrics.diskTotal || 1
  );
  const networkPercentage = Math.min(Math.floor((metrics.networkUsage || 0) / 100), 100);
  
  const formatValue = (value: number, total: number = 0, unit: string) => {
    // Convert to appropriate unit and shorten the display
    if (total) {
      if (unit === 'MB') {
        // If values are large, convert to GB
        if (value >= 1000 || total >= 1000) {
          return `${(value / 1000).toFixed(1)}/${(total / 1000).toFixed(1)}GB`;
        }
        // For smaller screens, make format more compact
        return `${value}/${total}MB`;
      }
      return `${value}${unit} / ${total}${unit}`;
    }
    if (unit === 'MB/s') {
      return `${(value / 1000).toFixed(1)} MB/s`;
    }
    return `${value}${unit}`;
  };
  
  const getStatusClasses = (status: string) => {
    switch (status) {
      case "operational":
        return {
          dot: "bg-success status-online",
          text: "text-success"
        };
      case "maintenance":
        return {
          dot: "bg-warning status-warning", 
          text: "text-warning"
        };
      case "offline":
        return {
          dot: "bg-danger status-offline",
          text: "text-danger"
        };
      default:
        return {
          dot: "bg-success status-online",
          text: "text-success"
        };
    }
  };
  
  const primaryStatus = getStatusClasses(serverStatus.primary);
  const backupStatus = getStatusClasses(serverStatus.backup);
  
  return (
    <div className="bg-background-light rounded-lg p-4 neon-border">
      <h3 className="font-semibold mb-4">System Metrics</h3>
      
      {/* CPU Usage - Featured prominently with larger display */}
      <div className="mb-5 border border-primary/20 rounded-lg p-3 bg-background/20">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-primary">CPU Usage</span>
          <span className="text-lg font-bold text-primary neon-text">{cpuPercentage}%</span>
        </div>
        <div className="w-full bg-background rounded-full h-3">
          <div 
            className="bg-primary h-3 rounded-full neon-glow" 
            style={{ width: `${cpuPercentage}%` }}
          ></div>
        </div>
      </div>
      
      {/* Two column layout for smaller metrics on larger screens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Memory Usage */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-300">Memory</span>
            <span className="text-sm font-medium whitespace-nowrap">
              {formatValue(metrics.memoryUsage || 0, metrics.memoryTotal || 0, 'MB')}
            </span>
          </div>
          <div className="w-full bg-background rounded-full h-2">
            <div 
              className="bg-secondary h-2 rounded-full blue-glow" 
              style={{ width: `${memoryPercentage}%` }}
            ></div>
          </div>
        </div>
        
        {/* Disk Usage */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-300">Disk</span>
            <span className="text-sm font-medium whitespace-nowrap">
              {formatValue(metrics.diskUsage || 0, metrics.diskTotal || 0, 'MB')}
            </span>
          </div>
          <div className="w-full bg-background rounded-full h-2">
            <div 
              className="bg-accent h-2 rounded-full pink-glow" 
              style={{ width: `${diskPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Network Traffic */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-300">Network Traffic</span>
          <span className="text-sm font-medium">
            {formatValue(metrics.networkUsage || 0, 0, 'MB/s')}
          </span>
        </div>
        <div className="w-full bg-background rounded-full h-2">
          <div 
            className="bg-warning h-2 rounded-full" 
            style={{ width: `${networkPercentage}%` }}
          ></div>
        </div>
      </div>
      
      {/* Server Status */}
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">Server Status</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-background p-2 rounded flex justify-between items-center">
            <span className="text-xs">Primary</span>
            <div className="flex items-center">
              <div className={cn("w-2 h-2 rounded-full mr-1", primaryStatus.dot)}></div>
              <span className={cn("text-xs", primaryStatus.text)}>
                {serverStatus.primary.charAt(0).toUpperCase() + serverStatus.primary.slice(1)}
              </span>
            </div>
          </div>
          <div className="bg-background p-2 rounded flex justify-between items-center">
            <span className="text-xs">Backup</span>
            <div className="flex items-center">
              <div className={cn("w-2 h-2 rounded-full mr-1", backupStatus.dot)}></div>
              <span className={cn("text-xs", backupStatus.text)}>
                {serverStatus.backup.charAt(0).toUpperCase() + serverStatus.backup.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
