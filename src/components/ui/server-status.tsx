import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { webSocketClient } from '@/lib/websocket';
import type { Metric } from '@shared/schema';

interface ServerStatusProps {
  title?: string;
  showDetails?: boolean;
}

// Extended metrics interface with additional properties for visualization
interface ExtendedMetric extends Metric {
  responseTime?: number;
  networkIn?: number;
  networkOut?: number;
  uptime?: number;
}

export function ServerStatus({ title = "Server Status", showDetails = true }: ServerStatusProps) {
  const [metrics, setMetrics] = useState<ExtendedMetric | null>(null);
  const [serverState, setServerState] = useState<'online' | 'degraded' | 'offline'>('online');
  const [pulseBeat, setPulseBeat] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const animationFrameRef = useRef<number | null>(null);
  
  // Animation constants
  const circleRadius = 80;
  const strokeWidth = 10;
  const pulseMax = 10;
  
  // Update server state based on metrics
  useEffect(() => {
    if (!metrics) return;
    
    const cpuUsage = metrics.cpuUsage || 0;
    const memoryUsage = metrics.memoryUsage || 0;
    
    if (cpuUsage > 80 || memoryUsage > 85) {
      setServerState('degraded');
    } else if (cpuUsage === 0 && memoryUsage === 0) {
      setServerState('offline');
    } else {
      setServerState('online');
    }
  }, [metrics]);
  
  // Pulse animation
  useEffect(() => {
    const animate = () => {
      setPulseBeat((prev) => (prev + 0.2) % pulseMax);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // WebSocket data subscription
  useEffect(() => {
    // Function to handle status updates
    const handleStatusUpdate = (data: any) => {
      if (data.metrics) {
        // Extend metrics with additional properties for visualization
        const extendedMetrics: ExtendedMetric = {
          ...data.metrics,
          responseTime: 45 + Math.random() * 15, // Simulated response time between 45-60ms
          networkIn: 5 + Math.random() * 10,     // Simulated network in between 5-15 Mbps
          networkOut: 2 + Math.random() * 5,     // Simulated network out between 2-7 Mbps
          uptime: 3600 * 24 * (2 + Math.random() * 5), // Simulated uptime between 2-7 days
        };
        
        setMetrics(extendedMetrics);
        setIsLoading(false);
      }
    };
    
    // Subscribe to WebSocket events
    webSocketClient.on('statusUpdate', handleStatusUpdate);
    
    // Initial data request
    const fetchInitialData = async () => {
      try {
        const response = await fetch('/api/metrics');
        if (response.ok) {
          const data = await response.json();
          // Extend metrics with additional properties for visualization
          const extendedMetrics: ExtendedMetric = {
            ...data,
            responseTime: 45 + Math.random() * 15,
            networkIn: 5 + Math.random() * 10,
            networkOut: 2 + Math.random() * 5,
            uptime: 3600 * 24 * (2 + Math.random() * 5),
          };
          
          setMetrics(extendedMetrics);
        }
      } catch (error) {
        console.error('Failed to fetch initial metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInitialData();
    
    // Request regular updates
    const intervalId = setInterval(() => {
      webSocketClient.requestUpdate();
    }, 5000);
    
    // Cleanup
    return () => {
      webSocketClient.off('statusUpdate', handleStatusUpdate);
      clearInterval(intervalId);
    };
  }, []);
  
  // Calculate pulsing animation values
  const pulseScale = 1 + Math.sin(pulseBeat) * 0.03;
  const pulseOpacity = 0.6 + Math.sin(pulseBeat) * 0.4;
  
  // Calculate server health metrics
  const getServerHealthColor = () => {
    switch (serverState) {
      case 'online': return 'rgb(74, 222, 128)';
      case 'degraded': return 'rgb(250, 204, 21)';
      case 'offline': return 'rgb(248, 113, 113)';
      default: return 'rgb(148, 163, 184)';
    }
  };
  
  const getServerHealthClass = () => {
    switch (serverState) {
      case 'online': return 'status-online';
      case 'degraded': return 'status-warning';
      case 'offline': return 'status-offline';
      default: return '';
    }
  };
  
  const getServerStatusText = () => {
    switch (serverState) {
      case 'online': return 'Fully Operational';
      case 'degraded': return 'Performance Degraded';
      case 'offline': return 'System Offline';
      default: return 'Status Unknown';
    }
  };
  
  // Calculate progress values
  const cpuPercentage = metrics?.cpuUsage ?? 0;
  const memoryPercentage = metrics?.memoryUsage ?? 0;
  
  // Calculate disk percentage (if diskTotal exists and is not zero)
  const diskPercentage = (metrics?.diskTotal && metrics.diskTotal > 0) ? 
    ((metrics.diskUsage ?? 0) / metrics.diskTotal) * 100 : 0;
    
  const networkPercentage = metrics?.networkUsage ?? 0;
  
  // Calculate circumference for progress circles
  const circumference = 2 * Math.PI * circleRadius;
  
  // Calculate stroke-dashoffset for each metric
  const calculateStrokeDashoffset = (percentage: number) => {
    return circumference - (circumference * percentage) / 100;
  };
  
  // Create an array for the network traffic visualization
  const networkBars = Array.from({ length: 20 }, (_, i) => {
    const randomHeight = metrics?.networkUsage ? 
      ((metrics.networkUsage / 100) * Math.random() * 0.8 + 0.2) * 100 : 
      Math.random() * 20;
    return randomHeight;
  });
  
  return (
    <Card className="p-0 overflow-hidden">
      <div className="relative">
        <div className={`absolute inset-0 bg-gradient-to-br ${
          serverState === 'online' ? 'from-green-500/5 to-green-700/10' : 
          serverState === 'degraded' ? 'from-yellow-500/5 to-yellow-700/10' : 
          'from-red-500/5 to-red-700/10'
        } transition-colors duration-500`}></div>
        
        <div className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{title}</h3>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${getServerHealthClass()}`}></div>
              <span className="text-sm font-medium">{getServerStatusText()}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Server Pulse Visualization */}
            <div className="flex flex-col items-center justify-center p-4">
              <div className="relative w-48 h-48 flex items-center justify-center">
                {/* Animated Pulse Ring */}
                <div 
                  className="absolute inset-0 rounded-full" 
                  style={{
                    transform: `scale(${pulseScale})`,
                    opacity: pulseOpacity,
                    boxShadow: `0 0 20px ${getServerHealthColor()}80, inset 0 0 15px ${getServerHealthColor()}50`,
                    border: `1px solid ${getServerHealthColor()}90`,
                    transition: 'box-shadow 0.5s ease'
                  }}
                ></div>
                
                {/* CPU Circle */}
                <svg className="absolute inset-0 transform -rotate-90 w-full h-full" viewBox={`0 0 ${(circleRadius + strokeWidth) * 2} ${(circleRadius + strokeWidth) * 2}`}>
                  <circle 
                    cx={circleRadius + strokeWidth} 
                    cy={circleRadius + strokeWidth} 
                    r={circleRadius} 
                    fill="none" 
                    stroke="rgba(148, 163, 184, 0.2)" 
                    strokeWidth={strokeWidth} 
                  />
                  <circle 
                    cx={circleRadius + strokeWidth} 
                    cy={circleRadius + strokeWidth} 
                    r={circleRadius} 
                    fill="none" 
                    stroke={getServerHealthColor()} 
                    strokeWidth={strokeWidth} 
                    strokeDasharray={circumference} 
                    strokeDashoffset={calculateStrokeDashoffset(cpuPercentage)}
                    className="transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                  />
                </svg>
                
                {/* Memory Circle (inner) */}
                <svg className="absolute inset-0 transform -rotate-90 w-full h-full scale-75" viewBox={`0 0 ${(circleRadius + strokeWidth) * 2} ${(circleRadius + strokeWidth) * 2}`}>
                  <circle 
                    cx={circleRadius + strokeWidth} 
                    cy={circleRadius + strokeWidth} 
                    r={circleRadius} 
                    fill="none" 
                    stroke="rgba(148, 163, 184, 0.1)" 
                    strokeWidth={strokeWidth} 
                  />
                  <circle 
                    cx={circleRadius + strokeWidth} 
                    cy={circleRadius + strokeWidth} 
                    r={circleRadius} 
                    fill="none" 
                    stroke={getServerHealthColor()} 
                    strokeWidth={strokeWidth} 
                    strokeDasharray={circumference} 
                    strokeDashoffset={calculateStrokeDashoffset(memoryPercentage)}
                    className="transition-all duration-1000 ease-out"
                    strokeLinecap="round"
                    style={{ filter: 'brightness(1.2)' }}
                  />
                </svg>
                
                {/* Center Status */}
                <div className="flex flex-col items-center justify-center z-10">
                  <div className="text-4xl font-bold neon-text" style={{ color: getServerHealthColor() }}>
                    {isLoading ? '--' : Math.round(cpuPercentage)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">CPU LOAD</div>
                </div>
              </div>
              
              <div className="mt-2 text-center">
                <div className="text-sm">System Response Time</div>
                <div className="text-xl font-semibold">
                  {isLoading ? '--' : (metrics?.responseTime || 0).toFixed(1)} ms
                </div>
              </div>
            </div>
            
            {/* Detailed Metrics */}
            {showDetails && (
              <div className="flex flex-col space-y-4">
                {/* Memory Usage */}
                <div className="flex flex-col">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Memory</span>
                    <span className="text-sm">{Math.round(memoryPercentage)}%</span>
                  </div>
                  <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${memoryPercentage}%`,
                        background: `linear-gradient(90deg, ${getServerHealthColor()}70, ${getServerHealthColor()})`,
                        boxShadow: `0 0 5px ${getServerHealthColor()}80`
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{isLoading ? '--' : `${Math.round((metrics?.memoryUsage || 0) / 10.24)} MB used`}</span>
                    <span>{isLoading ? '--' : `${Math.round((metrics?.memoryTotal || 0) / 10.24)} MB total`}</span>
                  </div>
                </div>
                
                {/* Disk Usage */}
                <div className="flex flex-col">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Disk</span>
                    <span className="text-sm">{Math.round(diskPercentage)}%</span>
                  </div>
                  <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${diskPercentage}%`,
                        background: `linear-gradient(90deg, ${getServerHealthColor()}70, ${getServerHealthColor()})`,
                        boxShadow: `0 0 5px ${getServerHealthColor()}80`
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>
                      {isLoading ? '--' : `${((metrics?.diskUsage || 0) / 1024).toFixed(1)} GB used`}
                    </span>
                    <span>
                      {isLoading ? '--' : `${((metrics?.diskTotal || 0) / 1024).toFixed(1)} GB total`}
                    </span>
                  </div>
                </div>
                
                {/* Network Traffic Visualization */}
                <div className="flex flex-col mt-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Network Traffic</span>
                    <span className="text-sm">{Math.round(networkPercentage)}%</span>
                  </div>
                  <div className="flex h-10 items-end space-x-1">
                    {networkBars.map((height, index) => (
                      <div 
                        key={index}
                        className="flex-1 transition-all duration-300 ease-out"
                        style={{
                          height: `${height}%`,
                          backgroundColor: getServerHealthColor(),
                          opacity: 0.2 + (height / 100) * 0.8,
                          boxShadow: `0 0 5px ${getServerHealthColor()}80`
                        }}
                      ></div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{isLoading ? '--' : `${(metrics?.networkIn || 0).toFixed(2)} Mbps in`}</span>
                    <span>{isLoading ? '--' : `${(metrics?.networkOut || 0).toFixed(2)} Mbps out`}</span>
                  </div>
                </div>
                
                {/* Uptime */}
                <div className="mt-2">
                  <div className="text-sm font-medium mb-1">Uptime</div>
                  <div className="flex items-center">
                    <div className="text-lg">
                      {isLoading ? '--' : formatUptime(metrics?.uptime || 0)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// Helper function to format uptime
function formatUptime(seconds: number): string {
  if (!seconds) return '0m';
  
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  let result = '';
  if (days > 0) result += `${days}d `;
  if (hours > 0 || days > 0) result += `${hours}h `;
  result += `${minutes}m`;
  
  return result;
}