import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState } from "react";

interface OwnerPanelProps {
  onRefresh?: () => void;
}

export function OwnerPanel({ onRefresh }: OwnerPanelProps) {
  const [isRestarting, setIsRestarting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleRestartServer = async () => {
    setIsRestarting(true);
    try {
      // For demonstration, we're just waiting, but this would call an API endpoint in production
      await new Promise(resolve => setTimeout(resolve, 1500));
      if (onRefresh) onRefresh();
    } finally {
      setIsRestarting(false);
    }
  };

  const handleResetDatabase = async () => {
    if (!window.confirm("Are you sure you want to reset the database? This action cannot be undone!")) {
      return;
    }
    
    setIsResetting(true);
    try {
      // For demonstration, we're just waiting, but this would call an API endpoint in production
      await new Promise(resolve => setTimeout(resolve, 1500));
      if (onRefresh) onRefresh();
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Card className="p-4 border-0 bg-background-light/70 backdrop-blur-sm shadow-xl overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold neon-text">Owner Panel</h3>
        <div className="rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary animate-pulse">
          Owner Access
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            className="w-full relative overflow-hidden group neon-glow-danger"
            onClick={handleRestartServer}
            disabled={isRestarting}
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-red-500/10 to-red-400/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></span>
            <span className="relative flex items-center justify-center">
              {isRestarting ? 
                <><i className="fas fa-spinner fa-spin mr-2"></i>Restarting...</> : 
                <><i className="fas fa-power-off mr-2"></i>Restart Server</>
              }
            </span>
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full relative overflow-hidden group neon-glow-danger"
            onClick={handleResetDatabase}
            disabled={isResetting}
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-red-500/10 to-red-400/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></span>
            <span className="relative flex items-center justify-center">
              {isResetting ? 
                <><i className="fas fa-spinner fa-spin mr-2"></i>Resetting...</> : 
                <><i className="fas fa-database mr-2"></i>Reset Database</>
              }
            </span>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <Button 
            variant="default" 
            className="w-full relative overflow-hidden group blue-glow"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500/10 to-blue-400/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></span>
            <span className="relative flex items-center justify-center">
              <i className="fas fa-shield-alt mr-2"></i>
              Manage User Permissions
            </span>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            className="w-full text-xs flex items-center justify-center"
          >
            <i className="fas fa-cog mr-2"></i>
            System Configuration
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            className="w-full text-xs flex items-center justify-center"
          >
            <i className="fas fa-terminal mr-2"></i>
            Access Server Console
          </Button>
        </div>
      </div>
    </Card>
  );
}