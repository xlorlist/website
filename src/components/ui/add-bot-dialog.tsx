import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DiscordButton } from "@/components/ui/discord-button";
import { DiscordCard } from "@/components/ui/discord-card";
import { DiscordTooltip } from "@/components/ui/discord-tooltip";
import { BotType, IconType, InsertBot } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { createBot } from "@/lib/discord-bot";
import { generatePseudoDiscordToken } from "@/lib/utils";
import { Bot, Shield, Music, Gamepad, Cog, RefreshCw } from "lucide-react";

interface AddBotDialogProps {
  userId: number;
  isOpen: boolean;
  onClose: () => void;
  onBotCreated?: () => void;
}

export function AddBotDialog({
  userId,
  isOpen,
  onClose,
  onBotCreated
}: AddBotDialogProps) {
  const [botType, setBotType] = useState<string>(BotType.CUSTOM);
  const [iconType, setIconType] = useState<string>(IconType.ROBOT);
  const [name, setName] = useState("");
  const [token, setToken] = useState("");
  const [prefix, setPrefix] = useState("!");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tab, setTab] = useState("simple");
  const { toast } = useToast();

  const resetForm = () => {
    setBotType(BotType.CUSTOM);
    setIconType(IconType.ROBOT);
    setName("");
    setToken("");
    setPrefix("!");
    setIsSubmitting(false);
    setTab("simple");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !token) {
      toast({
        title: "Missing Information",
        description: "Please provide both a name and Discord bot token",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const botData: InsertBot = {
        name,
        token,
        prefix,
        userId,
        botType,
        iconType,
      };
      
      await createBot(botData);
      
      toast({
        title: "Bot Created Successfully",
        description: "Your Discord bot has been added to the dashboard",
        variant: "default",
      });
      
      if (onBotCreated) {
        onBotCreated();
      }
      
      handleClose();
    } catch (error) {
      console.error("Error creating bot:", error);
      toast({
        title: "Error Creating Bot",
        description: error instanceof Error ? error.message : "An error occurred while creating the bot",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInviteLink = (clientId: string) => {
    // Standard permissions for a bot (manage messages, read history, send messages, etc.)
    const permissions = "268435456";  // Permissions can be calculated at https://discordapi.com/permissions.html
    return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=${permissions}&scope=bot%20applications.commands`;
  };

  const extractClientId = (token: string) => {
    // Discord bot tokens are usually in format: [client_id].[random].[secret]
    const parts = token.split('.');
    if (parts.length >= 1) {
      return parts[0];
    }
    return null;
  };

  const iconComponents: Record<string, React.ReactNode> = {
    [IconType.ROBOT]: <Bot className="h-5 w-5" />,
    [IconType.SHIELD]: <Shield className="h-5 w-5" />,
    [IconType.MUSIC]: <Music className="h-5 w-5" />,
    [IconType.GAMEPAD]: <Gamepad className="h-5 w-5" />,
    [IconType.COG]: <Cog className="h-5 w-5" />,
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-[#2f3136] border-[#202225] text-white sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add Discord Bot</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="simple" value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="simple">Simple Setup</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
          </TabsList>
          
          <form onSubmit={handleSubmit}>
            <TabsContent value="simple" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Bot Name</Label>
                <Input 
                  id="name"
                  placeholder="My Awesome Bot"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-[#202225] border-[#40444b]"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="token">Discord Bot Token</Label>
                  <div className="flex items-center space-x-3">
                    <DiscordTooltip 
                      content={
                        <div className="max-w-xs">
                          <p>Generate a token automatically or get one from the Discord Developer Portal</p>
                        </div>
                      }
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const newToken = generatePseudoDiscordToken();
                          setToken(newToken);
                          toast({
                            title: "Token Generated",
                            description: "A bot token has been generated for you",
                            variant: "default",
                          });
                        }}
                        className="text-xs flex items-center bg-[#292b2f] hover:bg-[#36393f] text-[#b9bbbe] hover:text-white rounded px-2 py-1 transition-colors"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Generate Token
                      </button>
                    </DiscordTooltip>
                    <DiscordTooltip 
                      content={
                        <div className="max-w-xs">
                          <p>You can find your bot token in the Discord Developer Portal:</p>
                          <ol className="list-decimal ml-4 mt-1 space-y-1">
                            <li>Go to the <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Discord Developer Portal</a></li>
                            <li>Create or select your application</li>
                            <li>Go to the "Bot" tab</li>
                            <li>Click "Reset Token" or copy your existing token</li>
                          </ol>
                        </div>
                      }
                    >
                      <span className="text-xs text-[#b9bbbe] cursor-help underline">Where to find this?</span>
                    </DiscordTooltip>
                  </div>
                </div>
                <div className="relative">
                  <Input 
                    id="token"
                    type="password"
                    placeholder="Enter your Discord bot token or generate one"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    required
                    className="bg-[#202225] border-[#40444b] pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#b9bbbe] hover:text-white"
                    onClick={() => {
                      const newToken = generatePseudoDiscordToken();
                      setToken(newToken);
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-xs text-[#b9bbbe] italic">
                  <span className="text-[#5865F2]">New!</span> You can now generate a bot token directly within the application, or use your existing token from Discord.
                </div>
              </div>
              
              {token && extractClientId(token) && (
                <div className="mt-4 discord-pop-in">
                  <DiscordCard 
                    title="Bot Preview"
                    hover="glow"
                    withShine
                  >
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 rounded-full bg-[#5865F2]/20 flex items-center justify-center mr-3">
                        {iconComponents[iconType]}
                      </div>
                      <div>
                        <div className="font-medium">{name || "My Discord Bot"}</div>
                        <div className="text-xs text-[#b9bbbe]">Prefix: {prefix} • Bot Type: {botType}</div>
                      </div>
                    </div>
                    
                    <DiscordButton
                      variant="blurple"
                      className="w-full"
                      type="button"
                      onClick={() => {
                        const clientId = extractClientId(token);
                        if (clientId) {
                          window.open(getInviteLink(clientId), '_blank');
                        }
                      }}
                    >
                      Invite to Discord Server
                    </DiscordButton>
                  </DiscordCard>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prefix">Command Prefix</Label>
                  <Input 
                    id="prefix"
                    placeholder="!"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    className="bg-[#202225] border-[#40444b]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="botType">Bot Type</Label>
                  <Select value={botType} onValueChange={setBotType}>
                    <SelectTrigger className="bg-[#202225] border-[#40444b]" id="botType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2f3136] border-[#202225] text-white">
                      <SelectItem value={BotType.CUSTOM}>Custom</SelectItem>
                      <SelectItem value={BotType.MODERATION}>Moderation</SelectItem>
                      <SelectItem value={BotType.MUSIC}>Music</SelectItem>
                      <SelectItem value={BotType.GAMING}>Gaming</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Bot Icon</Label>
                <div className="grid grid-cols-5 gap-2">
                  {Object.values(IconType).map((icon) => (
                    <div
                      key={icon}
                      className={`h-12 flex items-center justify-center rounded-md cursor-pointer transition-all ${
                        iconType === icon 
                          ? "bg-[#5865F2] text-white" 
                          : "bg-[#202225] hover:bg-[#40444b] text-[#b9bbbe]"
                      }`}
                      onClick={() => setIconType(icon)}
                    >
                      {iconComponents[icon]}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Hosting Settings</Label>
                <div className="bg-[#202225] rounded-md p-3 border border-[#40444b]">
                  <div className="flex items-center mb-2">
                    <div className="w-4 h-4 rounded-full bg-[#3ba55d] mr-2"></div>
                    <span>24/7 Hosting Enabled</span>
                  </div>
                  <div className="text-xs text-[#b9bbbe]">
                    Your bot will run continuously and automatically restart if it goes offline.
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <DialogFooter className="mt-6 gap-2">
              <DiscordButton
                type="button"
                variant="gray"
                onClick={handleClose}
              >
                Cancel
              </DiscordButton>
              <DiscordButton
                type="submit"
                variant="blurple"
                isLoading={isSubmitting}
                loadingText="Creating Bot..."
              >
                Create Bot
              </DiscordButton>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}