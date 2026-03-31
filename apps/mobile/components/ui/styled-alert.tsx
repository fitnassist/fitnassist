import { useState, createContext, useContext, useCallback, useRef } from 'react';
import { View, Modal, Pressable } from 'react-native';
import { Text } from './text';
import { Button } from './button';
import { colors } from '@/constants/theme';
import type { ReactNode } from 'react';

interface AlertAction {
  label: string;
  onPress?: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'ghost';
}

interface AlertConfig {
  title: string;
  message?: string;
  actions?: AlertAction[];
  icon?: ReactNode;
}

interface AlertContextType {
  showAlert: (config: AlertConfig) => void;
}

const AlertContext = createContext<AlertContextType>({ showAlert: () => {} });

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertConfig | null>(null);

  const showAlert = useCallback((c: AlertConfig) => {
    setConfig(c);
    setVisible(true);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    setConfig(null);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <Modal visible={visible} transparent animationType="fade" onRequestClose={dismiss}>
        <Pressable className="flex-1 bg-black/60 items-center justify-center px-6" onPress={dismiss}>
          <Pressable className="w-full max-w-sm bg-card border border-border rounded-2xl overflow-hidden" onPress={(e) => e.stopPropagation()}>
            <View className="px-5 pt-5 pb-4 gap-3">
              {config?.icon && (
                <View className="items-center mb-1">{config.icon}</View>
              )}
              <Text className="text-lg font-semibold text-foreground text-center">
                {config?.title}
              </Text>
              {config?.message && (
                <Text className="text-sm text-muted-foreground text-center">
                  {config.message}
                </Text>
              )}
            </View>
            <View className="px-5 pb-5 gap-2">
              {(config?.actions ?? [{ label: 'OK' }]).map((action, i) => (
                <Button
                  key={i}
                  variant={action.variant ?? (i === 0 ? 'default' : 'outline')}
                  onPress={() => {
                    dismiss();
                    action.onPress?.();
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </AlertContext.Provider>
  );
};
