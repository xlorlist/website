import React, { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNotificationSettings } from '@/hooks/use-notification-settings';

export function NotificationSoundPlayer() {
  const { settings, playSound } = useNotificationSettings();
  const { toast } = useToast();

  // Subscribe to toast events 
  useEffect(() => {
    // Track original toast implementation
    const originalToast = toast;
    
    // Override the toast function to include sound
    (window as any).toast = function(props: any) {
      // Play notification sound
      if (settings.enabled && settings.sound !== 'none') {
        playSound();
      }
      
      // Call the original toast function
      return originalToast(props);
    };
    
    // Restore original toast on cleanup
    return () => {
      (window as any).toast = originalToast;
    };
  }, [toast, settings, playSound]);

  // This component doesn't render anything visible
  return null;
}