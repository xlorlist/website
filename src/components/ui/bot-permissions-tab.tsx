import React, { useState, useEffect } from 'react';
import { Bot, DiscordPermissionFlags } from '@shared/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { updateBot } from '@/lib/discord-bot';
import { DiscordLoader } from './discord-loader';

interface BotPermissionsTabProps {
  bot: Bot;
  onUpdate?: () => void;
}

export function BotPermissionsTab({ bot, onUpdate }: BotPermissionsTabProps) {
  const { toast } = useToast();
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionBits, setPermissionBits] = useState(bot.permissions || "0");
  const [activeTab, setActiveTab] = useState("general");

  // Parse permissions on initial load
  useEffect(() => {
    const selectedPerms: string[] = [];
    
    // Parse the permissions string into a BigInt
    try {
      const permInt = BigInt(bot.permissions || "0");
      
      // Check each permission flag
      Object.entries(DiscordPermissionFlags).forEach(([key, value]) => {
        // Skip preset permissions
        if (["BASIC_BOT", "MUSIC_BOT", "MODERATION_BOT", "GAMING_BOT"].includes(key)) {
          return;
        }
        
        // Convert permission value to BigInt and check if it's included in the bot's permissions
        if ((permInt & BigInt(value)) == BigInt(value)) {
          selectedPerms.push(key);
        }
      });
      
      setSelectedPermissions(selectedPerms);
    } catch (error) {
      console.error("Error parsing permissions:", error);
      // Default to basic permissions if parsing fails
      setSelectedPermissions(["SEND_MESSAGES", "READ_MESSAGE_HISTORY"]);
    }
  }, [bot.permissions]);
  
  // Calculate permission bits from selected permissions
  const calculatePermissionBits = (permissions: string[]) => {
    let permBigInt = BigInt(0);
    
    permissions.forEach(perm => {
      // Get the value of the permission
      const permValue = DiscordPermissionFlags[perm as keyof typeof DiscordPermissionFlags];
      if (permValue) {
        // Add the permission bit to the total
        permBigInt = permBigInt | BigInt(permValue);
      }
    });
    
    return permBigInt.toString();
  };
  
  // Handle permission toggle
  const handlePermissionToggle = (permission: string, checked: boolean) => {
    let newPermissions = [...selectedPermissions];
    
    if (checked) {
      // Add the permission if it doesn't exist
      if (!newPermissions.includes(permission)) {
        newPermissions.push(permission);
      }
    } else {
      // Remove the permission
      newPermissions = newPermissions.filter(p => p !== permission);
    }
    
    setSelectedPermissions(newPermissions);
    const newBits = calculatePermissionBits(newPermissions);
    setPermissionBits(newBits);
  };
  
  // Handle preset selection
  const handlePresetSelect = (preset: "BASIC_BOT" | "MUSIC_BOT" | "MODERATION_BOT" | "GAMING_BOT") => {
    setPermissionBits(DiscordPermissionFlags[preset]);
    
    // Based on preset, select appropriate permissions
    let presetPermissions: string[] = [];
    switch(preset) {
      case "BASIC_BOT":
        presetPermissions = ["SEND_MESSAGES", "READ_MESSAGE_HISTORY", "USE_SLASH_COMMANDS"];
        break;
      case "MUSIC_BOT":
        presetPermissions = [
          "CONNECT", "SPEAK", "SEND_MESSAGES", "READ_MESSAGE_HISTORY",
          "USE_SLASH_COMMANDS", "EMBED_LINKS", "ATTACH_FILES", "STREAM"
        ];
        break;
      case "MODERATION_BOT":
        presetPermissions = [
          "ADMINISTRATOR", "KICK_MEMBERS", "BAN_MEMBERS", "MANAGE_CHANNELS",
          "MANAGE_GUILD", "MANAGE_MESSAGES", "MANAGE_ROLES", "VIEW_AUDIT_LOG"
        ];
        break;
      case "GAMING_BOT":
        presetPermissions = [
          "SEND_MESSAGES", "READ_MESSAGE_HISTORY", "EMBED_LINKS", "ATTACH_FILES",
          "ADD_REACTIONS", "USE_EXTERNAL_EMOJIS", "USE_SLASH_COMMANDS"
        ];
        break;
    }
    
    setSelectedPermissions(presetPermissions);
  };
  
  // Save changes
  const saveChanges = async () => {
    setIsLoading(true);
    
    try {
      // Update invite config as well
      let inviteConfig = bot.inviteConfig ? JSON.parse(bot.inviteConfig) : {
        scopes: ["bot", "applications.commands"],
        permissions: [],
        description: "A Discord bot"
      };
      
      // Update permissions array in invite config
      inviteConfig.permissions = selectedPermissions;
      
      // Save changes
      await updateBot(bot.id, {
        permissions: permissionBits,
        inviteConfig: JSON.stringify(inviteConfig)
      });
      
      toast({
        title: "Permissions Updated",
        description: "Bot permissions have been successfully updated."
      });
      
      // Call onUpdate if provided
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating permissions:", error);
      toast({
        title: "Error",
        description: "Failed to update bot permissions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Group permissions by category
  const generalPermissions = [
    "ADMINISTRATOR", "VIEW_AUDIT_LOG", "VIEW_GUILD_INSIGHTS", "MANAGE_GUILD",
    "MANAGE_ROLES", "MANAGE_CHANNELS", "KICK_MEMBERS", "BAN_MEMBERS", 
    "CREATE_INSTANT_INVITE", "CHANGE_NICKNAME", "MANAGE_NICKNAMES",
    "MANAGE_EMOJIS", "MANAGE_WEBHOOKS", "MANAGE_EVENTS"
  ];
  
  const textPermissions = [
    "VIEW_CHANNEL", "SEND_MESSAGES", "SEND_TTS_MESSAGES", "MANAGE_MESSAGES",
    "EMBED_LINKS", "ATTACH_FILES", "READ_MESSAGE_HISTORY", "MENTION_EVERYONE",
    "USE_EXTERNAL_EMOJIS", "ADD_REACTIONS", "USE_SLASH_COMMANDS"
  ];
  
  const voicePermissions = [
    "CONNECT", "SPEAK", "STREAM", "MUTE_MEMBERS", 
    "DEAFEN_MEMBERS", "MOVE_MEMBERS", "USE_VAD", "PRIORITY_SPEAKER"
  ];
  
  return (
    <div className="space-y-6">
      <div className="bg-[#2f3136] p-4 rounded-md border border-[#202225]">
        <h3 className="text-lg font-semibold mb-2">Bot Permissions</h3>
        <p className="text-sm text-[#b9bbbe] mb-4">
          Select the permissions your bot needs. These permissions will be requested when users add your bot to their server.
        </p>
        
        {/* Permission presets */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            size="sm"
            variant="outline"
            className={`${permissionBits === DiscordPermissionFlags.BASIC_BOT ? 'bg-primary text-white' : 'bg-[#202225]'}`}
            onClick={() => handlePresetSelect("BASIC_BOT")}
          >
            Basic Bot
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={`${permissionBits === DiscordPermissionFlags.MUSIC_BOT ? 'bg-primary text-white' : 'bg-[#202225]'}`}
            onClick={() => handlePresetSelect("MUSIC_BOT")}
          >
            Music Bot
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={`${permissionBits === DiscordPermissionFlags.MODERATION_BOT ? 'bg-primary text-white' : 'bg-[#202225]'}`}
            onClick={() => handlePresetSelect("MODERATION_BOT")}
          >
            Moderation Bot
          </Button>
          <Button
            size="sm"
            variant="outline"
            className={`${permissionBits === DiscordPermissionFlags.GAMING_BOT ? 'bg-primary text-white' : 'bg-[#202225]'}`}
            onClick={() => handlePresetSelect("GAMING_BOT")}
          >
            Gaming Bot
          </Button>
        </div>
        
        <Separator className="my-4 bg-[#40444b]" />
        
        {/* Permission tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full bg-[#202225]">
            <TabsTrigger value="general" className="bg-transparent data-[state=active]:bg-[#36393f]">
              General
            </TabsTrigger>
            <TabsTrigger value="text" className="bg-transparent data-[state=active]:bg-[#36393f]">
              Text
            </TabsTrigger>
            <TabsTrigger value="voice" className="bg-transparent data-[state=active]:bg-[#36393f]">
              Voice
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {generalPermissions.map((permission) => (
                <div className="flex items-center gap-2" key={permission}>
                  <Checkbox
                    id={`perm-${permission}`}
                    checked={selectedPermissions.includes(permission)}
                    onCheckedChange={(checked) => 
                      handlePermissionToggle(permission, checked === true)
                    }
                  />
                  <label 
                    htmlFor={`perm-${permission}`} 
                    className="text-sm cursor-pointer"
                  >
                    {permission.replace(/_/g, ' ')}
                  </label>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="text" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {textPermissions.map((permission) => (
                <div className="flex items-center gap-2" key={permission}>
                  <Checkbox
                    id={`perm-${permission}`}
                    checked={selectedPermissions.includes(permission)}
                    onCheckedChange={(checked) => 
                      handlePermissionToggle(permission, checked === true)
                    }
                  />
                  <label 
                    htmlFor={`perm-${permission}`} 
                    className="text-sm cursor-pointer"
                  >
                    {permission.replace(/_/g, ' ')}
                  </label>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="voice" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {voicePermissions.map((permission) => (
                <div className="flex items-center gap-2" key={permission}>
                  <Checkbox
                    id={`perm-${permission}`}
                    checked={selectedPermissions.includes(permission)}
                    onCheckedChange={(checked) => 
                      handlePermissionToggle(permission, checked === true)
                    }
                  />
                  <label 
                    htmlFor={`perm-${permission}`} 
                    className="text-sm cursor-pointer"
                  >
                    {permission.replace(/_/g, ' ')}
                  </label>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end mt-4">
          <Button 
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={saveChanges}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <DiscordLoader variant="blurple" className="mr-2 h-4 w-4" />
                Saving...
              </>
            ) : (
              'Save Permissions'
            )}
          </Button>
        </div>
      </div>
      
      <div className="bg-[#2f3136] p-4 rounded-md border border-[#202225]">
        <div className="text-sm">
          <span className="font-semibold">Permission Integer:</span> {permissionBits}
        </div>
        <p className="text-xs text-[#b9bbbe] mt-1">
          This is the numeric representation of the selected permissions.
        </p>
      </div>
    </div>
  );
}