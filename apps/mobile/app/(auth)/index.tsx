import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button } from '@/components/ui';
import { GradientBackground } from '@/components/GradientBackground';

const WelcomeScreen = () => {
  const router = useRouter();

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1">
        <View className="flex-1 justify-center items-center px-8">
          <View className="border border-white/60 px-8 py-4 mb-4">
            <Text className="text-2xl font-extralight text-white uppercase" style={{ letterSpacing: 8 }}>
              Fitnassist
            </Text>
          </View>
          <Text className="text-white/60 text-base text-center">
            Your fitness journey starts here
          </Text>
        </View>

        <View className="px-8 pb-8 gap-3">
          <Button
            onPress={() => router.push('/(auth)/login')}
          >
            Sign In
          </Button>
          <Button
            variant="outline"
            onPress={() => router.push('/(auth)/register')}
            className="border-white/30 bg-transparent"
          >
            <Text className="text-white font-semibold">Create Account</Text>
          </Button>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
};

export default WelcomeScreen;
