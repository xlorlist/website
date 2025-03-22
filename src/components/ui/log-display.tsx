import { Log } from "@shared/schema";
import { formatDate } from "@/lib/utils";

interface LogDisplayProps {
  logs?: Log[];
  title?: string;
  maxHeight?: string;
  showViewAll?: boolean;
  onViewAll?: () => void;
  loading?: boolean;
}

export function LogDisplay({ 
  logs = [], 
  title = "Recent Logs", 
  maxHeight = "max-h-64",
  showViewAll = true,
  onViewAll,
  loading = false
}: LogDisplayProps) {
  
  const getLogLevelClass = (level: string) => {
    switch (level.toLowerCase()) {
      case 'info':
        return 'text-success';
      case 'warning':
        return 'text-warning';
      case 'error':
        return 'text-danger';
      default:
        return 'text-gray-400';
    }
  };
  
  const getBotName = (log: Log) => {
    // Extract bot name from message if available
    const match = log.message.match(/\[(.*?)\]/);
    if (match && match[1]) {
      return match[1];
    }
    
    // If botId is missing, it's likely a system log
    if (!log.botId) {
      return 'System';
    }
    
    return `Bot #${log.botId}`;
  };
  
  const formatLogMessage = (log: Log) => {
    // Remove any bot name prefix from message for cleaner display
    return log.message.replace(/\[.*?\]/, '').trim();
  };
  
  return (
    <div className="bg-background-light rounded-lg p-4 neon-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{title}</h3>
        {showViewAll && (
          <button 
            onClick={onViewAll}
            className="text-sm text-primary hover:underline"
          >
            View All
          </button>
        )}
      </div>
      <div className={`font-mono text-sm bg-background p-3 rounded ${maxHeight} overflow-y-auto hide-scrollbar`}>
        {loading ? (
          <div className="flex items-center justify-center h-20 text-gray-400">
            <i className="fas fa-spinner fa-spin mr-2"></i>
            Loading logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-gray-400">
            No logs available
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="mb-2 flex">
              <span className="text-gray-400 mr-2">[{formatDate(log.timestamp)}]</span>
              <span className={getLogLevelClass(log.level)}>[{getBotName(log)}]</span>
              <span className="ml-2">{formatLogMessage(log)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
