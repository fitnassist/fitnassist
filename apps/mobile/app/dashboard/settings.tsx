import { useState } from 'react';
import { View, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Button, Input, Card, CardContent } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { authClient } from '@/lib/auth';
import { colors } from '@/constants/theme';

const NameSection = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [saving, setSaving] = useState(false);
  const updateName = trpc.user.updateName.useMutation();

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await updateName.mutateAsync({ name: name.trim() });
      Alert.alert('Success', 'Name updated');
    } catch {
      Alert.alert('Error', 'Failed to update name');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="py-4 px-4 gap-3">
        <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>
          Name
        </Text>
        <Input value={name} onChangeText={setName} placeholder="Your name" />
        <Button onPress={handleSave} loading={saving} size="sm">
          Save
        </Button>
      </CardContent>
    </Card>
  );
};

const PasswordSection = () => {
  const [current, setCurrent] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (newPw !== confirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (newPw.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      await authClient.changePassword({
        currentPassword: current,
        newPassword: newPw,
      });
      Alert.alert('Success', 'Password updated');
      setCurrent('');
      setNewPw('');
      setConfirm('');
    } catch {
      Alert.alert('Error', 'Failed to update password. Check your current password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="py-4 px-4 gap-3">
        <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>
          Change Password
        </Text>
        <Input
          value={current}
          onChangeText={setCurrent}
          placeholder="Current password"
          secureTextEntry
        />
        <Input
          value={newPw}
          onChangeText={setNewPw}
          placeholder="New password"
          secureTextEntry
        />
        <Input
          value={confirm}
          onChangeText={setConfirm}
          placeholder="Confirm new password"
          secureTextEntry
        />
        <Button onPress={handleSave} loading={saving} size="sm">
          Update Password
        </Button>
      </CardContent>
    </Card>
  );
};

const DangerSection = () => {
  const { signOut } = useAuth();

  const handleDelete = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent and cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await authClient.deleteUser();
              await signOut();
            } catch {
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ],
    );
  };

  return (
    <Card>
      <CardContent className="py-4 px-4 gap-3">
        <Text className="text-sm font-medium text-destructive uppercase" style={{ letterSpacing: 1 }}>
          Danger Zone
        </Text>
        <Text className="text-sm text-muted-foreground">
          Permanently delete your account and all associated data.
        </Text>
        <Button variant="destructive" onPress={handleDelete} size="sm">
          Delete Account
        </Button>
      </CardContent>
    </Card>
  );
};

const SettingsScreen = () => {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">Account Settings</Text>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-4 pb-8">
        <NameSection />
        <PasswordSection />
        <DangerSection />
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;
