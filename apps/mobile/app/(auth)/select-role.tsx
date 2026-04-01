import { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Dumbbell, Users } from 'lucide-react-native';
import { Text, Button, useAlert } from '@/components/ui';
import { GradientBackground } from '@/components/GradientBackground';
import { authClient } from '@/lib/auth';
import { colors } from '@/constants/theme';

const roles = [
  {
    value: 'TRAINEE' as const,
    label: 'Trainee',
    description: 'Find trainers, track progress, and reach your fitness goals',
    Icon: Users,
  },
  {
    value: 'TRAINER' as const,
    label: 'Personal Trainer',
    description: 'Manage clients, create programmes, and grow your business',
    Icon: Dumbbell,
  },
];

const SelectRoleScreen = () => {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [selected, setSelected] = useState<'TRAINEE' | 'TRAINER'>('TRAINEE');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    try {
      await authClient.updateUser({ role: selected });
      router.replace('/(tabs)');
    } catch {
      showAlert({ title: 'Error', message: 'Failed to set role. Please try again.' });
      setLoading(false);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1 justify-center px-6">
        <View className="gap-8">
          <View className="gap-2 items-center">
            <Text
              className="text-3xl font-extralight text-white uppercase text-center"
              style={{ letterSpacing: 2 }}
            >
              Welcome
            </Text>
            <Text className="text-base text-white/60 text-center">
              How will you be using Fitnassist?
            </Text>
          </View>

          <View className="gap-3">
            {roles.map((role) => {
              const isActive = selected === role.value;
              return (
                <TouchableOpacity
                  key={role.value}
                  onPress={() => setSelected(role.value)}
                  className={`p-4 rounded-lg border-2 ${
                    isActive ? 'border-primary bg-primary/10' : 'border-white/20'
                  }`}
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      className={`rounded-full p-2 ${isActive ? 'bg-primary/20' : 'bg-white/10'}`}
                    >
                      <role.Icon
                        size={20}
                        color={isActive ? colors.primary : 'rgba(255,255,255,0.5)'}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className={`font-medium ${isActive ? 'text-white' : 'text-white/70'}`}>
                        {role.label}
                      </Text>
                      <Text className="text-xs text-white/50">{role.description}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <Button onPress={handleContinue} loading={loading}>
            Continue
          </Button>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
};

export default SelectRoleScreen;
