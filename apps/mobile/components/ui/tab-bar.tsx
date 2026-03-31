import { View, TouchableOpacity } from 'react-native';
import { Text } from './text';
import { colors } from '@/constants/theme';
import type { LucideIcon } from 'lucide-react-native';

interface Tab<T extends string> {
  key: T;
  label: string;
  icon?: LucideIcon;
}

interface TabBarProps<T extends string> {
  tabs: Tab<T>[];
  active: T;
  onChange: (key: T) => void;
}

export const TabBar = <T extends string>({ tabs, active, onChange }: TabBarProps<T>) => (
  <View className="px-4 pt-4 pb-2">
    <View className="flex-row bg-card border border-border rounded-lg p-1">
      {tabs.map(({ key, label, icon: Icon }) => {
        const isActive = active === key;
        return (
          <TouchableOpacity
            key={key}
            className={`flex-1 flex-row items-center justify-center gap-1.5 py-2 rounded-md ${isActive ? 'bg-primary' : ''}`}
            onPress={() => onChange(key)}
          >
            {Icon && <Icon size={14} color={isActive ? '#fff' : colors.mutedForeground} />}
            <Text className={`text-xs font-medium ${isActive ? 'text-white' : 'text-muted-foreground'}`}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);
