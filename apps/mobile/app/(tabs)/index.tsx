import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

const HomeScreen = () => {
  const { user, role } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 pt-4">
        <Text className="text-2xl font-bold text-foreground">
          Hey, {user?.name ?? 'there'}
        </Text>
        <Text className="mt-1 text-base text-muted-foreground">
          {role === 'TRAINER' ? 'Trainer Dashboard' : 'Your Dashboard'}
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;
