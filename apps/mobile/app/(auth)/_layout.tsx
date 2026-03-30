import { Stack } from 'expo-router';

const AuthLayout = () => {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'hsl(0, 0%, 100%)' },
      }}
    />
  );
};

export default AuthLayout;
