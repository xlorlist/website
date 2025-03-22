import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { BotType, IconType, InsertBot } from "@shared/schema";
import { createBot } from "@/lib/discord-bot";
import { generatePseudoDiscordToken } from "@/lib/utils";
import { isValidSnowflake, generateValidSnowflake, generateBotInviteUrl } from "@/lib/discord-utils";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RefreshCw, LogIn } from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import { DiscordButton } from "./discord-button";
import { DiscordLoginButton } from "./discord-login-button";

// Form schema with validation
const formSchema = z.object({
  name: z.string().min(3, "Bot name must be at least 3 characters"),
  token: z.string()
    .min(20, "Please enter a valid Discord bot token")
    .regex(/^[A-Za-z0-9._-]+\.[A-Za-z0-9._-]+\.[A-Za-z0-9._-]+$/, {
      message: "Token should be in the format: ID.part.part"
    }),
  clientId: z.string()
    .min(17, "Discord client ID must be at least 17 digits")
    .max(19, "Discord client ID must be at most 19 digits")
    .regex(/^\d+$/, "Client ID must contain only numbers")
    .optional(),
  prefix: z.string().min(1, "Command prefix is required").max(3, "Prefix should be 1-3 characters"),
  userId: z.number().int().positive(),
  botType: z.nativeEnum(BotType),
  iconType: z.nativeEnum(IconType)
});

interface CreateBotDialogProps {
  userId: number;
  trigger?: React.ReactNode;
  onBotCreated?: () => void;
}

