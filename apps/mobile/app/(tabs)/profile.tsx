import { View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';

const ProfileScreen = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 pt-4">
        <Text className="text-2xl font-bold text-foreground">Profile</Text>

        <View className="mt-6 gap-4">
          <View className="gap-1">
            <Text className="text-sm text-muted-foreground">Name</Text>
            <Text className="text-base text-foreground">{user?.name ?? '-'}</Text>
          </View>
          <View className="gap-1">
            <Text className="text-sm text-muted-foreground">Email</Text>
            <Text className="text-base text-foreground">{user?.email ?? '-'}</Text>
          </View>
          <View className="gap-1">
            <Text className="text-sm text-muted-foreground">Role</Text>
            <Text className="text-base text-foreground capitalize">{user?.role?.toLowerCase() ?? '-'}</Text>
          </View>
        </View>

        <View className="mt-auto pb-8">
          <Button variant="destructive" onPress={handleSignOut}>
            Sign Out
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default ProfileScreen;
