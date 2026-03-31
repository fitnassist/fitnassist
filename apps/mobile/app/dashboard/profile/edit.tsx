import { useState, useEffect } from 'react';
import { View, ScrollView, Image, Switch, FlatList, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, Check, X } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { Calendar as RNCalendar } from 'react-native-calendars';
import { Text, Button, Input, Card, CardContent, TabBar, AddressInput, type AddressResult, useAlert, Skeleton, DatePicker, PillSelect } from '@/components/ui';
import { CheckCircle as CheckIcon, XCircle } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { useMyTrainerProfile, useUpdateTrainerProfile } from '@/api/trainer';
import { useMyTraineeProfile, useUpdateTraineeProfile } from '@/api/trainee';
import { trpc } from '@/lib/trpc';
import { TRAINER_SERVICES as SERVICES_DATA } from '@fitnassist/schemas/src/constants/services.constants';
import { TRAINER_QUALIFICATIONS as QUALS_DATA } from '@fitnassist/schemas/src/constants/qualifications.constants';
import { colors } from '@/constants/theme';

type TrainerTab = 'basic' | 'location' | 'services' | 'media' | 'settings';
type TraineeTab = 'personal' | 'body' | 'fitness' | 'nutrition' | 'privacy';

const apiUrl = Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:3001';

// Group services by category
const SERVICE_GROUPS = [
  { label: 'Fitness', items: SERVICES_DATA.filter((s) => s.category === 'fitness') },
  { label: 'Wellness', items: SERVICES_DATA.filter((s) => s.category === 'wellness') },
];

// Group qualifications by region
const QUAL_GROUPS = [
  { label: 'UK Qualifications', items: QUALS_DATA.filter((q) => q.region === 'uk') },
  { label: 'International', items: QUALS_DATA.filter((q) => q.region === 'international') },
];

const TRAVEL_OPTIONS = [
  { value: 'CLIENT_TRAVELS', label: 'Client travels to me' },
  { value: 'TRAINER_TRAVELS', label: 'I travel to client' },
  { value: 'BOTH', label: 'Both' },
];

const GENDERS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'NON_BINARY', label: 'Non-binary' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
];

const EXPERIENCE_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const ACTIVITY_LEVELS = ['SEDENTARY', 'LIGHTLY_ACTIVE', 'MODERATELY_ACTIVE', 'VERY_ACTIVE', 'EXTREMELY_ACTIVE'];
const FITNESS_GOALS = [
  'weight-loss', 'muscle-gain', 'endurance', 'flexibility', 'general-fitness',
  'sports-performance', 'rehabilitation', 'stress-relief', 'body-recomposition',
];


const GroupedChipSelect = ({ groups, selected, onToggle }: {
  groups: { label: string; items: readonly { value: string; label: string }[] }[];
  selected: string[];
  onToggle: (val: string) => void;
}) => (
  <View className="gap-3">
    {groups.map((group) => (
      <View key={group.label} className="gap-2">
        <Text className="text-xs font-medium text-muted-foreground">{group.label}</Text>
        <PillSelect
          options={group.items.map((i) => ({ value: i.value, label: i.label }))}
          value={selected}
          onChange={(vals: string[]) => {
            const added = vals.find((v: string) => !selected.includes(v));
            const removed = selected.find((v) => !vals.includes(v));
            if (added) onToggle(added);
            if (removed) onToggle(removed);
          }}
          multiple
        />
      </View>
    ))}
  </View>
);


// Gallery hooks
const useGallery = (trainerId: string) => {
  const list = trpc.gallery.list.useQuery({ trainerId }, { enabled: !!trainerId });
  const add = trpc.gallery.add.useMutation();
  const remove = trpc.gallery.remove.useMutation();
  const reorder = trpc.gallery.reorder.useMutation();
  const utils = trpc.useUtils();
  const invalidate = () => utils.gallery.list.invalidate({ trainerId });
  return { images: list.data ?? [], isLoading: list.isLoading, add, remove, reorder, invalidate, refetch: list.refetch };
};

