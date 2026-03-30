import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';

const MessagesScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-lg text-muted-foreground">Messages coming soon</Text>
      </View>
    </SafeAreaView>
  );
};

export default MessagesScreen;
