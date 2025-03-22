import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Bot, BotType, IconType } from "@shared/schema";
import { updateBot } from "@/lib/discord-bot";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { BotPermissionsTab } from "@/components/ui/bot-permissions-tab";

// Form schema with validation
const formSchema = z.object({
  name: z.string().min(3, "Bot name must be at least 3 characters"),
  token: z.string().min(50, "Please enter a valid Discord bot token"),
  prefix: z.string().min(1, "Command prefix is required").max(3, "Prefix should be 1-3 characters"),
  botType: z.nativeEnum(BotType),
  iconType: z.nativeEnum(IconType)
});

interface BotConfigDialogProps {
  bot: Bot;
  trigger?: React.ReactNode;
  onBotUpdated?: () => void;
}

export function BotConfigDialog({ bot, trigger, onBotUpdated }: BotConfigDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Setup react-hook-form with zod validation
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: bot.name,
      token: bot.token,
      prefix: bot.prefix,
      botType: bot.botType as BotType,
      iconType: bot.iconType as IconType
    }
  });
  
  // Update form if bot changes
  useEffect(() => {
    form.reset({
      name: bot.name,
      token: bot.token,
      prefix: bot.prefix,
      botType: bot.botType as BotType,
      iconType: bot.iconType as IconType
    });
  }, [bot, form]);
  
  // Handle form submission
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsUpdating(true);
    
    try {
      // Submit the form data to update the bot
      const updatedBot = await updateBot(bot.id, {
        name: data.name,
        token: data.token,
        prefix: data.prefix,
        botType: data.botType,
        iconType: data.iconType
      });
      
      toast({
        title: "Bot Updated",
        description: `${updatedBot.name} has been updated successfully.`,
      });
      
      // Close the dialog and refresh the bot list
      setIsOpen(false);
      
      if (onBotUpdated) {
        onBotUpdated();
      }
    } catch (error) {
      toast({
        title: "Error Updating Bot",
        description: "There was an error updating your bot. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Handle dialog close
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset({
        name: bot.name,
        token: bot.token,
        prefix: bot.prefix,
        botType: bot.botType as BotType,
        iconType: bot.iconType as IconType
      });
    }
    setIsOpen(open);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all">
            <i className="fas fa-cog mr-2"></i>
            Configure Bot
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="bg-background-light border border-gray-800 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold neon-text">Configure {bot.name}</DialogTitle>
          <DialogDescription>
            Update your Discord bot's settings and configuration.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid grid-cols-2 w-full bg-[#202225]">
            <TabsTrigger value="general" className="bg-transparent data-[state=active]:bg-[#36393f]">
              General Settings
            </TabsTrigger>
            <TabsTrigger value="permissions" className="bg-transparent data-[state=active]:bg-[#36393f]">
              Permissions
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="mt-4">
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
                  
                  {/* Discord Token */}
                  <FormField
                    control={form.control}
                    name="token"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discord Bot Token</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter your Discord bot token" 
                            className="bg-background/60 border-gray-700" 
                            type="password"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          You can get this from the Discord Developer Portal
                        </FormDescription>
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
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <SelectTrigger className="bg-background/60 border-gray-700">
                              <SelectValue placeholder="Select bot type" />
                            </SelectTrigger>
                            <SelectContent className="bg-background-light border-gray-800">
                              <SelectItem value={BotType.CUSTOM}>Custom</SelectItem>
                              <SelectItem value={BotType.MUSIC}>Music</SelectItem>
                              <SelectItem value={BotType.MODERATION}>Moderation</SelectItem>
                              <SelectItem value={BotType.GAMING}>Gaming</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          This affects the bot's visual style on the dashboard
                        </FormDescription>
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
                            value={field.value}
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
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Updating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save mr-2"></i>
                        Save Changes
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="permissions" className="mt-4">
            <BotPermissionsTab bot={bot} onUpdate={onBotUpdated} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}