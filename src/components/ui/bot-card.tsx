import { useToast } from "@/hooks/use-toast";
import { Bot } from "@shared/schema";
import { startBot, stopBot, restartBot, deleteBot, getIconTypeClass, formatUptime, formatMemory } from "@/lib/discord-bot";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { BotConfigDialog } from "@/components/ui/bot-config-dialog";
import { AddToDiscord } from "@/components/ui/add-to-discord";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface BotCardProps {
  bot: Bot;
  onUpdate?: () => void;
}

export function BotCard({ bot, onUpdate }: BotCardProps) {
  const { toast } = useToast();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'start' | 'stop' | 'restart',
    title: string,
    description: string
  } | null>(null);
  
  // Get icon class based on bot type
  const iconClass = getIconTypeClass(bot.iconType || null);
  
  // Get color classes based on bot type
  const getColorClass = () => {
    switch (bot.botType) {
      case 'MUSIC':
        return {
          bg: 'bg-primary/30',
          text: 'text-primary',
          glow: 'neon-glow'
        };
      case 'MODERATION':
        return {
          bg: 'bg-secondary/30',
          text: 'text-secondary',
          glow: 'blue-glow'
        };
      case 'GAMING':
        return {
          bg: 'bg-accent/30',
          text: 'text-accent',
          glow: 'pink-glow'
        };
      default:
        return {
          bg: 'bg-primary/30',
          text: 'text-primary',
          glow: 'neon-glow'
        };
    }
  };
  
  const colorClass = getColorClass();
  
  // Format uptime for display
  const uptimeDisplay = formatUptime(bot.uptime || 0);
  
  // Handle confirmation dialog
  const openConfirm = (type: 'start' | 'stop' | 'restart') => {
    let title = '';
    let description = '';
    
    switch (type) {
      case 'start':
        title = `Start ${bot.name}?`;
        description = `Are you sure you want to start the ${bot.name} bot?`;
        break;
      case 'stop':
        title = `Stop ${bot.name}?`;
        description = `Are you sure you want to stop the ${bot.name} bot? This will disconnect it from all servers.`;
        break;
      case 'restart':
        title = `Restart ${bot.name}?`;
        description = `Are you sure you want to restart the ${bot.name} bot? This will briefly disconnect it from all servers.`;
        break;
    }
    
    setConfirmAction({ type, title, description });
    setIsConfirmOpen(true);
  };
  
  // Perform bot actions
  const performAction = async () => {
    if (!confirmAction) return;
    
    try {
      switch (confirmAction.type) {
        case 'start':
          await startBot(bot.id);
          toast({
            title: "Bot Starting",
            description: `${bot.name} is starting up. This may take a moment.`,
          });
          break;
        case 'stop':
          await stopBot(bot.id);
          toast({
            title: "Bot Stopped",
            description: `${bot.name} has been stopped.`,
          });
          break;
        case 'restart':
          await restartBot(bot.id);
          toast({
            title: "Bot Restarting",
            description: `${bot.name} is restarting. This may take a moment.`,
          });
          break;
      }
      if (onUpdate) onUpdate();
    } catch (error) {
      toast({
        title: "Action Failed",
        description: `Failed to ${confirmAction.type} ${bot.name}. Please try again.`,
        variant: "destructive"
      });
    }
    
    setIsConfirmOpen(false);
    setConfirmAction(null);
  };
  
  // Handle bot deletion
  const handleDeleteBot = async () => {
    try {
      // If bot is running, stop it first
      if (bot.isRunning) {
        await stopBot(bot.id);
      }
      
      // Delete the bot
      await deleteBot(bot.id);
      
      toast({
        title: "Bot Deleted",
        description: `${bot.name} has been removed from your dashboard.`,
      });
      
      // Call onUpdate to refresh the dashboard
      if (onUpdate) onUpdate();
    } catch (error) {
      toast({
        title: "Deletion Failed",
        description: "Failed to delete bot. Please try again.",
        variant: "destructive"
      });
    }
    
    setIsDeleteConfirmOpen(false);
  };
  
  return (
    <>
      <div className={`bg-background-light/80 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-800 relative transition-all duration-300 hover:scale-[1.02] ${bot.isRunning ? colorClass.glow : ''}`}>
        {/* Top accent bar */}
        <div className={`h-1 w-full ${bot.isRunning ? colorClass.bg.replace('/30', '/80') : 'bg-gray-700'}`}></div>
        
        <div className="p-5">
          {/* Bot header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-lg ${colorClass.bg} ${colorClass.glow} flex items-center justify-center relative group`}>
                <i className={`fas fa-${iconClass} ${colorClass.text} text-lg transition-all duration-300 group-hover:scale-110`}></i>
                
                {/* Animated pulse for online bots */}
                {bot.isRunning && (
                  <div className="absolute inset-0 rounded-lg bg-transparent border border-transparent group-hover:border-primary/30 transition-all duration-300"></div>
                )}
              </div>
              <div className="ml-3">
                <h4 className={`font-semibold text-lg ${bot.isRunning ? colorClass.text : ''}`}>{bot.name}</h4>
                <div className="flex items-center mt-1">
                  <div className={`w-2 h-2 rounded-full ${bot.isRunning ? 'bg-success status-online' : 'bg-danger status-offline'}`}></div>
                  <span className="ml-2 text-xs text-gray-300">
                    {bot.isRunning ? 'Online' : 'Offline'}
                  </span>
                  {bot.isRunning && (
                    <>
                      <span className="ml-2 text-xs text-gray-400">{uptimeDisplay}</span>
                      <span className="ml-2 text-xs text-cyan-300 font-medium animate-pulse">24/7</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800/50 transition-all">
                  <i className="fas fa-ellipsis-v"></i>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-background-light border-gray-800 min-w-[160px]">
                <DropdownMenuItem 
                  className="hover:bg-danger/20 hover:text-danger cursor-pointer focus:bg-danger/20 focus:text-danger"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                >
                  <i className="fas fa-trash-alt mr-2 text-sm"></i> 
                  Delete Bot
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Bot stats */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-background/60 p-3 rounded-lg border border-gray-800 backdrop-blur-sm">
              <div className="flex items-center">
                <i className="fas fa-memory text-gray-400 mr-2"></i>
                <p className="text-xs text-gray-400">Memory</p>
              </div>
              <p className={`text-sm font-medium mt-1 ${bot.isRunning ? colorClass.text : ''}`}>{formatMemory(bot.memory || 0)}</p>
            </div>
            <div className="bg-background/60 p-3 rounded-lg border border-gray-800 backdrop-blur-sm">
              <div className="flex items-center">
                <i className="fas fa-server text-gray-400 mr-2"></i>
                <p className="text-xs text-gray-400">Servers</p>
              </div>
              <p className={`text-sm font-medium mt-1 ${bot.isRunning ? colorClass.text : ''}`}>{bot.serverCount}</p>
            </div>
            <div className="bg-background/60 p-3 rounded-lg border border-gray-800 backdrop-blur-sm">
              <div className="flex items-center">
                <i className="fas fa-terminal text-gray-400 mr-2"></i>
                <p className="text-xs text-gray-400">Commands</p>
              </div>
              <p className={`text-sm font-medium mt-1 ${bot.isRunning ? colorClass.text : ''}`}>{bot.commandCount}</p>
            </div>
            <div className="bg-background/60 p-3 rounded-lg border border-gray-800 backdrop-blur-sm">
              <div className="flex items-center">
                <i className="fas fa-code-branch text-gray-400 mr-2"></i>
                <p className="text-xs text-gray-400">Type</p>
              </div>
              <p className={`text-sm font-medium mt-1 ${bot.isRunning ? colorClass.text : ''}`}>{bot.botType || 'Custom'}</p>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex space-x-3">
            {bot.isRunning ? (
              <>
                <button 
                  className="bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20 px-4 py-2 rounded-md text-sm flex-1 transition-all flex items-center justify-center group"
                  onClick={() => openConfirm('stop')}
                >
                  <i className="fas fa-stop mr-2 group-hover:animate-pulse"></i> Stop
                </button>
                <button 
                  className="bg-warning/10 hover:bg-warning/20 text-warning border border-warning/20 px-4 py-2 rounded-md text-sm flex-1 transition-all flex items-center justify-center group"
                  onClick={() => openConfirm('restart')}
                >
                  <i className="fas fa-sync-alt mr-2 group-hover:animate-spin"></i> Restart
                </button>
              </>
            ) : (
              <>
                <button 
                  className="bg-success/10 hover:bg-success/20 text-success border border-success/20 px-4 py-2 rounded-md text-sm flex-1 transition-all flex items-center justify-center group"
                  onClick={() => openConfirm('start')}
                >
                  <i className="fas fa-play mr-2 group-hover:animate-pulse"></i> Start
                </button>
                <button 
                  className="bg-warning/10 text-warning/50 border border-warning/10 px-4 py-2 rounded-md text-sm flex-1 transition-all opacity-50 cursor-not-allowed flex items-center justify-center"
                  disabled
                >
                  <i className="fas fa-sync-alt mr-2"></i> Restart
                </button>
              </>
            )}
          </div>
          
          {/* Config button - giving it its own row for emphasis */}
          <BotConfigDialog 
            bot={bot}
            onBotUpdated={onUpdate}
            trigger={
              <button 
                className={`mt-3 w-full ${colorClass.bg.replace('/30', '/10')} hover:${colorClass.bg.replace('/30', '/20')} ${colorClass.text} border border-${colorClass.text.replace('text-', '')}/20 px-4 py-2 rounded-md text-sm transition-all flex items-center justify-center`}
              >
                <i className="fas fa-cog mr-2"></i> Configure Bot
              </button>
            }
          />
          
          {/* Add to Discord button - Only show for running bots */}
          {bot.isRunning && (
            <div className="mt-3">
              <AddToDiscord bot={bot} />
            </div>
          )}
        </div>
        
        {/* Animated corner accent */}
        <div className={`absolute top-0 right-0 w-8 h-8 overflow-hidden ${bot.isRunning ? '' : 'opacity-40'}`}>
          <div className={`absolute top-0 right-0 w-16 h-16 -mt-8 -mr-8 rotate-45 ${bot.isRunning ? colorClass.bg.replace('/30', '/40') : 'bg-gray-700'}`}></div>
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="bg-background-light border border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-800 bg-background hover:bg-gray-800">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={performAction}
              className={
                confirmAction?.type === 'start' ? 'bg-success hover:bg-success/80' :
                confirmAction?.type === 'stop' ? 'bg-danger hover:bg-danger/80' :
                'bg-warning hover:bg-warning/80'
              }
            >
              {confirmAction?.type === 'start' ? 'Start' : 
               confirmAction?.type === 'stop' ? 'Stop' : 'Restart'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent className="bg-background-light border border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {bot.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this bot? This action cannot be undone.
              {bot.isRunning && ' The bot will be stopped before deletion.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-800 bg-background hover:bg-gray-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteBot}
              className="bg-danger hover:bg-danger/80"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
