import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from '@/providers';

export const Toaster = () => {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      theme={theme as 'light' | 'dark' | 'system'}
      position="bottom-right"
      toastOptions={{
        duration: 3000,
        classNames: {
          toast: 'text-sm',
        },
      }}
      richColors
      closeButton
    />
  );
};
