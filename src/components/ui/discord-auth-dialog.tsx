import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { DiscordLoginButton, DiscordGuildSelector } from './discord-login-button';
import { apiRequest } from '@/lib/queryClient';

interface DiscordAuthDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userId: number;
  botId: number;
  onSuccess?: () => void;
}

type AuthStep = 'login' | 'select-server';

export function DiscordAuthDialog({
  isOpen,
  onOpenChange,
  userId,
  botId,
  onSuccess
}: DiscordAuthDialogProps) {
  const [step, setStep] = useState<AuthStep>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  // Check if user is already authenticated with Discord
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/discord/user');
        if (response.ok) {
          setIsAuthenticated(true);
          setStep('select-server');
        }
      } catch (error) {
        // Not authenticated, keep login step
      }
    };
    
    if (isOpen) {
      checkAuth();
    }
  }, [isOpen]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setStep('select-server');
    
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === 'login' ? 'Connect with Discord' : 'Select a Discord Server'}
          </DialogTitle>
          <DialogDescription>
            {step === 'login' 
              ? 'Login with your Discord account to add bots to your servers.' 
              : 'Choose a server where you want to add this bot.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4 border rounded-lg bg-gray-50">
          {step === 'login' ? (
            <div className="flex flex-col items-center space-y-4">
              <p className="text-sm text-gray-600 text-center mb-4">
                You'll be redirected to Discord to authorize this application.
                We only request the minimum permissions needed to add bots to your servers.
              </p>
              
              <DiscordLoginButton 
                fullWidth 
                variant="blurple"
                onSuccess={handleLoginSuccess}
              />
            </div>
          ) : (
            <DiscordGuildSelector
              userId={userId}
              botId={botId}
              onClose={handleClose}
            />
          )}
        </div>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}