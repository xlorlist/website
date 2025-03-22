import { useState, useEffect } from 'react';
import { FaDiscord } from 'react-icons/fa';
import { DiscordButton } from './discord-button';
import { useToast } from '@/hooks/use-toast';

interface DiscordLoginButtonProps {
  className?: string;
  disabled?: boolean;
  onSuccess?: () => void;
  fullWidth?: boolean;
  variant?: 'default' | 'blurple' | 'green' | 'red' | 'gray' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function DiscordLoginButton({
  className,
  disabled = false,
  onSuccess,
  fullWidth = false,
  variant = 'blurple',
  size = 'default'
}: DiscordLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = () => {
    setIsLoading(true);
    
    // Redirect to the Discord OAuth endpoint
    window.location.href = '/api/auth/discord';
  };

  return (
    <DiscordButton
      className={className}
      onClick={handleLogin}
      disabled={disabled || isLoading}
      leftIcon={<FaDiscord />}
      isLoading={isLoading}
      loadingText="Connecting..."
      style={{ width: fullWidth ? '100%' : 'auto' }}
      variant={variant}
      size={size}
    >
      Login with Discord
    </DiscordButton>
  );
}

interface DiscordGuildSelectorProps {
  userId: number;
  botId: number;
  onClose: () => void;
}

export function DiscordGuildSelector({
  userId,
  botId,
  onClose
}: DiscordGuildSelectorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [guilds, setGuilds] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch the user's Discord guilds
  useEffect(() => {
    const fetchGuilds = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/auth/discord/guilds');
        
        if (!response.ok) {
          throw new Error('Failed to fetch Discord servers');
        }
        
        const guildsData = await response.json();
        setGuilds(guildsData);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
        toast({
          title: "Error",
          description: "Could not fetch your Discord servers. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchGuilds();
  }, []);

  // Handle guild selection
  const handleSelectGuild = async (guildId: string) => {
    try {
      setIsLoading(true);
      
      // Get the bot details
      const botResponse = await fetch(`/api/bots/${botId}`);
      if (!botResponse.ok) {
        throw new Error('Failed to fetch bot details');
      }
      const bot = await botResponse.json();
      
      // Use configured permissions if available
      let permissions = bot.permissions || "268435456"; // Default to basic permissions
      
      // Extract client ID from token if not directly available
      const extractClientId = (token: string) => {
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
      
      const clientId = extractClientId(bot.token);
      if (!clientId) {
        throw new Error('Invalid bot token format');
      }
      
      // Parse invite config if available for scopes
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
      
      // Create invite URL with guild_id parameter
      const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=${scopes}&guild_id=${guildId}`;
      
      // Open the invite URL in a new tab
      window.open(inviteUrl, '_blank');
      
      toast({
        title: "Success!",
        description: "Bot invite link opened. Follow the Discord prompts to add the bot to your server.",
      });
      
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      toast({
        title: "Error",
        description: "Could not generate bot invite link. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading your Discord servers...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <DiscordLoginButton 
          variant="blurple" 
          onSuccess={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-bold mb-4">Select a Server</h3>
      {guilds.length === 0 ? (
        <p className="text-center text-gray-500">No Discord servers found. You need to be an admin of at least one server.</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {guilds
            .filter(guild => (parseInt(guild.permissions) & 0x8) === 0x8) // Filter for admin permission
            .map(guild => (
              <div 
                key={guild.id}
                className="flex items-center p-2 rounded hover:bg-gray-100 cursor-pointer border"
                onClick={() => handleSelectGuild(guild.id)}
              >
                {guild.icon ? (
                  <img 
                    src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`} 
                    alt={guild.name} 
                    className="w-8 h-8 rounded-full mr-2"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 mr-2 flex items-center justify-center">
                    {guild.name.substring(0, 1)}
                  </div>
                )}
                <span>{guild.name}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}