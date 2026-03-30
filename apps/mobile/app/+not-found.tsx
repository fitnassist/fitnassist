import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button } from '@/components/ui';

const NotFoundScreen = () => {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-4 px-6">
        <Text className="text-2xl font-bold text-foreground">Page not found</Text>
        <Button onPress={() => router.replace('/')}>Go Home</Button>
      </View>
    </SafeAreaView>
  );
};

export default NotFoundScreen;
