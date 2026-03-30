import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle } from 'lucide-react-native';
import { Text } from '@/components/ui';
import { colors } from '@/constants/theme';

const MessagesScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-4 py-4">
        <Text className="text-2xl font-extralight text-foreground uppercase" style={{ letterSpacing: 2 }}>
          Messages
        </Text>
      </View>
      <View className="flex-1 items-center justify-center px-6 gap-3">
        <MessageCircle size={48} color={colors.mutedForeground} />
        <Text className="text-base text-muted-foreground text-center">
          Messages coming in Phase M3
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default MessagesScreen;
