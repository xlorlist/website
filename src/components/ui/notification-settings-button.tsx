import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { NotificationSettingsDialog } from '@/components/ui/notification-settings-dialog';
import { useNotificationSettings } from '@/hooks/use-notification-settings';

export function NotificationSettingsButton() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { settings } = useNotificationSettings();

  // Get icon based on settings
  const getIcon = () => {
    if (!settings.enabled) {
      return 'fa-bell-slash';
    }
    if (settings.sound === 'none') {
      return 'fa-bell';
    }
    return 'fa-bell';
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDialogOpen(true)}
              className="relative"
            >
              <i className={`fas ${getIcon()} text-gray-400 hover:text-white transition-colors`}></i>
              {settings.enabled && (
                <span className={`absolute top-0 right-0 w-2 h-2 rounded-full ${settings.sound !== 'none' ? 'bg-cyan-500' : 'bg-gray-500'}`}></span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Notification Settings</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <NotificationSettingsDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
      />
    </>
  );
}