// Media Tab Component
const MediaTab = ({ profile, fields, update, uploading, setUploading, handlePickImage, getUploadParams, updateProfile }: any) => {
  const { showAlert } = useAlert();
  const gallery = useGallery(profile?.id ?? '');
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [videoUploading, setVideoUploading] = useState(false);
  const deleteFile = trpc.upload.deleteFile.useMutation();

  const handleCoverUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    setCoverUploading(true);
    const url = await uploadImage(result.assets[0].uri, 'cover', getUploadParams, showAlert);
    setCoverUploading(false);
    if (url) {
      update('coverImageUrl', url);
      await updateProfile.mutateAsync({ coverImageUrl: url });
      showAlert({ title: 'Success', message: 'Cover photo updated' });
    }
  };

  const handleGalleryAdd = async () => {
    if ((gallery.images as any[]).length >= 6) {
      showAlert({ title: 'Limit Reached', message: 'You can have up to 6 gallery images' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    setGalleryUploading(true);
    const url = await uploadImage(result.assets[0].uri, 'gallery', getUploadParams, showAlert);
    setGalleryUploading(false);
    if (url) {
      gallery.add.mutate(
        { url } as any,
        { onSuccess: () => gallery.invalidate(), onError: () => showAlert({ title: 'Error', message: 'Failed to add gallery image' }) },
      );
    }
  };

  const handleGalleryRemove = (imageId: string) => {
    showAlert({
      title: 'Remove Image',
      message: 'Remove this image from your gallery?',
      actions: [
        { label: 'Remove', variant: 'destructive', onPress: () => gallery.remove.mutate({ id: imageId } as any, { onSuccess: () => gallery.invalidate() }) },
        { label: 'Cancel', variant: 'outline' },
      ],
    });
  };

  const handleVideoUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    setVideoUploading(true);
    try {
      const params = await getUploadParams.mutateAsync({ type: 'video-intro' });
      const formData = new FormData();
      formData.append('file', { uri: result.assets[0].uri, type: 'video/mp4', name: 'video.mp4' } as any);
      formData.append('api_key', params.apiKey);
      formData.append('timestamp', String(params.timestamp));
      formData.append('signature', params.signature);
      formData.append('folder', params.folder);
      formData.append('resource_type', 'video');

      const res = await fetch(`https://api.cloudinary.com/v1_1/${params.cloudName}/video/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        await updateProfile.mutateAsync({ videoIntroUrl: data.secure_url });
        showAlert({ title: 'Success', message: 'Video intro uploaded' });
      } else {
        showAlert({ title: 'Error', message: 'Upload failed' });
      }
    } catch {
      showAlert({ title: 'Error', message: 'Failed to upload video' });
    } finally {
      setVideoUploading(false);
    }
  };

  const handleVideoRemove = async () => {
    const url = (profile as any)?.videoIntroUrl;
    if (!url) return;
    showAlert({
      title: 'Remove Video',
      message: 'Remove your video introduction?',
      actions: [
        { label: 'Remove', variant: 'destructive', onPress: async () => {
          try {
            await deleteFile.mutateAsync({ url, resourceType: 'video' });
            await updateProfile.mutateAsync({ videoIntroUrl: null });
          } catch {
            showAlert({ title: 'Error', message: 'Failed to remove video' });
          }
        }},
        { label: 'Cancel', variant: 'outline' },
      ],
    });
  };

  return (
    <>
      {/* Profile Photo */}
      <Card>
        <CardContent className="py-4 px-4 gap-3">
          <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Profile Photo</Text>
          <TouchableOpacity onPress={handlePickImage} disabled={uploading}>
            {fields.profileImageUrl ? (
              <Image source={{ uri: fields.profileImageUrl }} className="w-full h-48 rounded-lg" resizeMode="cover" />
            ) : (
              <View className="w-full h-48 rounded-lg bg-secondary items-center justify-center">
                <Camera size={32} color={colors.mutedForeground} />
                <Text className="text-sm text-muted-foreground mt-2">Tap to upload profile photo</Text>
              </View>
            )}
          </TouchableOpacity>
          {uploading && <Text className="text-sm text-teal text-center">Uploading...</Text>}
        </CardContent>
      </Card>

      {/* Cover Photo */}
      <Card>
        <CardContent className="py-4 px-4 gap-3">
          <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Cover Photo</Text>
          <TouchableOpacity onPress={handleCoverUpload} disabled={coverUploading}>
            {(fields.coverImageUrl || (profile as any)?.coverImageUrl) ? (
              <Image source={{ uri: fields.coverImageUrl || (profile as any)?.coverImageUrl }} className="w-full h-32 rounded-lg" resizeMode="cover" />
            ) : (
              <View className="w-full h-32 rounded-lg bg-secondary items-center justify-center">
                <Camera size={32} color={colors.mutedForeground} />
                <Text className="text-sm text-muted-foreground mt-2">Tap to upload cover photo (3:1)</Text>
              </View>
            )}
          </TouchableOpacity>
          {coverUploading && <Text className="text-sm text-teal text-center">Uploading...</Text>}
        </CardContent>
      </Card>

      {/* Gallery */}
      <Card>
        <CardContent className="py-4 px-4 gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>
              Gallery ({(gallery.images as any[]).length}/6)
            </Text>
            <TouchableOpacity onPress={handleGalleryAdd} disabled={galleryUploading}>
              <Text className="text-sm font-medium text-teal">+ Add</Text>
            </TouchableOpacity>
          </View>
          {galleryUploading && <Text className="text-sm text-teal text-center">Uploading...</Text>}
          {(gallery.images as any[]).length === 0 ? (
            <TouchableOpacity onPress={handleGalleryAdd} disabled={galleryUploading}>
              <View className="w-full h-32 rounded-lg bg-secondary items-center justify-center">
                <Camera size={32} color={colors.mutedForeground} />
                <Text className="text-sm text-muted-foreground mt-2">Add gallery images (up to 6)</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {(gallery.images as any[]).map((img: any) => (
                <View key={img.id} className="relative" style={{ width: '31%' }}>
                  <Image source={{ uri: img.url }} className="w-full rounded-lg" style={{ aspectRatio: 1 }} resizeMode="cover" />
                  <TouchableOpacity
                    className="absolute top-1 right-1 bg-black/60 rounded-full w-6 h-6 items-center justify-center"
                    onPress={() => handleGalleryRemove(img.id)}
                  >
                    <X size={14} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </CardContent>
      </Card>

      {/* Video Introduction */}
      <Card>
        <CardContent className="py-4 px-4 gap-3">
          <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Video Introduction</Text>
          {(profile as any)?.videoIntroUrl ? (
            <View className="gap-2">
              <View className="w-full h-48 rounded-lg bg-secondary items-center justify-center">
                <Text className="text-sm text-teal">Video uploaded</Text>
                <Text className="text-xs text-muted-foreground mt-1" numberOfLines={1}>{(profile as any).videoIntroUrl}</Text>
              </View>
              <View className="flex-row gap-2">
                <Button size="sm" variant="outline" onPress={handleVideoUpload} className="flex-1" loading={videoUploading}>
                  Replace Video
                </Button>
                <Button size="sm" variant="destructive" onPress={handleVideoRemove} className="flex-1">
                  Remove
                </Button>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={handleVideoUpload} disabled={videoUploading}>
              <View className="w-full h-32 rounded-lg bg-secondary items-center justify-center">
                <Camera size={32} color={colors.mutedForeground} />
                <Text className="text-sm text-muted-foreground mt-2">Tap to upload video intro</Text>
              </View>
            </TouchableOpacity>
          )}
          {videoUploading && <Text className="text-sm text-teal text-center">Uploading video...</Text>}
        </CardContent>
      </Card>
    </>
  );
};

// Upload helper
const uploadImage = async (uri: string, type: string, getUploadParams: any, showAlert?: (opts: any) => void) => {
  try {
    const params = await getUploadParams.mutateAsync({ type });
    const formData = new FormData();
    formData.append('file', { uri, type: 'image/jpeg', name: 'upload.jpg' } as any);
    formData.append('api_key', params.apiKey);
    formData.append('timestamp', String(params.timestamp));
    formData.append('signature', params.signature);
    formData.append('folder', params.folder);
    if (params.transformation) formData.append('transformation', params.transformation);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${params.cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    return data.secure_url as string;
  } catch (err: any) {
    showAlert?.({ title: 'Upload Failed', message: err.message ?? 'Failed to upload image' });
    return null;
  }
};

const TrainerProfileEdit = () => {
  const { showAlert } = useAlert();
  const { data: profile, isLoading } = useMyTrainerProfile();
  const updateProfile = useUpdateTrainerProfile();
  const publishProfile = trpc.trainer.publish.useMutation();
  const unpublishProfile = trpc.trainer.unpublish.useMutation();
  const getUploadParams = trpc.upload.getUploadParams.useMutation();
  const trpcUtils = trpc.useUtils();
  const [tab, setTab] = useState<TrainerTab>('basic');
  const [fields, setFields] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFields({
        displayName: profile.displayName ?? '',
        bio: profile.bio ?? '',
        city: profile.city ?? '',
        postcode: profile.postcode ?? '',
        addressLine1: (profile as any).addressLine1 ?? '',
        county: (profile as any).county ?? '',
        country: (profile as any).country ?? '',
        latitude: (profile as any).latitude ?? 0,
        longitude: (profile as any).longitude ?? 0,
        placeId: (profile as any).placeId ?? '',
        travelOption: (profile as any).travelOption ?? 'CLIENT_TRAVELS',
        services: (profile as any).services ?? [],
        qualifications: (profile as any).qualifications ?? [],
        hourlyRateMin: ((profile as any).hourlyRateMin ?? 0) / 100,
        hourlyRateMax: ((profile as any).hourlyRateMax ?? 0) / 100,
        acceptingClients: (profile as any).acceptingClients ?? true,
        profileImageUrl: profile.profileImageUrl ?? null,
      });
    }
  }, [profile]);

  const update = (key: string, value: any) => setFields((f) => ({ ...f, [key]: value }));
  const toggleArrayItem = (key: string, item: string) => {
    const current = fields[key] ?? [];
    update(key, current.includes(item) ? current.filter((x: string) => x !== item) : [...current, item]);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    const url = await uploadImage(result.assets[0].uri, 'profile', getUploadParams, showAlert);
    setUploading(false);

    if (url) {
      update('profileImageUrl', url);
      await updateProfile.mutateAsync({ profileImageUrl: url });
      showAlert({ title: 'Success', message: 'Profile photo updated' });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Only send schema-valid fields
      const payload: Record<string, any> = {
        displayName: fields.displayName || undefined,
        bio: fields.bio || undefined,
        addressLine1: fields.addressLine1 || undefined,
        city: fields.city || undefined,
        county: fields.county || undefined,
        postcode: fields.postcode || undefined,
        country: fields.country ? fields.country.substring(0, 2).toUpperCase() : undefined,
        placeId: fields.placeId || undefined,
        latitude: fields.latitude || undefined,
        longitude: fields.longitude || undefined,
        travelOption: fields.travelOption || undefined,
        services: fields.services,
        qualifications: fields.qualifications,
        acceptingClients: fields.acceptingClients,
        hourlyRateMin: Math.round((fields.hourlyRateMin ?? 0) * 100) || undefined,
        hourlyRateMax: Math.round((fields.hourlyRateMax ?? 0) * 100) || undefined,
        profileImageUrl: fields.profileImageUrl || undefined,
      };
      // Remove undefined values
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
      await updateProfile.mutateAsync(payload);
      showAlert({ title: 'Profile Updated', icon: <CheckIcon size={32} color={colors.teal} /> });
    } catch {
      showAlert({ title: 'Error', message: 'Failed to update profile', icon: <XCircle size={32} color={colors.destructive} /> });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return null;

  const TABS: { key: TrainerTab; label: string }[] = [
    { key: 'basic', label: 'Basic' },
    { key: 'location', label: 'Location' },
    { key: 'services', label: 'Services' },
    { key: 'media', label: 'Media' },
    { key: 'settings', label: 'Settings' },
  ];

  return (
    <>
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-4 pb-8">
        {tab === 'basic' && (
          <>
            {/* Avatar */}
            <View className="items-center mb-2">
              <TouchableOpacity onPress={handlePickImage} disabled={uploading}>
                <View className="relative">
                  {fields.profileImageUrl ? (
                    <Image source={{ uri: fields.profileImageUrl }} className="w-24 h-24 rounded-full" />
                  ) : (
                    <View className="w-24 h-24 rounded-full bg-secondary items-center justify-center">
                      <Text className="text-2xl font-bold text-foreground">
                        {(fields.displayName ?? '?').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View className="absolute bottom-0 right-0 bg-primary w-8 h-8 rounded-full items-center justify-center">
                    <Camera size={16} color="#fff" />
                  </View>
                </View>
              </TouchableOpacity>
              {uploading && <Text className="text-xs text-muted-foreground mt-2">Uploading...</Text>}
            </View>

            <Card>
              <CardContent className="py-4 px-4 gap-3">
                <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Basic Information</Text>
                <Text className="text-xs text-muted-foreground">Update your display name and bio. Your handle cannot be changed.</Text>
                {profile?.handle && (
                  <View className="bg-secondary rounded-lg px-3 py-2">
                    <Text className="text-xs text-muted-foreground">fitnassist.co/trainers/{profile.handle}</Text>
                  </View>
                )}
                <Input label="Display Name" value={fields.displayName} onChangeText={(v) => update('displayName', v)} />
                <Input label="Bio" value={fields.bio} onChangeText={(v) => update('bio', v)} multiline numberOfLines={6} style={{ minHeight: 120, textAlignVertical: 'top' }} />
                <Text className="text-xs text-muted-foreground">{(fields.bio ?? '').length}/2000 characters</Text>
              </CardContent>
            </Card>
          </>
        )}

        {tab === 'location' && (
          <>
            <Card>
              <CardContent className="py-4 px-4 gap-3">
                <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Location</Text>
                <AddressInput
                  currentAddress={{
                    addressLine1: fields.addressLine1,
                    city: fields.city,
                    county: fields.county,
                    postcode: fields.postcode,
                  }}
                  onSelect={(addr) => {
                    update('addressLine1', addr.addressLine1);
                    update('city', addr.city);
                    update('county', addr.county);
                    update('postcode', addr.postcode);
                    update('country', addr.country);
                    update('latitude', addr.latitude);
                    update('longitude', addr.longitude);
                    update('placeId', addr.placeId);
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4 px-4 gap-3">
                <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Training Location Preference</Text>
                {TRAVEL_OPTIONS.map(({ value, label }) => (
                  <TouchableOpacity
                    key={value}
                    className={`px-3 py-3 rounded-lg border ${fields.travelOption === value ? 'border-teal bg-teal/10' : 'border-border'}`}
                    onPress={() => update('travelOption', value)}
                  >
                    <Text className={`text-sm ${fields.travelOption === value ? 'text-teal font-medium' : 'text-foreground'}`}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </CardContent>
            </Card>
          </>
        )}

        {tab === 'services' && (
          <>
            <Card>
              <CardContent className="py-4 px-4 gap-3">
                <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>
                  Services & Specializations
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Select the services you offer to clients
                </Text>
                <GroupedChipSelect
                  groups={SERVICE_GROUPS}
                  selected={fields.services ?? []}
                  onToggle={(s) => toggleArrayItem('services', s)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4 px-4 gap-3">
                <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>
                  Qualifications & Certifications
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Select your professional qualifications
                </Text>
                <GroupedChipSelect
                  groups={QUAL_GROUPS}
                  selected={fields.qualifications ?? []}
                  onToggle={(q) => toggleArrayItem('qualifications', q)}
                />
              </CardContent>
            </Card>
          </>
        )}

        {tab === 'media' && (
          <MediaTab
            profile={profile}
            fields={fields}
            update={update}
            uploading={uploading}
            setUploading={setUploading}
            handlePickImage={handlePickImage}
            getUploadParams={getUploadParams}
            updateProfile={updateProfile}
          />
        )}

        {tab === 'settings' && (
          <>
            {/* Profile Visibility */}
            <Card>
              <CardContent className="py-4 px-4 gap-3">
                <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Profile Visibility</Text>
                <View className="flex-row items-center justify-between py-2">
                  <View className="flex-1 gap-1">
                    <Text className="text-sm font-medium text-foreground">
                      {(profile as any)?.isPublished ? 'Published' : 'Unpublished'}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      {(profile as any)?.isPublished
                        ? 'Your profile is visible to potential clients in search results'
                        : 'Your profile is hidden from search results. Publish it when ready.'}
                    </Text>
                  </View>
                  <Switch
                    value={(profile as any)?.isPublished ?? false}
                    onValueChange={async (v) => {
                      try {
                        if (v) {
                          await publishProfile.mutateAsync();
                        } else {
                          await unpublishProfile.mutateAsync();
                        }
                        trpcUtils.trainer.getMyProfile.invalidate();
                      } catch {
                        showAlert({ title: 'Error', message: v ? 'Failed to publish profile' : 'Failed to unpublish profile' });
                      }
                    }}
                    trackColor={{ false: colors.muted, true: colors.teal }}
                    thumbColor="#fff"
                  />
                </View>
              </CardContent>
            </Card>

            {/* Client Availability */}
            <Card>
              <CardContent className="py-4 px-4 gap-3">
                <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Client Availability</Text>
                <View className="flex-row items-center justify-between py-2">
                  <View className="flex-1 gap-1">
                    <Text className="text-sm font-medium text-foreground">
                      {fields.acceptingClients ? 'Accepting Clients' : 'Not Accepting Clients'}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      {fields.acceptingClients
                        ? 'New clients can send you connection requests'
                        : 'Your profile shows you are not currently accepting new clients'}
                    </Text>
                  </View>
                  <Switch
                    value={fields.acceptingClients}
                    onValueChange={(v) => update('acceptingClients', v)}
                    trackColor={{ false: colors.muted, true: colors.teal }}
                    thumbColor="#fff"
                  />
                </View>
              </CardContent>
            </Card>

            {/* Hourly Rate */}
            <Card>
              <CardContent className="py-4 px-4 gap-3">
                <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Hourly Rate</Text>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Input
                      label="Min (£)"
                      value={String(fields.hourlyRateMin ?? '')}
                      onChangeText={(v) => update('hourlyRateMin', parseFloat(v) || 0)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View className="flex-1">
                    <Input
                      label="Max (£)"
                      value={String(fields.hourlyRateMax ?? '')}
                      onChangeText={(v) => update('hourlyRateMax', parseFloat(v) || 0)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </CardContent>
            </Card>

            {/* Profile URL */}
            {profile?.handle && (
              <Card>
                <CardContent className="py-4 px-4 gap-2">
                  <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Profile URL</Text>
                  <View className="bg-secondary rounded-lg px-3 py-2.5">
                    <Text className="text-sm text-foreground" selectable>fitnassist.co/trainers/{profile.handle}</Text>
                  </View>
                  <Text className="text-xs text-muted-foreground">Share this link with potential clients</Text>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <Button onPress={handleSave} loading={saving}>Save Changes</Button>
      </ScrollView>
    </>
  );
};

// ===== PRIVACY TAB =====
const VISIBILITY_OPTIONS = [
  { value: 'ONLY_ME', label: 'Only Me' },
  { value: 'MY_PT', label: 'My PT' },
  { value: 'PT_AND_FRIENDS', label: 'PT & Friends' },
  { value: 'EVERYONE', label: 'Everyone' },
];

const PROFILE_SETTINGS = [
  { key: 'privacyBio', label: 'Bio & About', desc: 'Your bio, fitness goals, experience level' },
  { key: 'privacyLocation', label: 'Location', desc: 'Your city and general area' },
  { key: 'privacyBodyMetrics', label: 'Body Metrics', desc: 'Height, start weight, goal weight' },
  { key: 'privacyGoals', label: 'Goals', desc: 'Active and completed goals' },
  { key: 'privacyPersonalBests', label: 'Personal Bests', desc: 'Your personal best achievements' },
  { key: 'privacyProgressPhotos', label: 'Progress Photos', desc: 'Your progress photos' },
  { key: 'privacyStats', label: 'Stats', desc: 'Goal and personal best counts' },
  { key: 'privacyBadges', label: 'Badges', desc: 'Showcase badges on your profile' },
  { key: 'privacyFriendCount', label: 'Friend Count', desc: 'Whether others see your friend count' },
];

const TREND_SETTINGS = [
  { key: 'privacyTrendWeight', label: 'Weight' },
  { key: 'privacyTrendMeasurements', label: 'Measurements' },
  { key: 'privacyTrendNutrition', label: 'Nutrition' },
  { key: 'privacyTrendWater', label: 'Water' },
  { key: 'privacyTrendMood', label: 'Mood' },
  { key: 'privacyTrendSleep', label: 'Sleep' },
  { key: 'privacyTrendActivity', label: 'Activity' },
  { key: 'privacyTrendSteps', label: 'Steps' },
];

const PrivacyRow = ({ label, desc, value, onChange }: { label: string; desc?: string; value: string; onChange: (v: string) => void }) => (
  <View className="py-3 border-b border-border gap-2">
    <View className="gap-0.5">
      <Text className="text-sm text-foreground">{label}</Text>
      {desc && <Text className="text-xs text-muted-foreground">{desc}</Text>}
    </View>
    <View className="flex-row gap-1">
      {VISIBILITY_OPTIONS.map(({ value: v, label: l }) => (
        <TouchableOpacity
          key={v}
          className={`flex-1 items-center py-1.5 rounded-lg border ${value === v ? 'border-teal bg-teal/10' : 'border-border'}`}
          onPress={() => onChange(v)}
        >
          <Text className={`text-[10px] ${value === v ? 'text-teal' : 'text-muted-foreground'}`}>{l}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const PrivacyTabContent = ({ privacySettings, onChangePrivacy }: { privacySettings: Record<string, string>; onChangePrivacy: (s: Record<string, string>) => void }) => {
  const setVal = (key: string, value: string) => onChangePrivacy({ ...privacySettings, [key]: value });

  return (
    <>
      <Card>
        <CardContent className="py-4 px-4 gap-1">
          <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Profile Sections</Text>
          <Text className="text-xs text-muted-foreground mb-1">Control who can see different parts of your profile.</Text>
          {PROFILE_SETTINGS.map(({ key, label, desc }) => (
            <PrivacyRow key={key} label={label} desc={desc} value={privacySettings[key] ?? 'ONLY_ME'} onChange={(v) => setVal(key, v)} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4 px-4 gap-1">
          <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Trend Charts</Text>
          <Text className="text-xs text-muted-foreground mb-1">Control who can see each type of trend data on your profile.</Text>
          {TREND_SETTINGS.map(({ key, label }) => (
            <PrivacyRow key={key} label={label} value={privacySettings[key] ?? 'ONLY_ME'} onChange={(v) => setVal(key, v)} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4 px-4">
          <Text className="text-xs text-muted-foreground">
            Medical Notes are only visible to your connected personal trainer and are never shown publicly.
          </Text>
        </CardContent>
      </Card>
    </>
  );
};

// ===== NUTRITION TAB =====
const NutritionTabContent = ({ fields, update, profile }: { fields: Record<string, any>; update: (k: string, v: any) => void; profile: any }) => {
  const [useManual, setUseManual] = useState(fields.dailyCalorieTarget != null && fields.dailyCalorieTarget !== '');

  const missingFields = !profile?.startWeightKg || !profile?.heightCm || !profile?.dateOfBirth || !profile?.gender || !profile?.activityLevel;

  let calculated: { calories: number; proteinG: number; carbsG: number; fatG: number } | null = null;
  if (!missingFields) {
    try {
      const { calculateNutritionTargets } = require('@fitnassist/utils');
      calculated = calculateNutritionTargets({
        ...profile,
        currentWeightKg: profile.startWeightKg,
      });
    } catch {}
  }

  return (
    <>
      <Card>
        <CardContent className="py-4 px-4 gap-3">
          <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Nutrition Targets</Text>
          <Text className="text-xs text-muted-foreground">
            Set your weekly weight goal and daily nutrition targets. Targets are auto-calculated from your profile, or you can set them manually.
          </Text>

          {/* Weekly Weight Goal */}
          <Text className="text-xs font-medium text-foreground">Weekly Weight Goal</Text>
          <View className="flex-row flex-wrap gap-1">
            {[
              { value: -1.0, label: 'Lose 1kg' },
              { value: -0.5, label: 'Lose 0.5kg' },
              { value: -0.25, label: 'Lose 0.25kg' },
              { value: 0, label: 'Maintain' },
              { value: 0.25, label: 'Gain 0.25kg' },
              { value: 0.5, label: 'Gain 0.5kg' },
            ].map(({ value, label }) => (
              <TouchableOpacity
                key={value}
                className={`px-3 py-2 rounded-lg border ${fields.weeklyWeightGoalKg === value ? 'border-teal bg-teal/10' : 'border-border'}`}
                onPress={() => update('weeklyWeightGoalKg', value)}
              >
                <Text className={`text-xs ${fields.weeklyWeightGoalKg === value ? 'text-teal' : 'text-muted-foreground'}`}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </CardContent>
      </Card>

      {/* Calculated targets */}
      {missingFields ? (
        <Card>
          <CardContent className="py-4 px-4">
            <Text className="text-sm text-muted-foreground text-center">
              Fill in your weight, height, date of birth, gender, and activity level in the Body and Personal tabs to auto-calculate your targets.
            </Text>
          </CardContent>
        </Card>
      ) : calculated ? (
        <Card>
          <CardContent className="py-4 px-4 gap-2">
            <Text className="text-xs font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Calculated Daily Targets</Text>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-lg font-bold text-foreground">{calculated.calories}</Text>
                <Text className="text-xs text-muted-foreground">kcal</Text>
              </View>
              <View className="items-center">
                <Text className="text-lg font-bold text-foreground">{calculated.proteinG}g</Text>
                <Text className="text-xs text-muted-foreground">Protein</Text>
              </View>
              <View className="items-center">
                <Text className="text-lg font-bold text-foreground">{calculated.carbsG}g</Text>
                <Text className="text-xs text-muted-foreground">Carbs</Text>
              </View>
              <View className="items-center">
                <Text className="text-lg font-bold text-foreground">{calculated.fatG}g</Text>
                <Text className="text-xs text-muted-foreground">Fat</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      ) : null}

      {/* Manual override */}
      <Card>
        <CardContent className="py-4 px-4 gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-foreground">Set custom targets manually</Text>
            <Switch value={useManual} onValueChange={setUseManual} trackColor={{ false: colors.muted, true: colors.teal }} thumbColor="#fff" />
          </View>

          {useManual && (
            <View className="gap-3">
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Input label="Calories (kcal)" value={String(fields.dailyCalorieTarget ?? '')} onChangeText={(v) => update('dailyCalorieTarget', v)} keyboardType="numeric" placeholder={calculated ? String(calculated.calories) : '2000'} />
                </View>
                <View className="flex-1">
                  <Input label="Protein (g)" value={String(fields.dailyProteinTargetG ?? '')} onChangeText={(v) => update('dailyProteinTargetG', v)} keyboardType="numeric" placeholder={calculated ? String(calculated.proteinG) : '150'} />
                </View>
              </View>
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Input label="Carbs (g)" value={String(fields.dailyCarbsTargetG ?? '')} onChangeText={(v) => update('dailyCarbsTargetG', v)} keyboardType="numeric" placeholder={calculated ? String(calculated.carbsG) : '200'} />
                </View>
                <View className="flex-1">
                  <Input label="Fat (g)" value={String(fields.dailyFatTargetG ?? '')} onChangeText={(v) => update('dailyFatTargetG', v)} keyboardType="numeric" placeholder={calculated ? String(calculated.fatG) : '65'} />
                </View>
              </View>
            </View>
          )}
        </CardContent>
      </Card>

      {/* Water */}
      <Card>
        <CardContent className="py-4 px-4 gap-3">
          <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Daily Water Target</Text>
          <Input label="Water (ml)" value={String(fields.dailyWaterTargetMl ?? '')} onChangeText={(v) => update('dailyWaterTargetMl', v)} keyboardType="numeric" placeholder="2500" />
        </CardContent>
      </Card>
    </>
  );
};

const TraineeProfileEdit = () => {
  const { showAlert } = useAlert();
  const { data: profile, isLoading } = useMyTraineeProfile();
  const updateProfile = useUpdateTraineeProfile();
  const setHandle = trpc.trainee.setHandle.useMutation();
  const updatePrivacy = trpc.trainee.updatePrivacySettings.useMutation();
  const { data: privacyData } = trpc.trainee.getPrivacySettings.useQuery();
  const getUploadParams = trpc.upload.getUploadParams.useMutation();
  const [tab, setTab] = useState<TraineeTab>('personal');
  const [fields, setFields] = useState<Record<string, any>>({});
  const [handleQuery, setHandleQuery] = useState('');
  const { data: handleCheck, isLoading: checkingHandle } = trpc.trainee.checkHandleAvailability.useQuery(
    { handle: handleQuery },
    { enabled: handleQuery.length >= 3 && handleQuery !== (profile as any)?.handle },
  );
  const [privacyLocal, setPrivacyLocal] = useState<Record<string, string>>({});
  const [privacyInitialized, setPrivacyInitialized] = useState(false);

  // Init privacy from fetched data
  if (privacyData && !privacyInitialized) {
    const s: Record<string, string> = {};
    for (const key of [...PROFILE_SETTINGS, ...TREND_SETTINGS].map((x) => x.key)) {
      s[key] = (privacyData as any)?.[key] ?? 'ONLY_ME';
    }
    setPrivacyLocal(s);
    setPrivacyInitialized(true);
  }
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFields({
        avatarUrl: (profile as any).avatarUrl ?? null,
        handle: (profile as any).handle ?? '',
        bio: (profile as any).bio ?? '',
        dateOfBirth: (profile as any).dateOfBirth
          ? (typeof (profile as any).dateOfBirth === 'string'
            ? (profile as any).dateOfBirth.split('T')[0]
            : new Date((profile as any).dateOfBirth).toISOString().split('T')[0])
          : '',
        gender: (profile as any).gender ?? '',
        addressLine1: (profile as any).addressLine1 ?? '',
        addressLine2: (profile as any).addressLine2 ?? '',
        city: (profile as any).city ?? '',
        county: (profile as any).county ?? '',
        postcode: (profile as any).postcode ?? '',
        country: (profile as any).country ?? 'GB',
        placeId: (profile as any).placeId ?? '',
        latitude: (profile as any).latitude ?? null,
        longitude: (profile as any).longitude ?? null,
        heightCm: (profile as any).heightCm ?? '',
        startWeightKg: (profile as any).startWeightKg ?? '',
        goalWeightKg: (profile as any).goalWeightKg ?? '',
        unitPreference: (profile as any).unitPreference ?? 'METRIC',
        experienceLevel: (profile as any).experienceLevel ?? '',
        activityLevel: (profile as any).activityLevel ?? '',
        fitnessGoals: (profile as any).fitnessGoals ?? [],
        fitnessGoalNotes: (profile as any).fitnessGoalNotes ?? '',
        medicalNotes: (profile as any).medicalNotes ?? '',
        dailyCalorieTarget: (profile as any).dailyCalorieTarget ?? '',
        dailyProteinTargetG: (profile as any).dailyProteinTargetG ?? '',
        dailyCarbsTargetG: (profile as any).dailyCarbsTargetG ?? '',
        dailyFatTargetG: (profile as any).dailyFatTargetG ?? '',
        dailyWaterTargetMl: (profile as any).dailyWaterTargetMl ?? '',
      });
    }
  }, [profile]);

  const update = (key: string, value: any) => setFields((f) => ({ ...f, [key]: value }));

  // Debounce handle availability check
  useEffect(() => {
    const t = setTimeout(() => setHandleQuery(fields.handle ?? ''), 500);
    return () => clearTimeout(t);
  }, [fields.handle]);

  const toggleGoal = (g: string) => {
    const current = fields.fitnessGoals ?? [];
    update('fitnessGoals', current.includes(g) ? current.filter((x: string) => x !== g) : [...current, g]);
  };

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    const url = await uploadImage(result.assets[0].uri, 'profile', getUploadParams, showAlert);
    setUploading(false);

    if (url) {
      update('avatarUrl', url);
      await updateProfile.mutateAsync({ avatarUrl: url });
      showAlert({ title: 'Success', message: 'Avatar updated' });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { handle, ...rest } = fields;
      const data: Record<string, any> = { ...rest };
      for (const key of ['heightCm', 'startWeightKg', 'goalWeightKg', 'dailyCalorieTarget', 'dailyProteinTargetG', 'dailyCarbsTargetG', 'dailyFatTargetG', 'dailyWaterTargetMl']) {
        if (data[key] !== '' && data[key] != null) data[key] = parseFloat(data[key]);
        else delete data[key];
      }
      const promises: Promise<any>[] = [updateProfile.mutateAsync(data)];
      // Handle is a separate endpoint
      const originalHandle = (profile as any)?.handle ?? '';
      if (handle && handle !== originalHandle) {
        promises.push(setHandle.mutateAsync({ handle }));
      }
      if (Object.keys(privacyLocal).length > 0) {
        promises.push(updatePrivacy.mutateAsync(privacyLocal as any));
      }
      await Promise.all(promises);
      showAlert({ title: 'Profile Updated', icon: <CheckIcon size={32} color={colors.teal} /> });
    } catch (err: any) {
      showAlert({ title: 'Error', message: err?.message ?? 'Failed to update profile', icon: <XCircle size={32} color={colors.destructive} /> });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return null;

  const TABS: { key: TraineeTab; label: string }[] = [
    { key: 'personal', label: 'Personal' },
    { key: 'body', label: 'Body' },
    { key: 'fitness', label: 'Fitness' },
    { key: 'nutrition', label: 'Nutrition' },
    { key: 'privacy', label: 'Privacy' },
  ];

  return (
    <>
      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-4 pb-8">
        {tab === 'personal' && (
          <>
            {/* Avatar */}
            <View className="items-center mb-2">
              <TouchableOpacity onPress={handlePickAvatar} disabled={uploading}>
                <View className="relative">
                  {fields.avatarUrl ? (
                    <Image source={{ uri: fields.avatarUrl }} className="w-24 h-24 rounded-full" />
                  ) : (
                    <View className="w-24 h-24 rounded-full bg-secondary items-center justify-center">
                      <Camera size={24} color={colors.mutedForeground} />
                    </View>
                  )}
                  <View className="absolute bottom-0 right-0 bg-primary w-8 h-8 rounded-full items-center justify-center">
                    <Camera size={16} color="#fff" />
                  </View>
                </View>
              </TouchableOpacity>
              {uploading && <Text className="text-xs text-muted-foreground mt-2">Uploading...</Text>}
            </View>

            {/* Handle */}
            <Card>
              <CardContent className="py-4 px-4 gap-2">
                <Text className="text-sm font-medium text-primary uppercase" style={{ letterSpacing: 1 }}>Handle</Text>
                <Text className="text-xs text-muted-foreground">Your unique public profile URL. Lowercase letters, numbers, hyphens and underscores only.</Text>
                <View className="flex-row items-center h-12 bg-card border border-border rounded-lg px-3 gap-2">
                  <Text className="text-sm text-muted-foreground">@</Text>
                  <TextInput
                    value={fields.handle ?? ''}
                    onChangeText={(v) => update('handle', v.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    placeholder="your-handle"
                    placeholderTextColor={colors.mutedForeground}
                    style={{ flex: 1, fontSize: 14, color: colors.foreground, padding: 0 }}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {(fields.handle?.length ?? 0) >= 3 && fields.handle !== (profile as any)?.handle && (
                    checkingHandle ? null :
                    (handleCheck as any)?.available
                      ? <CheckIcon size={16} color={colors.teal} />
                      : <XCircle size={16} color="#ef4444" />
                  )}
                </View>
                {(handleCheck as any)?.available === false && fields.handle !== (profile as any)?.handle && (
                  <Text className="text-xs text-destructive">{(handleCheck as any)?.reason ?? 'Handle not available'}</Text>
                )}
                {fields.handle && (handleCheck as any)?.available && (
                  <Text className="text-xs text-muted-foreground">fitnassist.co/users/{fields.handle}</Text>
                )}
              </CardContent>
            </Card>

            {/* Personal info */}
            <Card>
              <CardContent className="py-4 px-4 gap-3">
                <Text className="text-sm font-medium text-primary uppercase" style={{ letterSpacing: 1 }}>Personal Info</Text>
                <Input label="Bio" value={fields.bio} onChangeText={(v) => update('bio', v)} multiline numberOfLines={3} />
                <DatePicker
                  label="Date of Birth"
                  value={fields.dateOfBirth ?? ''}
                  onChange={(v) => update('dateOfBirth', v)}
                  maxDate={new Date()}
                  placeholder="Select date of birth"
                />
                <Text className="text-sm font-medium text-foreground">Gender</Text>
                <PillSelect options={GENDERS} value={fields.gender ?? ''} onChange={(v: string) => update('gender', v)} />
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardContent className="py-4 px-4 gap-3">
                <Text className="text-sm font-medium text-primary uppercase" style={{ letterSpacing: 1 }}>Address</Text>
                <AddressInput
                  currentAddress={{
                    addressLine1: fields.addressLine1,
                    city: fields.city,
                    county: fields.county,
                    postcode: fields.postcode,
                  }}
                  onSelect={(addr: AddressResult) => {
                    update('addressLine1', addr.addressLine1);
                    update('addressLine2', addr.addressLine2 ?? '');
                    update('city', addr.city);
                    update('county', addr.county);
                    update('postcode', addr.postcode);
                    update('country', addr.country);
                    update('latitude', addr.latitude);
                    update('longitude', addr.longitude);
                    update('placeId', addr.placeId);
                  }}
                />
                <Text className="text-xs text-muted-foreground">Your full address is private. Only your postcode area is shown publicly.</Text>
              </CardContent>
            </Card>
          </>
        )}

        {tab === 'body' && (
          <Card>
            <CardContent className="py-4 px-4 gap-3">
              <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Body Metrics</Text>
              <View className="flex-row items-center justify-between py-2">
                <Text className="text-sm text-foreground">Unit Preference</Text>
                <View className="flex-row gap-1 bg-card border border-border rounded-lg p-1">
                  <TouchableOpacity
                    className={`px-3 py-1 rounded-md ${fields.unitPreference === 'METRIC' ? 'bg-teal' : ''}`}
                    onPress={() => update('unitPreference', 'METRIC')}
                  >
                    <Text className={`text-xs ${fields.unitPreference === 'METRIC' ? 'text-teal-foreground' : 'text-muted-foreground'}`}>Metric</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`px-3 py-1 rounded-md ${fields.unitPreference === 'IMPERIAL' ? 'bg-teal' : ''}`}
                    onPress={() => update('unitPreference', 'IMPERIAL')}
                  >
                    <Text className={`text-xs ${fields.unitPreference === 'IMPERIAL' ? 'text-teal-foreground' : 'text-muted-foreground'}`}>Imperial</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Input label={fields.unitPreference === 'METRIC' ? 'Height (cm)' : 'Height (inches)'} value={String(fields.heightCm ?? '')} onChangeText={(v) => update('heightCm', v)} keyboardType="numeric" />
              <Input label={fields.unitPreference === 'METRIC' ? 'Start Weight (kg)' : 'Start Weight (lbs)'} value={String(fields.startWeightKg ?? '')} onChangeText={(v) => update('startWeightKg', v)} keyboardType="numeric" />
              <Input label={fields.unitPreference === 'METRIC' ? 'Goal Weight (kg)' : 'Goal Weight (lbs)'} value={String(fields.goalWeightKg ?? '')} onChangeText={(v) => update('goalWeightKg', v)} keyboardType="numeric" />
            </CardContent>
          </Card>
        )}

        {tab === 'fitness' && (
          <Card>
            <CardContent className="py-4 px-4 gap-4">
              <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Experience Level</Text>
              <PillSelect
                options={EXPERIENCE_LEVELS}
                value={fields.experienceLevel ?? ''}
                onChange={(v: string) => update('experienceLevel', v)}
              />
              <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Activity Level</Text>
              <PillSelect
                options={ACTIVITY_LEVELS}
                value={fields.activityLevel ?? ''}
                onChange={(v: string) => update('activityLevel', v)}
              />
              <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Fitness Goals</Text>
              <PillSelect options={FITNESS_GOALS} value={fields.fitnessGoals ?? []} onChange={(v: string[]) => update('fitnessGoals', v)} multiple />
              <Input label="Goal Notes" value={fields.fitnessGoalNotes} onChangeText={(v) => update('fitnessGoalNotes', v)} multiline />
              <Input label="Medical Notes" value={fields.medicalNotes} onChangeText={(v) => update('medicalNotes', v)} multiline />
            </CardContent>
          </Card>
        )}

        {tab === 'nutrition' && (
          <NutritionTabContent fields={fields} update={update} profile={profile} />
        )}

        {tab === 'privacy' && <PrivacyTabContent privacySettings={privacyLocal} onChangePrivacy={setPrivacyLocal} />}

        <Button onPress={handleSave} loading={saving}>Save Changes</Button>
      </ScrollView>
    </>
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
