import { useState, useEffect } from 'react';
import { View, ScrollView, Alert, Image, TouchableOpacity as RNTouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Text, Button, Input, Card, CardContent } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useMyTrainerProfile, useUpdateTrainerProfile } from '@/api/trainer';
import { useMyTraineeProfile, useUpdateTraineeProfile } from '@/api/trainee';
import { colors } from '@/constants/theme';

const TrainerProfileEdit = () => {
  const { data: profile, isLoading } = useMyTrainerProfile();
  const updateProfile = useUpdateTrainerProfile();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [postcode, setPostcode] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName ?? '');
      setBio(profile.bio ?? '');
      setCity(profile.city ?? '');
      setPostcode(profile.postcode ?? '');
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile.mutateAsync({
        displayName,
        bio,
        city,
        postcode,
      });
      Alert.alert('Success', 'Profile updated');
    } catch {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      // TODO: Upload image to server and update profileImageUrl
      Alert.alert('Coming Soon', 'Image upload will be available in a future update');
    }
  };

  if (isLoading) return null;

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-4 pb-8">
      {/* Avatar */}
      <View className="items-center mb-2">
        <RNTouchableOpacity onPress={handlePickImage}>
          {profile?.profileImageUrl ? (
            <View className="relative">
              <Image
                source={{ uri: profile.profileImageUrl }}
                className="w-24 h-24 rounded-full"
              />
              <View className="absolute bottom-0 right-0 bg-primary w-8 h-8 rounded-full items-center justify-center">
                <Camera size={16} color="#fff" />
              </View>
            </View>
          ) : (
            <View className="relative">
              <View className="w-24 h-24 rounded-full bg-secondary items-center justify-center">
                <Text className="text-2xl font-bold text-foreground">
                  {displayName.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
              <View className="absolute bottom-0 right-0 bg-primary w-8 h-8 rounded-full items-center justify-center">
                <Camera size={16} color="#fff" />
              </View>
            </View>
          )}
        </RNTouchableOpacity>
      </View>

      <Card>
        <CardContent className="py-4 px-4 gap-3">
          <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>
            Basic Info
          </Text>
          <Input label="Display Name" value={displayName} onChangeText={setDisplayName} />
          <Input label="Bio" value={bio} onChangeText={setBio} multiline numberOfLines={4} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4 px-4 gap-3">
          <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>
            Location
          </Text>
          <Input label="City" value={city} onChangeText={setCity} />
          <Input label="Postcode" value={postcode} onChangeText={setPostcode} />
        </CardContent>
      </Card>

      <Button onPress={handleSave} loading={saving}>
        Save Changes
      </Button>
    </ScrollView>
  );
};

const TraineeProfileEdit = () => {
  const { data: profile, isLoading } = useMyTraineeProfile();
  const updateProfile = useUpdateTraineeProfile();
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setBio(profile.bio ?? '');
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile.mutateAsync({ bio });
      Alert.alert('Success', 'Profile updated');
    } catch {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      Alert.alert('Coming Soon', 'Image upload will be available in a future update');
    }
  };

  if (isLoading) return null;

  return (
    <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-4 pb-8">
      <View className="items-center mb-2">
        <RNTouchableOpacity onPress={handlePickImage}>
          {profile?.avatarUrl ? (
            <View className="relative">
              <Image source={{ uri: profile.avatarUrl }} className="w-24 h-24 rounded-full" />
              <View className="absolute bottom-0 right-0 bg-primary w-8 h-8 rounded-full items-center justify-center">
                <Camera size={16} color="#fff" />
              </View>
            </View>
          ) : (
            <View className="relative">
              <View className="w-24 h-24 rounded-full bg-secondary items-center justify-center">
                <Camera size={24} color={colors.mutedForeground} />
              </View>
            </View>
          )}
        </RNTouchableOpacity>
      </View>

      <Card>
        <CardContent className="py-4 px-4 gap-3">
          <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>
            About Me
          </Text>
          <Input label="Bio" value={bio} onChangeText={setBio} multiline numberOfLines={4} />
        </CardContent>
      </Card>

      <Button onPress={handleSave} loading={saving}>
        Save Changes
      </Button>
    </ScrollView>
  );
};

const ProfileEditScreen = () => {
  const router = useRouter();
  const { role } = useAuth();
  const isTrainer = role === 'TRAINER';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">Edit Profile</Text>
      </View>
      {isTrainer ? <TrainerProfileEdit /> : <TraineeProfileEdit />}
    </SafeAreaView>
  );
};

export default ProfileEditScreen;
