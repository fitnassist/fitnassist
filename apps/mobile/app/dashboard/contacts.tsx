import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui';
import { colors } from '@/constants/theme';

const MyContactsScreen = () => {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">My Contacts</Text>
      </View>
      <View className="flex-1 items-center justify-center px-6 gap-2">
        <Text className="text-lg text-foreground">My Contacts</Text>
        <Text className="text-sm text-muted-foreground text-center">
          Coming in Phase M6
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default MyContactsScreen;
