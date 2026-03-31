import { useState } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, Input, useAlert } from '@/components/ui';
import { GradientBackground } from '@/components/GradientBackground';
import { signUp } from '@/lib/auth';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    role: z.enum(['TRAINER', 'TRAINEE']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

const RegisterScreen = () => {
  const { showAlert } = useAlert();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'TRAINEE',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const result = await signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      });

      if (result.error) {
        showAlert({ title: 'Registration Failed', message: result.error.message ?? 'Could not create account' });
      } else {
        showAlert({
          title: 'Check Your Email',
          message: 'We sent you a verification link. Please verify your email to continue.',
          actions: [{ label: 'OK', onPress: () => router.replace('/(auth)/login') }],
        });
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
            contentContainerClassName="py-12 px-6"
            keyboardShouldPersistTaps="handled"
          >
            <View className="gap-8">
              <View className="gap-2 items-center">
                <Text className="text-3xl font-extralight text-white uppercase text-center" style={{ letterSpacing: 2 }}>
                  Create Account
                </Text>
                <Text className="text-base text-white/60 text-center">
                  Join Fitnassist to get started
                </Text>
              </View>

              <View className="gap-2">
                <Text className="text-sm font-medium text-white">I am a...</Text>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className={`flex-1 items-center rounded-lg border-2 py-4 ${
                      selectedRole === 'TRAINEE'
                        ? 'border-primary bg-primary'
                        : 'border-white/20'
                    }`}
                    onPress={() => setValue('role', 'TRAINEE')}
                  >
                    <Text
                      className={`text-base font-semibold ${
                        selectedRole === 'TRAINEE' ? 'text-white' : 'text-white/50'
                      }`}
                    >
                      Trainee
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex-1 items-center rounded-lg border-2 py-4 ${
                      selectedRole === 'TRAINER'
                        ? 'border-primary bg-primary'
                        : 'border-white/20'
                    }`}
                    onPress={() => setValue('role', 'TRAINER')}
                  >
                    <Text
                      className={`text-base font-semibold ${
                        selectedRole === 'TRAINER' ? 'text-white' : 'text-white/50'
                      }`}
                    >
                      Trainer
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View className="gap-4">
                <Controller
                  control={control}
                  name="name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Full Name"
                      placeholder="John Doe"
                      autoComplete="name"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      error={errors.name?.message}
                      variant="dark"
                    />
                  )}
                />

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
                      placeholder="At least 8 characters"
                      secureTextEntry
                      autoComplete="new-password"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      error={errors.password?.message}
                      variant="dark"
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      label="Confirm Password"
                      placeholder="Repeat your password"
                      secureTextEntry
                      autoComplete="new-password"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      error={errors.confirmPassword?.message}
                      variant="dark"
                    />
                  )}
                />

                <Button
                  onPress={handleSubmit(onSubmit)}
                  loading={loading}
                >
                  Create Account
                </Button>
              </View>

              <View className="flex-row items-center justify-center gap-1">
                <Text className="text-white/60">
                  Already have an account?
                </Text>
                <Button
                  variant="link"
                  size="sm"
                  onPress={() => router.push('/(auth)/login')}
                >
                  Sign In
                </Button>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
};

export default RegisterScreen;
