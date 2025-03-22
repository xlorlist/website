import React from 'react';
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';
import { useNotificationSettings } from '@/hooks/use-notification-settings';

export function ThemedToast() {
  const { toasts, dismiss } = useToast();
  const { settings } = useNotificationSettings();

  // Get theme-specific styles
  const getThemeStyles = () => {
    switch (settings.theme) {
      case 'discord':
        return {
          toast: 'bg-[#36393f] border-[#202225] text-white',
          title: 'text-white font-semibold',
          description: 'text-gray-300',
          close: 'text-gray-400 hover:text-white',
        };
      case 'modern':
        return {
          toast: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100',
          title: 'text-gray-900 dark:text-white font-medium',
          description: 'text-gray-600 dark:text-gray-300',
          close: 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white',
        };
      case 'minimal':
        return {
          toast: 'bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800 text-gray-900 dark:text-gray-100',
          title: 'text-gray-800 dark:text-gray-200 font-normal',
          description: 'text-gray-600 dark:text-gray-400',
          close: 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200',
        };
      case 'neon':
        return {
          toast: 'bg-black border-cyan-500 text-white shadow-[0_0_10px_#22d3ee]',
          title: 'text-cyan-400 font-bold',
          description: 'text-cyan-300',
          close: 'text-cyan-500 hover:text-cyan-300',
        };
      default:
        return {
          toast: '',
          title: '',
          description: '',
          close: '',
        };
    }
  };

  const themeStyles = getThemeStyles();

  // Add animation classes based on theme
  const getAnimationClass = () => {
    switch (settings.theme) {
      case 'discord':
        return 'animate-in slide-in-from-right-full duration-300';
      case 'modern':
        return 'animate-in fade-in-50 duration-200';
      case 'minimal':
        return 'animate-in fade-in duration-100';
      case 'neon':
        return 'animate-in slide-in-from-bottom-full duration-300';
      default:
        return 'animate-in fade-in';
    }
  };

  const animationClass = getAnimationClass();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => {
        return (
          <Toast
            key={id}
            {...props}
            className={`${themeStyles.toast} ${animationClass} group relative`}
          >
            <div className="grid gap-1">
              {title && <ToastTitle className={themeStyles.title}>{title}</ToastTitle>}
              {description && (
                <ToastDescription className={themeStyles.description}>
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose
              className={themeStyles.close}
              onClick={() => dismiss(id)}
            />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}