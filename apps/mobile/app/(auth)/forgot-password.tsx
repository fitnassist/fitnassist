import { useState } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, Input } from '@/components/ui';
import { GradientBackground } from '@/components/GradientBackground';
import { authClient } from '@/lib/auth';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordScreen = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true);
    try {
      await authClient.forgetPassword({
        email: data.email,
        redirectTo: 'fitnassist://reset-password',
      });

      Alert.alert(
        'Check Your Email',
        'If an account exists with that email, we sent a password reset link.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            contentContainerClassName="flex-1 justify-center px-6"
            keyboardShouldPersistTaps="handled"
          >
            <View className="gap-8">
              <View className="gap-2 items-center">
                <Text className="text-3xl font-extralight text-white uppercase text-center" style={{ letterSpacing: 2 }}>
                  Forgot Password
                </Text>
                <Text className="text-base text-white/60 text-center">
                  Enter your email and we'll send you a reset link
                </Text>
              </View>

              <View className="gap-4">
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Email"
                      placeholder="you@example.com"
                      keyboardType="email-address"
                      autoComplete="email"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      error={errors.email?.message}
                      variant="dark"
                    />
                  )}
                />

                <Button
                  onPress={handleSubmit(onSubmit)}
                  loading={loading}
                >
                  Send Reset Link
                </Button>
              </View>

              <Button
                variant="link"
                size="sm"
                onPress={() => router.back()}
              >
                Back to Sign In
              </Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
};

export default ForgotPasswordScreen;
