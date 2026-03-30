import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

const DiaryScreen = () => {
  const { role } = useAuth();
  const isTrainer = role === 'TRAINER';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-lg text-muted-foreground">
          {isTrainer ? 'Clients coming soon' : 'Diary coming soon'}
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default DiaryScreen;
