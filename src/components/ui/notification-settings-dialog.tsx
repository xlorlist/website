import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationTheme, NotificationSound, useNotificationSettings } from '@/hooks/use-notification-settings';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface NotificationSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationSettingsDialog({ open, onOpenChange }: NotificationSettingsDialogProps) {
  const { settings, updateSettings, playSound } = useNotificationSettings();

  const handleSoundChange = (sound: NotificationSound) => {
    updateSettings({ sound });
    if (sound !== 'none') {
      playSound(sound);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background-light border border-gray-800 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl neon-text">Notification Settings</DialogTitle>
          <DialogDescription>
            Customize how notifications appear and sound in your dashboard.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="themes" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4 bg-background">
            <TabsTrigger value="themes">Visual Themes</TabsTrigger>
            <TabsTrigger value="sounds">Sound Effects</TabsTrigger>
          </TabsList>

          <TabsContent value="themes" className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-3">Choose Notification Theme</h3>
              <RadioGroup
                value={settings.theme}
                onValueChange={(value) => updateSettings({ theme: value as NotificationTheme })}
                className="grid grid-cols-2 gap-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="discord" id="theme-discord" />
                  <Label htmlFor="theme-discord" className="cursor-pointer flex items-center">
                    <div className="w-6 h-6 rounded bg-[#5865F2] mr-2"></div>
                    Discord
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="modern" id="theme-modern" />
                  <Label htmlFor="theme-modern" className="cursor-pointer flex items-center">
                    <div className="w-6 h-6 rounded bg-blue-500 mr-2"></div>
                    Modern
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="minimal" id="theme-minimal" />
                  <Label htmlFor="theme-minimal" className="cursor-pointer flex items-center">
                    <div className="w-6 h-6 rounded bg-gray-500 mr-2"></div>
                    Minimal
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="neon" id="theme-neon" />
                  <Label htmlFor="theme-neon" className="cursor-pointer flex items-center">
                    <div className="w-6 h-6 rounded bg-cyan-500 mr-2"></div>
                    Neon
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="rounded-lg border border-gray-800 bg-background p-4 space-y-3">
              <h3 className="text-sm font-medium">Theme Preview</h3>
              <div className={`p-3 border rounded-md ${
                settings.theme === 'discord' ? 'bg-[#36393f] border-[#202225]' :
                settings.theme === 'modern' ? 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700' :
                settings.theme === 'minimal' ? 'bg-gray-100 border-gray-300 dark:bg-gray-900 dark:border-gray-800' :
                'bg-black border-cyan-500 shadow-[0_0_5px_#22d3ee]'
              }`}>
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full ${
                    settings.theme === 'discord' ? 'bg-[#5865F2]' :
                    settings.theme === 'modern' ? 'bg-blue-500' :
                    settings.theme === 'minimal' ? 'bg-gray-500' :
                    'bg-cyan-500'
                  } flex items-center justify-center`}>
                    <i className="fas fa-bell text-white text-xs"></i>
                  </div>
                  <div className="ml-3">
                    <p className={`font-medium ${
                      settings.theme === 'discord' ? 'text-white' :
                      settings.theme === 'modern' ? 'text-black dark:text-white' :
                      settings.theme === 'minimal' ? 'text-gray-800 dark:text-gray-200' :
                      'text-cyan-400'
                    }`}>Bot Online</p>
                    <p className={`text-xs ${
                      settings.theme === 'discord' ? 'text-gray-400' :
                      settings.theme === 'modern' ? 'text-gray-600 dark:text-gray-400' :
                      settings.theme === 'minimal' ? 'text-gray-500 dark:text-gray-400' :
                      'text-cyan-300'
                    }`}>Your bot is now running 24/7</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="notifications-enabled" className="text-sm">Notifications Enabled</Label>
              <Switch
                id="notifications-enabled"
                checked={settings.enabled}
                onCheckedChange={(checked) => updateSettings({ enabled: checked })}
              />
            </div>
          </TabsContent>

          <TabsContent value="sounds" className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-3">Choose Notification Sound</h3>
              <RadioGroup
                value={settings.sound}
                onValueChange={handleSoundChange}
                className="space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="discord" id="sound-discord" />
                  <Label htmlFor="sound-discord" className="cursor-pointer flex items-center">
                    <i className="fab fa-discord text-[#5865F2] mr-2"></i>
                    Discord
                  </Label>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="ml-auto h-6 w-6" 
                    onClick={() => playSound('discord')}
                  >
                    <i className="fas fa-play text-xs"></i>
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="chime" id="sound-chime" />
                  <Label htmlFor="sound-chime" className="cursor-pointer flex items-center">
                    <i className="fas fa-bell text-yellow-500 mr-2"></i>
                    Chime
                  </Label>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="ml-auto h-6 w-6" 
                    onClick={() => playSound('chime')}
                  >
                    <i className="fas fa-play text-xs"></i>
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pop" id="sound-pop" />
                  <Label htmlFor="sound-pop" className="cursor-pointer flex items-center">
                    <i className="fas fa-circle text-cyan-500 mr-2"></i>
                    Pop
                  </Label>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="ml-auto h-6 w-6" 
                    onClick={() => playSound('pop')}
                  >
                    <i className="fas fa-play text-xs"></i>
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bell" id="sound-bell" />
                  <Label htmlFor="sound-bell" className="cursor-pointer flex items-center">
                    <i className="fas fa-bell text-green-500 mr-2"></i>
                    Bell
                  </Label>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="ml-auto h-6 w-6" 
                    onClick={() => playSound('bell')}
                  >
                    <i className="fas fa-play text-xs"></i>
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="sound-none" />
                  <Label htmlFor="sound-none" className="cursor-pointer flex items-center">
                    <i className="fas fa-volume-mute text-gray-500 mr-2"></i>
                    None
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="volume-slider" className="text-sm">Volume</Label>
                <span className="text-xs">{Math.round(settings.volume * 100)}%</span>
              </div>
              <Slider
                id="volume-slider"
                min={0}
                max={1}
                step={0.05}
                value={[settings.volume]}
                onValueChange={(value) => updateSettings({ volume: value[0] })}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            <Button 
              onClick={() => playSound(settings.sound)} 
              variant="outline" 
              className="w-full"
              disabled={settings.sound === 'none'}
            >
              <i className="fas fa-play-circle mr-2"></i>
              Test Sound
            </Button>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-4">
          <Button onClick={() => onOpenChange(false)}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}