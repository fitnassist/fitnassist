import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookHeart, Users } from 'lucide-react-native';
import { Text } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/constants/theme';

const DiaryScreen = () => {
  const { role } = useAuth();
  const isTrainer = role === 'TRAINER';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-4 py-4">
        <Text className="text-2xl font-extralight text-foreground uppercase" style={{ letterSpacing: 2 }}>
          {isTrainer ? 'Clients' : 'Diary'}
        </Text>
      </View>
      <View className="flex-1 items-center justify-center px-6 gap-3">
        {isTrainer ? (
          <Users size={48} color={colors.mutedForeground} />
        ) : (
          <BookHeart size={48} color={colors.mutedForeground} />
        )}
        <Text className="text-base text-muted-foreground text-center">
          {isTrainer ? 'Client management coming in Phase M5' : 'Diary coming in Phase M6'}
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default DiaryScreen;
