import React, { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DiscordButton } from '@/components/ui/discord-button';
import { Bot } from '@shared/schema';
import { DiscordLoader, DiscordThreeDotsLoader } from '@/components/ui/discord-loader';
import { useToast } from '@/hooks/use-toast';
import { DiscordAuthDialog } from './discord-auth-dialog';

interface AddToDiscordProps {
  bot: Bot;
}

export function AddToDiscord({ bot }: AddToDiscordProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Function to extract client ID from bot token
  const extractClientId = (token: string) => {
    // Discord bot tokens are usually in format: [client_id].[random].[secret]
    try {
      const parts = token.split('.');
      if (parts.length >= 1) {
        return parts[0];
      }
    } catch (error) {
      console.error('Error extracting client ID:', error);
    }
    return null;
  };

  // Generate Discord invite link
  const generateInviteLink = () => {
    try {
      setIsLoading(true);
      
      const clientId = extractClientId(bot.token);
      if (!clientId) {
        throw new Error('Could not extract client ID from token');
      }
      
      // Use bot's configured permissions if available, or fall back to default for the bot type
      let permissions = bot.permissions || '268435456'; // Default to basic permissions
      
      // If no custom permissions are set, use default based on bot type
      if (!bot.permissions) {
        switch (bot.botType) {
          case 'MUSIC':
            permissions = '36700160'; // Add voice permissions
            break;
          case 'MODERATION':
            permissions = '1099511627775'; // Admin permissions
            break;
          case 'GAMING':
            permissions = '297273408'; // Gaming bot permissions
            break;
          default:
            permissions = '268435456'; // Default permissions
        }
      }
      
      // Parse invite config if available
      let scopes = 'bot%20applications.commands'; // Default scopes
      
      if (bot.inviteConfig) {
        try {
          const inviteConfig = JSON.parse(bot.inviteConfig);
          if (inviteConfig.scopes && Array.isArray(inviteConfig.scopes) && inviteConfig.scopes.length > 0) {
            scopes = inviteConfig.scopes.join('%20');
          }
        } catch (e) {
          console.error('Error parsing invite config:', e);
        }
      }
      
      const inviteLink = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=${scopes}`;
      
      // Open the invite link in a new tab
      window.open(inviteLink, '_blank');
      
      toast({
        title: 'Invite Link Generated',
        description: 'Follow the Discord authorization process to add the bot to your server.',
      });
      
    } catch (error) {
      console.error('Error generating invite link:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate Discord invite link',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setShowDialog(false);
    }
  };

  return (
    <>
      <DiscordButton
        variant="blurple"
        size="sm"
        onClick={() => setShowDialog(true)}
        className="discord-hover-pop mt-2"
      >
        Add to Discord
      </DiscordButton>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#2f3136] border-[#202225] text-white sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Add Bot to Discord</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-[#5865F2]/20`}>
                <i className={`fas fa-${bot.iconType || 'robot'} text-[#5865F2]`}></i>
              </div>
              <div>
                <div className="font-semibold">{bot.name}</div>
                <div className="text-sm text-[#b9bbbe]">Bot Type: {bot.botType}</div>
              </div>
            </div>

            <div className="bg-black/20 rounded-md p-3 text-sm text-[#b9bbbe]">
              <p>
                This will generate an invite link that allows you to add this bot to any Discord server 
                where you have the <span className="text-white font-semibold">Manage Server</span> permission.
              </p>
            </div>

            {isLoading && (
              <div className="py-2 flex justify-center">
                <DiscordThreeDotsLoader variant="blurple" />
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <DiscordButton
              variant="gray"
              onClick={() => setShowDialog(false)}
              disabled={isLoading}
              className="sm:order-1"
            >
              Cancel
            </DiscordButton>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <DiscordButton
                variant="ghost"
                leftIcon={<i className="fab fa-discord mr-2"></i>}
                onClick={() => {
                  setShowDialog(false);
                  setShowAuthDialog(true);
                }}
                disabled={isLoading}
                className="w-full sm:w-auto order-2 sm:order-2"
              >
                Use Discord Login
              </DiscordButton>
              
              <DiscordButton
                variant="blurple"
                onClick={generateInviteLink}
                isLoading={isLoading}
                loadingText="Generating Link"
                className="w-full sm:w-auto order-1 sm:order-3"
              >
                Generate Invite Link
              </DiscordButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Discord Auth Dialog */}
      <DiscordAuthDialog
        isOpen={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        userId={bot.userId}
        botId={bot.id}
        onSuccess={() => {
          toast({
            title: "Success!",
            description: "Discord account linked. You can now add bots to your servers.",
          });
        }}
      />
    </>
  );
}