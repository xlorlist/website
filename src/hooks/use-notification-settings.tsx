import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

export type NotificationTheme = 'discord' | 'modern' | 'minimal' | 'neon';
export type NotificationSound = 'discord' | 'chime' | 'pop' | 'bell' | 'none';

interface NotificationSettings {
  theme: NotificationTheme;
  sound: NotificationSound;
  volume: number;
  enabled: boolean;
}

interface NotificationContextType {
  settings: NotificationSettings;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  playSound: (sound?: NotificationSound) => void;
}

const defaultSettings: NotificationSettings = {
  theme: 'neon',
  sound: 'discord',
  volume: 0.5,
  enabled: true,
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    // Load settings from localStorage if available
    const savedSettings = localStorage.getItem('notificationSettings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });

  // Audio elements for different sounds
  const [audioElements, setAudioElements] = useState<Record<string, HTMLAudioElement>>({});

  // Initialize audio elements
  useEffect(() => {
    import('@/lib/notification-sounds').then(({ loadNotificationSounds }) => {
      const audioMap = loadNotificationSounds();
      
      // Set volume for all audio elements
      Object.values(audioMap).forEach(audio => {
        audio.volume = settings.volume;
      });

      setAudioElements(audioMap);
    });

    // Clean up audio elements on unmount
    return () => {
      Object.values(audioElements).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
    };
  }, []);

  // Update audio volume when settings change
  useEffect(() => {
    Object.values(audioElements).forEach(audio => {
      audio.volume = settings.volume;
    });
  }, [settings.volume, audioElements]);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  }, [settings]);

  // Update settings
  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
    }));
  };

  // Play notification sound
  const playSound = (sound?: NotificationSound) => {
    const soundToPlay = sound || settings.sound;
    
    if (settings.enabled && soundToPlay !== 'none' && audioElements[soundToPlay]) {
      // Clone and play to allow for rapid sound repetition
      const audioEl = audioElements[soundToPlay];
      audioEl.currentTime = 0;
      audioEl.play().catch(error => {
        console.error('Error playing notification sound:', error);
      });
    }
  };

  return (
    <NotificationContext.Provider value={{ settings, updateSettings, playSound }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationSettings = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationSettings must be used within a NotificationProvider');
  }
  return context;
};