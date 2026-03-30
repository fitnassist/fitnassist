import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'lucide-react-native';
import { Text } from '@/components/ui';
import { colors } from '@/constants/theme';

const BookingsScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-4 py-4">
        <Text className="text-2xl font-extralight text-foreground uppercase" style={{ letterSpacing: 2 }}>
          Bookings
        </Text>
      </View>
      <View className="flex-1 items-center justify-center px-6 gap-3">
        <Calendar size={48} color={colors.mutedForeground} />
        <Text className="text-base text-muted-foreground text-center">
          Bookings coming in Phase M4
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default BookingsScreen;
