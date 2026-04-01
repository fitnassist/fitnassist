import { useState } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, Input, useAlert } from '@/components/ui';
import { GradientBackground } from '@/components/GradientBackground';
import { signIn } from '@/lib/auth';
import { SocialAuthButtons } from '@/components/SocialAuthButtons';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

const LoginScreen = () => {
  const { showAlert } = useAlert();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const result = await signIn.email({
        email: data.email,
        password: data.password,
      });

      if (result.error) {
        showAlert({ title: 'Login Failed', message: result.error.message ?? 'Invalid credentials' });
      }
    } catch {
      showAlert({ title: 'Error', message: 'Something went wrong. Please try again.' });
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
                  Welcome Back
                </Text>
                <Text className="text-base text-white/60 text-center">
                  Sign in to your Fitnassist account
                </Text>
              </View>

              <SocialAuthButtons callbackURL="/(tabs)" disabled={loading} />

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

                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Password"
                      placeholder="Enter your password"
                      secureTextEntry
                      autoComplete="password"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      error={errors.password?.message}
                      variant="dark"
                    />
                  )}
                />

                <Button
                  onPress={handleSubmit(onSubmit)}
                  loading={loading}
                >
                  Sign In
                </Button>
              </View>

              <View className="flex-row items-center justify-center gap-1">
                <Text className="text-white/60">
                  Don't have an account?
                </Text>
                <Button
                  variant="link"
                  size="sm"
                  onPress={() => router.push('/(auth)/register')}
                >
                  Sign Up
                </Button>
              </View>

              <Button
                variant="link"
                size="sm"
                onPress={() => router.push('/(auth)/forgot-password')}
              >
                Forgot your password?
              </Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
};

export default LoginScreen;
