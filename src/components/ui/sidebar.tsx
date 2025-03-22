import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { NotificationSettingsButton } from "@/components/ui/notification-settings-button";

interface SidebarProps {
  username?: string;
  role?: string;
  lastUpdated?: string;
  systemStatus?: "online" | "offline" | "warning";
}

// Logout Button Component
const LogoutButton = () => {
  const { logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
        variant: "default"
      });
      window.location.href = '/';
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <button 
      onClick={handleLogout}
      className="ml-auto text-gray-400 hover:text-white transition-colors"
      title="Logout"
    >
      <i className="fas fa-sign-out-alt"></i>
    </button>
  );
};

export function Sidebar({ 
  username = "Admin User", 
  role = "Administrator", 
  lastUpdated = "2 minutes ago",
  systemStatus = "online"
}: SidebarProps) {
  const [location] = useLocation();
  const { isMobile } = useMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);

  useEffect(() => {
    if (!isMobile) {
      setIsOpen(true);
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const getStatusClasses = (status: "online" | "offline" | "warning") => {
    switch (status) {
      case "online":
        return "bg-success status-online";
      case "offline":
        return "bg-danger status-offline";
      case "warning":
        return "bg-warning status-warning";
      default:
        return "bg-success status-online";
    }
  };

  const navItems = [
    { href: "/dashboard", icon: "fa-tachometer-alt", label: "Dashboard" },
    { href: "/bots", icon: "fa-robot", label: "My Bots" },
    { href: "/analytics", icon: "fa-chart-line", label: "Analytics" },
    { href: "/logs", icon: "fa-file-alt", label: "Logs" },
    { href: "/server", icon: "fa-server", label: "Server Status" },
    { href: "/settings", icon: "fa-cog", label: "Settings" },
  ];

  const handleNavigation = (href: string) => {
    window.location.href = href;
  };

  return (
    <>
      <aside className={cn(
        "bg-background-light flex-shrink-0 border-r border-gray-800 z-20",
        "transition-all duration-300 fixed md:static h-screen",
        isMobile ? (isOpen ? "left-0 w-64" : "-left-64 w-0") : "w-64"
      )}>
        {/* Logo section */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-md bg-primary/20 neon-glow flex items-center justify-center">
              <i className="fas fa-robot text-primary"></i>
            </div>
            <h1 className="ml-3 font-bold text-xl text-primary neon-text">BotDash</h1>
          </div>
          {isMobile && (
            <button 
              className="text-gray-400 hover:text-white"
              onClick={toggleSidebar}
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="py-4">
          <ul>
            {navItems.map((item) => (
              <li key={item.href} className="mb-1">
                <div 
                  onClick={() => handleNavigation(item.href)}
                  className={cn(
                    "flex items-center px-4 py-3 rounded-md mx-2 transition-all cursor-pointer",
                    location === item.href 
                      ? "text-white bg-primary/20 neon-glow" 
                      : "text-gray-300 hover:text-white hover:bg-primary/10"
                  )}
                >
                  <i className={`fas ${item.icon} w-5`}></i>
                  <span className="ml-3">{item.label}</span>
                </div>
              </li>
            ))}
          </ul>
        </nav>

        {/* System Status */}
        <div className="mt-auto p-4 border-t border-gray-800">
          <div className="flex items-center mb-2">
            <div className={`w-2 h-2 rounded-full ${getStatusClasses(systemStatus)}`}></div>
            <span className="ml-2 text-sm text-gray-300">System {systemStatus.charAt(0).toUpperCase() + systemStatus.slice(1)}</span>
          </div>
          <div className="text-xs text-gray-400">
            <p>Last updated: <span>{lastUpdated}</span></p>
          </div>
        </div>

        {/* User profile */}
        <div className="p-4 border-t border-gray-800 flex items-center">
          <div className="w-8 h-8 rounded-full bg-accent/30 blue-glow"></div>
          <div className="ml-3">
            <p className="text-sm font-medium">{username}</p>
            <p className="text-xs text-gray-400">{role}</p>
          </div>
          <div className="flex ml-auto">
            <NotificationSettingsButton />
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Mobile toggle button */}
      {isMobile && !isOpen && (
        <button 
          className="fixed top-4 left-4 z-30 p-2 rounded-md bg-background-light text-gray-400 hover:text-white"
          onClick={toggleSidebar}
        >
          <i className="fas fa-bars"></i>
        </button>
      )}

      {/* Overlay to close sidebar on mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}