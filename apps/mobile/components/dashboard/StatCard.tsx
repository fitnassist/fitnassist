import { View } from 'react-native';
import { Text, Card, CardContent } from '@/components/ui';
import type { LucideIcon } from 'lucide-react-native';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
}

export const StatCard = ({ label, value, icon: Icon, iconColor = 'hsl(170, 58%, 57%)' }: StatCardProps) => {
  return (
    <Card className="flex-1">
      <CardContent className="py-3 px-3 gap-2">
        <View className="flex-row items-center gap-2">
          <Icon size={16} color={iconColor} />
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>
            {label}
          </Text>
        </View>
        <Text className="text-xl font-bold text-foreground">{value}</Text>
      </CardContent>
    </Card>
  );
};
