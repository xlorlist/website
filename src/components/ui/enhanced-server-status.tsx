import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Metric } from "@shared/schema";

interface EnhancedServerStatusProps {
  metrics?: Metric;
  title?: string;
}

export function EnhancedServerStatus({ metrics, title = "Server Status" }: EnhancedServerStatusProps) {
  const [pulseSize, setPulseSize] = useState(1);
  const [animatedMetrics, setAnimatedMetrics] = useState<{
    cpu: number;
    memory: number;
    disk: number;
    network: number;
    uptime: number;
    responseTime: number;
  }>({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    uptime: 99.8,
    responseTime: 120,
  });
  
  const [networkNodes, setNetworkNodes] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    speed: number;
    direction: { x: number; y: number };
    connected: boolean;
  }>>([]);
  
  // Update animated metrics when real metrics change
  useEffect(() => {
    if (metrics) {
      // Animate the transition of metrics over time
      setAnimatedMetrics(prev => ({
        ...prev,
        cpu: metrics.cpuUsage || 0,
        memory: metrics.memoryUsage ? (metrics.memoryUsage / (metrics.memoryTotal || 1) * 100) : 0,
        disk: metrics.diskUsage ? (metrics.diskUsage / (metrics.diskTotal || 1) * 100) : 0,
        network: metrics.networkUsage || 0,
      }));
    }
  }, [metrics]);
  
  // Pulse animation effect
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setPulseSize(prev => (prev === 1 ? 1.05 : 1));
    }, 2000);
    
    return () => clearInterval(pulseInterval);
  }, []);
  
  // Generate and animate network nodes
  useEffect(() => {
    // Initialize network nodes
    const initialNodes = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 3 + Math.random() * 5,
      speed: 0.1 + Math.random() * 0.2,
      direction: { 
        x: Math.random() > 0.5 ? 0.5 : -0.5, 
        y: Math.random() > 0.5 ? 0.5 : -0.5 
      },
      connected: Math.random() > 0.3,
    }));
    
    setNetworkNodes(initialNodes);
    
    // Animation frame for node movement
    const moveInterval = setInterval(() => {
      setNetworkNodes(prevNodes => {
        return prevNodes.map(node => {
          let newX = node.x + (node.direction.x * node.speed);
          let newY = node.y + (node.direction.y * node.speed);
          
          // Bounce off edges
          if (newX < 0 || newX > 100) {
            node.direction.x *= -1;
            newX = Math.max(0, Math.min(100, newX));
          }
          
          if (newY < 0 || newY > 100) {
            node.direction.y *= -1;
            newY = Math.max(0, Math.min(100, newY));
          }
          
          // Randomly change connection status
          if (Math.random() < 0.01) {
            node.connected = !node.connected;
          }
          
          return {
            ...node,
            x: newX,
            y: newY,
          };
        });
      });
    }, 50);
    
    return () => clearInterval(moveInterval);
  }, []);
  
  // Status determination
  const getStatusColor = (value: number): string => {
    if (value < 50) return "rgb(74, 222, 128)"; // Green
    if (value < 80) return "rgb(250, 204, 21)"; // Yellow
    return "rgb(248, 113, 113)"; // Red
  };
  
  const cpuColor = getStatusColor(animatedMetrics.cpu);
  const memoryColor = getStatusColor(animatedMetrics.memory);
  const diskColor = getStatusColor(animatedMetrics.disk);
  
  // Calculate which nodes can connect (within proximity)
  const connections = networkNodes.flatMap((node, i) => {
    return networkNodes.slice(i + 1).map(otherNode => {
      const distance = Math.sqrt(
        Math.pow(node.x - otherNode.x, 2) + 
        Math.pow(node.y - otherNode.y, 2)
      );
      
      // Only connect if both nodes are connected and within proximity
      if (distance < 35 && node.connected && otherNode.connected) {
        return {
          from: node,
          to: otherNode,
          distance,
          opacity: 1 - (distance / 35)
        };
      }
      return null;
    }).filter((connection): connection is { from: any; to: any; distance: number; opacity: number } => 
      connection !== null
    );
  });
  
  return (
    <Card className="p-4 border-0 bg-background-light/70 backdrop-blur-sm shadow-xl overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold neon-text">{title}</h3>
        <div 
          className="h-2.5 w-2.5 rounded-full bg-success status-online"
          style={{ transform: `scale(${pulseSize})`, transition: 'transform 1s ease-in-out' }}
        ></div>
      </div>
      
      {/* Circular status display */}
      <div className="flex justify-center items-center mb-6 mt-2 relative">
        <div className="w-48 h-48 rounded-full relative flex items-center justify-center">
          {/* Network visualization */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div className="w-full h-full relative bg-background-light/80">
              {/* Network nodes */}
              {networkNodes.map(node => (
                <div 
                  key={node.id}
                  className={`absolute rounded-full ${node.connected ? 'bg-secondary' : 'bg-gray-700'}`}
                  style={{
                    width: `${node.size}px`,
                    height: `${node.size}px`,
                    left: `calc(${node.x}% - ${node.size / 2}px)`,
                    top: `calc(${node.y}% - ${node.size / 2}px)`,
                    boxShadow: node.connected ? '0 0 8px rgba(67, 97, 238, 0.8)' : 'none',
                    transition: 'background-color 0.5s ease',
                  }}
                />
              ))}
              
              {/* Network connections */}
              <svg className="absolute inset-0 w-full h-full">
                {connections.map((connection, idx) => (
                  <line 
                    key={idx}
                    x1={`${connection.from.x}%`}
                    y1={`${connection.from.y}%`}
                    x2={`${connection.to.x}%`}
                    y2={`${connection.to.y}%`}
                    stroke="rgba(67, 97, 238, 0.5)"
                    strokeWidth="1"
                    opacity={connection.opacity.toString()}
                  />
                ))}
              </svg>
            </div>
          </div>
          
          {/* Central circular metrics */}
          <div className="z-10 w-28 h-28 rounded-full bg-background/80 flex flex-col items-center justify-center border border-secondary/30 blue-glow">
            <div className="text-xs text-gray-400">Health</div>
            <div className="text-2xl font-bold text-secondary">
              {100 - Math.floor((animatedMetrics.cpu + animatedMetrics.memory + animatedMetrics.disk) / 3)}%
            </div>
            <div className="text-xs text-gray-400 mt-1">Operational</div>
          </div>
          
          {/* Circular progress indicators */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            {/* CPU Usage */}
            <circle 
              cx="50%" 
              cy="50%" 
              r="46" 
              fill="none" 
              stroke="rgba(74, 222, 128, 0.1)" 
              strokeWidth="8"
            />
            <circle 
              cx="50%" 
              cy="50%" 
              r="46" 
              fill="none" 
              stroke={cpuColor} 
              strokeWidth="8"
              strokeDasharray={`${(animatedMetrics.cpu / 100) * 2 * Math.PI * 46} ${2 * Math.PI * 46}`}
              className="circle-progress"
              style={{ filter: `drop-shadow(0 0 3px ${cpuColor})` }}
            />
            
            {/* Memory Usage - middle ring */}
            <circle 
              cx="50%" 
              cy="50%" 
              r="38" 
              fill="none" 
              stroke="rgba(250, 204, 21, 0.1)" 
              strokeWidth="8"
            />
            <circle 
              cx="50%" 
              cy="50%" 
              r="38" 
              fill="none" 
              stroke={memoryColor} 
              strokeWidth="8"
              strokeDasharray={`${(animatedMetrics.memory / 100) * 2 * Math.PI * 38} ${2 * Math.PI * 38}`}
              className="circle-progress"
              style={{ filter: `drop-shadow(0 0 3px ${memoryColor})` }}
            />
            
            {/* Disk Usage - inner ring */}
            <circle 
              cx="50%" 
              cy="50%" 
              r="30" 
              fill="none" 
              stroke="rgba(248, 113, 113, 0.1)" 
              strokeWidth="8"
            />
            <circle 
              cx="50%" 
              cy="50%" 
              r="30" 
              fill="none" 
              stroke={diskColor} 
              strokeWidth="8"
              strokeDasharray={`${(animatedMetrics.disk / 100) * 2 * Math.PI * 30} ${2 * Math.PI * 30}`}
              className="circle-progress"
              style={{ filter: `drop-shadow(0 0 3px ${diskColor})` }}
            />
          </svg>
        </div>
      </div>
      
      {/* Resource metrics */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-background/60 p-3 rounded-lg backdrop-blur-sm neon-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <i className="fas fa-microchip text-secondary mr-2 blue-glow p-1 rounded"></i>
              <p className="text-xs text-gray-400">CPU</p>
            </div>
            <p className="text-sm font-medium" style={{ color: cpuColor }}>{Math.round(animatedMetrics.cpu)}%</p>
          </div>
          <div className="h-1.5 bg-secondary/10 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ 
                width: `${animatedMetrics.cpu}%`, 
                backgroundColor: cpuColor,
                boxShadow: `0 0 8px ${cpuColor}`
              }}
            ></div>
          </div>
        </div>
        
        <div className="bg-background/60 p-3 rounded-lg backdrop-blur-sm neon-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <i className="fas fa-memory text-secondary mr-2 blue-glow p-1 rounded"></i>
              <p className="text-xs text-gray-400">Memory</p>
            </div>
            <p className="text-sm font-medium" style={{ color: memoryColor }}>{Math.round(animatedMetrics.memory)}%</p>
          </div>
          <div className="h-1.5 bg-secondary/10 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ 
                width: `${animatedMetrics.memory}%`, 
                backgroundColor: memoryColor,
                boxShadow: `0 0 8px ${memoryColor}`
              }}
            ></div>
          </div>
        </div>
        
        <div className="bg-background/60 p-3 rounded-lg backdrop-blur-sm neon-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <i className="fas fa-hard-drive text-secondary mr-2 blue-glow p-1 rounded"></i>
              <p className="text-xs text-gray-400">Disk</p>
            </div>
            <p className="text-sm font-medium" style={{ color: diskColor }}>{Math.round(animatedMetrics.disk)}%</p>
          </div>
          <div className="h-1.5 bg-secondary/10 rounded-full mt-2 overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ 
                width: `${animatedMetrics.disk}%`, 
                backgroundColor: diskColor,
                boxShadow: `0 0 8px ${diskColor}`
              }}
            ></div>
          </div>
        </div>
        
        {/* Network traffic visualization */}
        <div className="bg-background/60 p-3 rounded-lg backdrop-blur-sm neon-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <i className="fas fa-network-wired text-secondary mr-2 blue-glow p-1 rounded"></i>
              <p className="text-xs text-gray-400">Network</p>
            </div>
          </div>
          <div className="flex h-4 items-end space-x-1">
            {Array.from({ length: 10 }).map((_, i) => {
              const randomHeight = 30 + Math.random() * 70;
              return (
                <div 
                  key={i}
                  className="flex-1 bg-secondary rounded-sm" 
                  style={{ 
                    height: `${randomHeight}%`,
                    animation: `network-bar-wave ${1 + Math.random()}s ease-in-out infinite`,
                    animationDelay: `${i * 0.1}s`,
                    '--bar-height': `${randomHeight}%`
                  } as React.CSSProperties}
                ></div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Additional status indicators */}
      <div className="flex space-x-3">
        <div className="flex-1 flex flex-col items-center justify-center p-2 bg-background/40 rounded-lg">
          <div className="text-xs text-gray-400">Response</div>
          <div className="text-sm font-medium text-secondary">{animatedMetrics.responseTime}ms</div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-2 bg-background/40 rounded-lg">
          <div className="text-xs text-gray-400">Uptime</div>
          <div className="text-sm font-medium text-success">{animatedMetrics.uptime}%</div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-2 bg-background/40 rounded-lg">
          <div className="text-xs text-gray-400">Status</div>
          <div className="text-sm font-medium text-success">Online</div>
        </div>
      </div>
    </Card>
  );
}