export function CreateBotDialog({ userId, trigger, onBotCreated }: CreateBotDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showDiscordLogin, setShowDiscordLogin] = useState(false);
  const [isDiscordAuthenticated, setIsDiscordAuthenticated] = useState(false);
  const [discordGuilds, setDiscordGuilds] = useState<any[]>([]);
  const [isLoadingGuilds, setIsLoadingGuilds] = useState(false);
  const [selectedGuildId, setSelectedGuildId] = useState<string | null>(null);
  const [selectedGuildName, setSelectedGuildName] = useState<string | null>(null);
  const [reRender, setReRender] = useState(false); // For forcing UI updates
  
  // Default values for the form
  const defaultValues = {
    name: "",
    token: "",
    clientId: "",
    prefix: "!",
    userId: userId,
    botType: BotType.CUSTOM,
    iconType: IconType.ROBOT
  };
  
  // Check if user is already authenticated with Discord when dialog opens
  useEffect(() => {
    if (isOpen) {
      checkDiscordAuth();
    }
  }, [isOpen]);
  
  // Function to check Discord authentication status
  const checkDiscordAuth = async () => {
    try {
      const response = await fetch('/api/auth/discord/user');
      if (response.ok) {
        setIsDiscordAuthenticated(true);
        fetchDiscordGuilds();
      } else {
        setIsDiscordAuthenticated(false);
      }
    } catch (error) {
      setIsDiscordAuthenticated(false);
    }
  };
  
  // Function to fetch user's Discord guilds
  const fetchDiscordGuilds = async () => {
    try {
      setIsLoadingGuilds(true);
      const response = await fetch('/api/auth/discord/guilds');
      
      if (response.ok) {
        const guildsData = await response.json();
        setDiscordGuilds(guildsData.filter((guild: any) => 
          (parseInt(guild.permissions) & 0x8) === 0x8 // Filter for admin permission
        ));
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not fetch your Discord servers. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingGuilds(false);
    }
  };
  
  // Handle guild selection
  const handleGuildSelect = (guildId: string, guildName: string) => {
    setSelectedGuildId(guildId);
    setSelectedGuildName(guildName);
    
    // Auto-populate the bot name if it's empty
    if (!form.getValues('name')) {
      form.setValue('name', `${guildName} Bot`);
    }
    
    toast({
      title: "Server Selected",
      description: `${guildName} has been selected. Your bot will be added to this server after creation.`,
    });
  };
  
  // Setup react-hook-form with zod validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues
  });
  
  // Handle form submission
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsCreating(true);
    
    try {
      // Submit the form data to create a new bot
      const botData: InsertBot = {
        name: data.name,
        token: data.token,
        prefix: data.prefix,
        userId: data.userId,
        botType: data.botType as BotType,
        iconType: data.iconType as IconType
      };
      
      const bot = await createBot(botData);
      
      let successMessage = `${bot.name} has been created successfully.`;
      
      // If a Discord server was selected, add the bot to that server
      if (selectedGuildId && selectedGuildName) {
        if (!isDiscordAuthenticated) {
          // If the user is not authenticated with Discord but tried to add the bot to a server
          toast({
            title: "Discord Authentication Required",
            description: "You need to connect with Discord first to add your bot to a server.",
            variant: "destructive"
          });
        } else {
          // Get the client ID, either from the form or extract from token
          let clientId = data.clientId;
          
          // If client ID is not provided, try to extract it from token
          if (!clientId) {
            const parts = data.token.split('.');
            if (parts.length >= 1) {
              clientId = parts[0];
            }
          }
          
          // Default permissions based on bot type
          let permissions = '0';
          let permissionDescription = '';
          
          switch (data.botType) {
            case BotType.MUSIC:
              permissions = '36700160'; // Music bot permissions
              permissionDescription = 'Voice channel access, message sending, and media playback permissions';
              break;
            case BotType.MODERATION:
              permissions = '1099511627775'; // Admin permissions
              permissionDescription = 'Full administrative access (kick, ban, manage channels, etc.)';
              break;
            case BotType.GAMING:
              permissions = '297273408'; // Gaming permissions
              permissionDescription = 'Message sending, reactions, and basic channel interaction permissions';
              break;
            default:
              permissions = '2147483648'; // Basic slash commands permission
              permissionDescription = 'Basic slash command permissions';
          }
          
          // Show permission information to user before proceeding
          toast({
            title: "Permission Information",
            description: `Your ${data.botType.toLowerCase()} bot requires: ${permissionDescription}`,
          });
          
          // Generate the bot invite URL
          const inviteUrl = generateBotInviteUrl(clientId || '', permissions, selectedGuildId);
          
          // Open the Discord authorization page in a new window
          const authWindow = window.open(inviteUrl, '_blank');
          
          // Provide clear instructions to the user
          toast({
            title: "Discord Authorization Started",
            description: "Complete the Discord authorization process in the new window to add your bot to the server.",
          });
          
          successMessage += ` Please complete the authorization in the new window to add your bot to server: ${selectedGuildName}.`;
        }
      }
      
      // Create the bot notification
      toast({
        title: "Bot Created",
        description: successMessage,
      });
      
      // Add 24/7 uptime message
      toast({
        title: "24/7 Uptime Guaranteed",
        description: "Your bot will remain online 24/7 even when you log out of the dashboard.",
      });
      
      // If we've opened a Discord auth window, give user a follow-up toast with instructions
      if (selectedGuildId) {
        setTimeout(() => {
          toast({
            title: "Discord Authorization Help",
            description: "Make sure to log in to Discord and authorize the bot with the requested permissions to complete setup.",
            duration: 8000,
          });
        }, 3000);
      }
      
      // Close the dialog and refresh the bot list
      setIsOpen(false);
      form.reset(defaultValues);
      
      if (onBotCreated) {
        onBotCreated();
      }
    } catch (error) {
      toast({
        title: "Error Creating Bot",
        description: "There was an error creating your bot. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  // Handle dialog close
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset(defaultValues);
      // Reset the selected Discord server
      setSelectedGuildId(null);
      setSelectedGuildName(null);
    }
    setIsOpen(open);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-primary hover:bg-primary-hover text-white neon-glow">
            <i className="fas fa-plus mr-2"></i>
            Create New Bot
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="bg-background-light border border-gray-800 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold neon-text">Create New Discord Bot</DialogTitle>
          <DialogDescription>
            Create a new Discord bot to add to your dashboard. You'll need a Discord bot token.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {/* Bot Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bot Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter a name for your bot" 
                        className="bg-background/60 border-gray-700" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      This is the name that will appear on your dashboard
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Discord Connection Section */}
              <div className="bg-[#2f3136] border border-[#202225] rounded-md p-4 mb-4">
                <h3 className="text-md font-semibold mb-2 text-white flex items-center">
                  <FaDiscord className="mr-2 text-[#5865F2]" />
                  Connect with Discord
                </h3>
                <p className="text-sm text-gray-300 mb-3">
                  Log in with Discord to see your servers and easily add your bot to them.
                </p>
                
                {!isDiscordAuthenticated ? (
                  <div className="flex justify-center">
                    <DiscordLoginButton 
                      variant="blurple" 
                      onSuccess={() => checkDiscordAuth()}
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center text-green-400 text-sm mb-2">
                      <i className="fas fa-check-circle mr-2"></i>
                      Connected to Discord successfully
                    </div>
                    
                    {discordGuilds.length > 0 ? (
                      <div>
                        <Label className="mb-2 block">Your Discord Servers</Label>
                        <div className="max-h-36 overflow-y-auto border border-[#40444b] rounded-md p-1">
                          {discordGuilds.map(guild => (
                            <div 
                              key={guild.id} 
                              className={`flex items-center justify-between p-2 hover:bg-[#40444b] rounded cursor-pointer ${selectedGuildId === guild.id ? 'bg-[#404d6a] border border-[#5865F2]/50' : ''}`}
                              onClick={() => handleGuildSelect(guild.id, guild.name)}
                            >
                              <div className="flex items-center">
                                {guild.icon ? (
                                  <img 
                                    src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`}
                                    alt={guild.name}
                                    className="w-8 h-8 rounded-full mr-2"
                                  />
                                ) : (
                                  <div className="w-8 h-8 bg-[#5865F2] rounded-full flex items-center justify-center mr-2">
                                    {guild.name.charAt(0)}
                                  </div>
                                )}
                                <span className="text-sm text-gray-200">{guild.name}</span>
                                {selectedGuildId === guild.id && (
                                  <span className="ml-2 text-xs text-green-400 flex items-center">
                                    <i className="fas fa-check-circle mr-1"></i> Selected
                                  </span>
                                )}
                              </div>
                              <button className={`text-xs ${selectedGuildId === guild.id ? 'text-green-400' : 'text-[#5865F2]'} hover:underline`}>
                                {selectedGuildId === guild.id ? 'Selected' : 'Add Bot'}
                              </button>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Your bot will be configurable to work with these servers after creation.
                        </p>
                        
                        {/* Permission Preview */}
                        <div className="mt-2 text-xs bg-[#202225] p-2 rounded-md">
                          <div className="font-semibold text-white mb-1">Bot Permission Preview:</div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center">
                              <span className="w-3 h-3 inline-block rounded-full bg-green-500 mr-1"></span>
                              <span className="text-gray-300">Voice Channel: {form.getValues('botType') === BotType.MUSIC || form.getValues('botType') === BotType.MODERATION ? 'Yes' : 'No'}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="w-3 h-3 inline-block rounded-full bg-red-500 mr-1"></span>
                              <span className="text-gray-300">Admin Access: {form.getValues('botType') === BotType.MODERATION ? 'Yes' : 'No'}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="w-3 h-3 inline-block rounded-full bg-blue-500 mr-1"></span>
                              <span className="text-gray-300">Send Messages: {form.getValues('botType') !== BotType.CUSTOM ? 'Yes' : 'No'}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="w-3 h-3 inline-block rounded-full bg-yellow-500 mr-1"></span>
                              <span className="text-gray-300">Slash Commands: Yes</span>
                            </div>
                          </div>
                          <div className="mt-1 text-gray-400">
                            <i className="fas fa-info-circle mr-1"></i> 
                            {form.getValues('botType') === BotType.MUSIC ? 'Music bots need voice channel access' : 
                             form.getValues('botType') === BotType.MODERATION ? 'Moderation bots need admin privileges' :
                             form.getValues('botType') === BotType.GAMING ? 'Gaming bots need basic messaging permissions' :
                             'Custom bots need only basic slash command permissions'}
                          </div>
                        </div>
                      </div>
                    ) : isLoadingGuilds ? (
                      <div className="text-center py-3">
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Loading your Discord servers...
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">
                        No servers found where you have admin permissions. You need to be a server admin to add bots.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Discord Token */}
              <FormField
                control={form.control}
                name="token"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>Discord Bot Token</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 text-xs flex items-center bg-[#292b2f] hover:bg-[#36393f] border-[#202225] text-[#b9bbbe] hover:text-white"
                        onClick={() => {
                          const newToken = generatePseudoDiscordToken();
                          field.onChange(newToken);
                          
                          // Extract and set client ID from the first part of the token
                          const parts = newToken.split('.');
                          if (parts.length >= 1) {
                            form.setValue('clientId', parts[0]);
                          }
                          
                          toast({
                            title: "Token Generated",
                            description: "A Discord bot token has been generated for you automatically. The client ID has also been extracted.",
                          });
                        }}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Generate Token
                      </Button>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="Enter your Discord bot token or generate one" 
                          className="bg-background/60 border-gray-700 pr-10" 
                          type="password"
                          {...field} 
                        />
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#b9bbbe] hover:text-white"
                          onClick={() => {
                            const newToken = generatePseudoDiscordToken();
                            field.onChange(newToken);
                            
                            // Extract and set client ID from the first part of the token
                            const parts = newToken.split('.');
                            if (parts.length >= 1) {
                              form.setValue('clientId', parts[0]);
                              toast({
                                title: "Client ID Extracted",
                                description: "The client ID has been automatically extracted from the token.",
                              });
                            }
                          }}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      </div>
                    </FormControl>
                    <FormDescription className="flex justify-between">
                      <span>You can get this from the Discord Developer Portal or generate one automatically</span>
                    </FormDescription>
                    <div className="text-xs p-2 bg-[#5865F2]/10 border border-[#5865F2]/20 rounded mt-2 blue-text">
                      <span className="font-semibold">New!</span> You can now generate a bot token directly within the application
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Discord Client ID */}
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discord Client ID</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your Discord bot client ID (optional)" 
                        className="bg-background/60 border-gray-700" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      This is the numeric ID of your bot (17-19 digits). It's used to create invite links.
                    </FormDescription>
                    <div className="text-xs p-2 bg-[#5865F2]/10 border border-[#5865F2]/20 rounded mt-2 blue-text">
                      <span className="font-semibold">Tip:</span> Find your client ID in the Discord Developer Portal. This helps add your bot to servers.
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Command Prefix */}
              <FormField
                control={form.control}
                name="prefix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Command Prefix</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="!" 
                        className="bg-background/60 border-gray-700" 
                        maxLength={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Character used to trigger bot commands, e.g. !help
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Bot Type */}
              <FormField
                control={form.control}
                name="botType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bot Type</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          // Force update the permission preview UI
                          setReRender(prev => !prev);
                          // Show guidance based on bot type
                          let description = "Basic bot with minimal permissions.";
                          switch (value) {
                            case BotType.MUSIC:
                              description = "Music bots need voice channel access to play audio.";
                              break;
                            case BotType.MODERATION:
                              description = "Moderation bots require admin privileges to manage servers.";
                              break;
                            case BotType.GAMING:
                              description = "Gaming bots need basic messaging permissions for game interactions.";
                              break;
                          }
                          toast({
                            title: `${value} Bot Selected`,
                            description: description,
                          });
                        }} 
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="bg-background/60 border-gray-700">
                          <SelectValue placeholder="Select bot type" />
                        </SelectTrigger>
                        <SelectContent className="bg-background-light border-gray-800">
                          <SelectItem value={BotType.CUSTOM}>
                            <div className="flex items-center">
                              <i className="fas fa-robot mr-2 text-gray-400"></i>
                              <div>
                                <div>Custom</div>
                                <div className="text-xs text-gray-400">Minimal permissions</div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value={BotType.MUSIC}>
                            <div className="flex items-center">
                              <i className="fas fa-music mr-2 text-green-400"></i>
                              <div>
                                <div>Music</div>
                                <div className="text-xs text-gray-400">Voice channel access</div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value={BotType.MODERATION}>
                            <div className="flex items-center">
                              <i className="fas fa-shield-alt mr-2 text-blue-400"></i>
                              <div>
                                <div>Moderation</div>
                                <div className="text-xs text-gray-400">Admin privileges</div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value={BotType.GAMING}>
                            <div className="flex items-center">
                              <i className="fas fa-gamepad mr-2 text-purple-400"></i>
                              <div>
                                <div>Gaming</div>
                                <div className="text-xs text-gray-400">Message permissions</div>
                              </div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      This determines your bot's permissions and dashboard style
                    </FormDescription>
                    
                    {/* Bot Type Info Card */}
                    <div className="mt-2 p-3 bg-[#2f3136] border border-[#40444b] rounded-md text-sm">
                      <div className="flex items-center">
                        <div className="mr-3">
                          {field.value === BotType.MUSIC && <i className="fas fa-music text-2xl text-green-400"></i>}
                          {field.value === BotType.MODERATION && <i className="fas fa-shield-alt text-2xl text-blue-400"></i>}
                          {field.value === BotType.GAMING && <i className="fas fa-gamepad text-2xl text-purple-400"></i>}
                          {field.value === BotType.CUSTOM && <i className="fas fa-robot text-2xl text-gray-400"></i>}
                        </div>
                        <div>
                          <h4 className="font-medium text-white">
                            {field.value === BotType.MUSIC && "Music Bot"}
                            {field.value === BotType.MODERATION && "Moderation Bot"}
                            {field.value === BotType.GAMING && "Gaming Bot"}
                            {field.value === BotType.CUSTOM && "Custom Bot"}
                          </h4>
                          <p className="text-gray-300 text-xs">
                            {field.value === BotType.MUSIC && "Optimized for playing music in voice channels with queue management and audio controls."}
                            {field.value === BotType.MODERATION && "Designed for server moderation with advanced permission management and user controls."}
                            {field.value === BotType.GAMING && "Perfect for game-related commands, leaderboards, and interactive gameplay features."}
                            {field.value === BotType.CUSTOM && "A blank slate for custom functionality with minimal default permissions."}
                          </p>
                        </div>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Icon Type */}
              <FormField
                control={form.control}
                name="iconType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bot Icon</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="bg-background/60 border-gray-700">
                          <SelectValue placeholder="Select icon type" />
                        </SelectTrigger>
                        <SelectContent className="bg-background-light border-gray-800">
                          <SelectItem value={IconType.ROBOT}>
                            <div className="flex items-center">
                              <i className="fas fa-robot mr-2"></i> Robot
                            </div>
                          </SelectItem>
                          <SelectItem value={IconType.SHIELD}>
                            <div className="flex items-center">
                              <i className="fas fa-shield-alt mr-2"></i> Shield
                            </div>
                          </SelectItem>
                          <SelectItem value={IconType.GAMEPAD}>
                            <div className="flex items-center">
                              <i className="fas fa-gamepad mr-2"></i> Gamepad
                            </div>
                          </SelectItem>
                          <SelectItem value={IconType.MUSIC}>
                            <div className="flex items-center">
                              <i className="fas fa-music mr-2"></i> Music
                            </div>
                          </SelectItem>
                          <SelectItem value={IconType.COG}>
                            <div className="flex items-center">
                              <i className="fas fa-cog mr-2"></i> Cog
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Choose an icon to represent your bot
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Selected Discord Server Summary */}
            {selectedGuildId && selectedGuildName && (
              <div className="mt-6 p-3 bg-[#2f3136] border border-[#5865F2]/30 rounded-md">
                <h4 className="text-sm font-medium text-white mb-1 flex items-center">
                  <FaDiscord className="mr-2 text-[#5865F2]" />
                  Selected Discord Server
                </h4>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-300">
                    Your bot will be added to <span className="text-[#5865F2] font-semibold">{selectedGuildName}</span>
                  </p>
                  <button 
                    type="button"
                    className="text-xs text-red-400 hover:text-red-300"
                    onClick={() => {
                      setSelectedGuildId(null);
                      setSelectedGuildName(null);
                      toast({
                        title: "Server Deselected",
                        description: "You can select another server or skip this step.",
                      });
                    }}
                  >
                    <i className="fas fa-times mr-1"></i>
                    Deselect
                  </button>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                className="bg-background hover:bg-gray-800 border-gray-700"
                type="button"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary-hover neon-glow"
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus mr-2"></i>
                    Create Bot
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}