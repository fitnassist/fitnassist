import { TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui';
import type { LucideIcon } from 'lucide-react-native';

interface QuickActionProps {
  label: string;
  description: string;
  icon: LucideIcon;
  onPress: () => void;
  badge?: number;
}

export const QuickAction = ({ label, description, icon: Icon, onPress, badge }: QuickActionProps) => {
  return (
    <TouchableOpacity
      className="flex-1 bg-card rounded-lg border border-border p-4 gap-2"
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View className="flex-row items-center justify-between">
        <Icon size={20} color="hsl(346, 66%, 55%)" />
        {badge !== undefined && badge > 0 && (
          <View className="bg-primary rounded-full h-5 min-w-[20px] items-center justify-center px-1">
            <Text className="text-[10px] font-bold text-white">{badge}</Text>
          </View>
        )}
      </View>
      <Text className="text-sm font-semibold text-foreground">{label}</Text>
      <Text className="text-xs text-muted-foreground" numberOfLines={2}>
        {description}
      </Text>
    </TouchableOpacity>
  );
};
