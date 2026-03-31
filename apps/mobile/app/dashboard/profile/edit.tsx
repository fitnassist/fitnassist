import { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, Alert, Image, Switch, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, Check, X, MapPin } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import { Text, Button, Input, Card, CardContent } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useMyTrainerProfile, useUpdateTrainerProfile } from '@/api/trainer';
import { useMyTraineeProfile, useUpdateTraineeProfile } from '@/api/trainee';
import { trpc } from '@/lib/trpc';
import {
  TRAINER_SERVICES as SERVICES_DATA,
  TRAINER_QUALIFICATIONS as QUALS_DATA,
} from '@fitnassist/schemas';
import { colors } from '@/constants/theme';

type TrainerTab = 'basic' | 'location' | 'services' | 'media' | 'settings';
type TraineeTab = 'personal' | 'body' | 'fitness' | 'nutrition' | 'privacy';

const apiUrl = Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:3001';
const GOOGLE_API_KEY = '***REDACTED***';

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

const ChipSelect = ({ options, selected, onToggle }: {
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
}) => (
  <View className="flex-row flex-wrap gap-2">
    {options.map((opt) => {
      const active = selected.includes(opt);
      return (
        <TouchableOpacity
          key={opt}
          className={`px-3 py-2 rounded-lg border ${active ? 'border-teal bg-teal/10' : 'border-border'}`}
          onPress={() => onToggle(opt)}
        >
          <Text className={`text-xs font-medium ${active ? 'text-teal' : 'text-muted-foreground'}`}>
            {opt.replace(/-/g, ' ').replace(/_/g, ' ')}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const GroupedChipSelect = ({ groups, selected, onToggle }: {
  groups: { label: string; items: readonly { value: string; label: string }[] }[];
  selected: string[];
  onToggle: (val: string) => void;
}) => (
  <View className="gap-3">
    {groups.map((group) => (
      <View key={group.label} className="gap-2">
        <Text className="text-xs font-medium text-muted-foreground">{group.label}</Text>
        <View className="flex-row flex-wrap gap-2">
          {group.items.map((item) => {
            const active = selected.includes(item.value);
            return (
              <TouchableOpacity
                key={item.value}
                className={`px-3 py-2 rounded-lg border ${active ? 'border-teal bg-teal/10' : 'border-border'}`}
                onPress={() => onToggle(item.value)}
              >
                <Text className={`text-xs font-medium ${active ? 'text-teal' : 'text-muted-foreground'}`}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    ))}
  </View>
);

// Address component matching web - autocomplete or manual entry toggle
const AddressAutocomplete = ({ currentAddress, onSelect }: {
  currentAddress: { addressLine1?: string; city?: string; county?: string; postcode?: string; country?: string };
  onSelect: (address: { addressLine1: string; addressLine2?: string; city: string; county: string; postcode: string; country: string; latitude: number; longitude: number; placeId: string }) => void;
}) => {
  const [isManual, setIsManual] = useState(false);
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [manual, setManual] = useState({
    addressLine1: currentAddress.addressLine1 ?? '',
    addressLine2: '',
    city: currentAddress.city ?? '',
    county: currentAddress.county ?? '',
    postcode: currentAddress.postcode ?? '',
  });

  const searchPlaces = useCallback(async (text: string) => {
    if (text.length < 3) { setPredictions([]); return; }
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&components=country:gb&key=${GOOGLE_API_KEY}`
      );
      const data = await res.json();
      setPredictions(data.predictions ?? []);
      setShowPredictions(true);
    } catch {
      setPredictions([]);
    }
  }, []);

  const selectPlace = async (placeId: string) => {
    setShowPredictions(false);
    setQuery('');
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=address_components,geometry&key=${GOOGLE_API_KEY}`
      );
      const data = await res.json();
      const result = data.result;
      if (!result) return;

      const get = (type: string) => result.address_components?.find((c: any) => c.types.includes(type))?.long_name ?? '';

      onSelect({
        addressLine1: `${get('street_number')} ${get('route')}`.trim(),
        city: get('postal_town') || get('locality'),
        county: get('administrative_area_level_2'),
        postcode: get('postal_code'),
        country: get('country'),
        latitude: result.geometry?.location?.lat ?? 0,
        longitude: result.geometry?.location?.lng ?? 0,
        placeId,
      });
    } catch {
      Alert.alert('Error', 'Failed to get address details');
    }
  };

  const handleManualConfirm = () => {
    if (!manual.addressLine1 || !manual.city || !manual.postcode) {
      Alert.alert('Error', 'Address line 1, city, and postcode are required');
      return;
    }
    onSelect({
      addressLine1: manual.addressLine1,
      addressLine2: manual.addressLine2,
      city: manual.city,
      county: manual.county,
      postcode: manual.postcode,
      country: 'GB',
      latitude: 0,
      longitude: 0,
      placeId: '',
    });
    setIsManual(false);
  };

  if (isManual) {
    return (
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-medium text-foreground">Manual Entry</Text>
          <TouchableOpacity onPress={() => setIsManual(false)}>
            <Text className="text-sm text-teal">Use address lookup</Text>
          </TouchableOpacity>
        </View>
        <Input label="Address Line 1 *" value={manual.addressLine1} onChangeText={(v) => setManual((m) => ({ ...m, addressLine1: v }))} placeholder="e.g. 123 High Street" />
        <Input label="Address Line 2" value={manual.addressLine2} onChangeText={(v) => setManual((m) => ({ ...m, addressLine2: v }))} placeholder="e.g. Flat 4" />
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Input label="City *" value={manual.city} onChangeText={(v) => setManual((m) => ({ ...m, city: v }))} placeholder="e.g. London" />
          </View>
          <View className="flex-1">
            <Input label="County" value={manual.county} onChangeText={(v) => setManual((m) => ({ ...m, county: v }))} placeholder="e.g. Greater London" />
          </View>
        </View>
        <Input label="Postcode *" value={manual.postcode} onChangeText={(v) => setManual((m) => ({ ...m, postcode: v.toUpperCase() }))} placeholder="e.g. SW1A 1AA" />
        <Button size="sm" variant="outline" onPress={handleManualConfirm}>Confirm Address</Button>
      </View>
    );
  }

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-medium text-foreground">Address</Text>
        <TouchableOpacity onPress={() => setIsManual(true)}>
          <Text className="text-sm text-teal">Enter manually</Text>
        </TouchableOpacity>
      </View>
      <View className="flex-row items-center bg-card border border-border rounded-lg px-3">
        <MapPin size={16} color={colors.mutedForeground} />
        <View className="flex-1">
          <Input
            value={query}
            onChangeText={(t) => { setQuery(t); searchPlaces(t); }}
            placeholder="Start typing your address..."
            className="border-0"
          />
        </View>
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setPredictions([]); setShowPredictions(false); }}>
            <X size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>
      {showPredictions && predictions.length > 0 && (
        <View className="bg-card border border-border rounded-lg max-h-48">
          {predictions.map((p: any) => (
            <TouchableOpacity
              key={p.place_id}
              className="px-3 py-2.5 border-b border-border"
              onPress={() => selectPlace(p.place_id)}
            >
              <Text className="text-sm text-foreground" numberOfLines={1}>{p.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Show confirmed address */}
      {currentAddress.addressLine1 && !query && (
        <View className="bg-secondary rounded-lg p-3 gap-0.5">
          <Text className="text-sm font-medium text-foreground">{currentAddress.addressLine1}</Text>
          <Text className="text-xs text-muted-foreground">
            {[currentAddress.city, currentAddress.county, currentAddress.postcode].filter(Boolean).join(', ')}
          </Text>
        </View>
      )}

      <Text className="text-xs text-muted-foreground">
        Your full address is private. Only your postcode area will be shown publicly on the map.
      </Text>
    </View>
  );
};

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
    const url = await uploadImage(result.assets[0].uri, 'cover', getUploadParams);
    setCoverUploading(false);
    if (url) {
      update('coverImageUrl', url);
      await updateProfile.mutateAsync({ coverImageUrl: url });
      Alert.alert('Success', 'Cover photo updated');
    }
  };

  const handleGalleryAdd = async () => {
    if ((gallery.images as any[]).length >= 6) {
      Alert.alert('Limit Reached', 'You can have up to 6 gallery images');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    setGalleryUploading(true);
    const url = await uploadImage(result.assets[0].uri, 'gallery', getUploadParams);
    setGalleryUploading(false);
    if (url) {
      gallery.add.mutate(
        { url } as any,
        { onSuccess: () => gallery.invalidate(), onError: () => Alert.alert('Error', 'Failed to add gallery image') },
      );
    }
  };

  const handleGalleryRemove = (imageId: string) => {
    Alert.alert('Remove Image', 'Remove this image from your gallery?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => gallery.remove.mutate(
          { id: imageId } as any,
          { onSuccess: () => gallery.invalidate() },
        ),
      },
    ]);
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
        Alert.alert('Success', 'Video intro uploaded');
      } else {
        Alert.alert('Error', 'Upload failed');
      }
    } catch {
      Alert.alert('Error', 'Failed to upload video');
    } finally {
      setVideoUploading(false);
    }
  };

  const handleVideoRemove = async () => {
    const url = (profile as any)?.videoIntroUrl;
    if (!url) return;
    Alert.alert('Remove Video', 'Remove your video introduction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFile.mutateAsync({ url, resourceType: 'video' });
            await updateProfile.mutateAsync({ videoIntroUrl: null });
          } catch {
            Alert.alert('Error', 'Failed to remove video');
          }
        },
      },
    ]);
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
const uploadImage = async (uri: string, type: string, getUploadParams: any) => {
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
    Alert.alert('Upload Failed', err.message ?? 'Failed to upload image');
    return null;
  }
};

const TrainerProfileEdit = () => {
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
    const url = await uploadImage(result.assets[0].uri, 'profile', getUploadParams);
    setUploading(false);

    if (url) {
      update('profileImageUrl', url);
      await updateProfile.mutateAsync({ profileImageUrl: url });
      Alert.alert('Success', 'Profile photo updated');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile.mutateAsync({
        ...fields,
        hourlyRateMin: Math.round((fields.hourlyRateMin ?? 0) * 100),
        hourlyRateMax: Math.round((fields.hourlyRateMax ?? 0) * 100),
      });
      Alert.alert('Success', 'Profile updated');
    } catch {
      Alert.alert('Error', 'Failed to update profile');
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
      <View className="flex-row px-4 py-2 gap-1">
        {TABS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            className={`flex-1 items-center py-2 rounded-lg ${tab === key ? 'bg-primary' : 'bg-card border border-border'}`}
            onPress={() => setTab(key)}
          >
            <Text className={`text-xs font-medium ${tab === key ? 'text-white' : 'text-muted-foreground'}`}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

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
                <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Basic Info</Text>
                {profile?.handle && (
                  <View className="bg-secondary rounded-lg px-3 py-2">
                    <Text className="text-xs text-muted-foreground">fitnassist.co/trainers/{profile.handle}</Text>
                  </View>
                )}
                <Input label="Display Name" value={fields.displayName} onChangeText={(v) => update('displayName', v)} />
                <Input label="Bio" value={fields.bio} onChangeText={(v) => update('bio', v)} multiline numberOfLines={4} />
              </CardContent>
            </Card>
          </>
        )}

        {tab === 'location' && (
          <>
            <Card>
              <CardContent className="py-4 px-4 gap-3">
                <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Location</Text>
                <AddressAutocomplete
                  currentAddress={{
                    addressLine1: fields.addressLine1,
                    city: fields.city,
                    county: fields.county,
                    postcode: fields.postcode,
                    country: fields.country,
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
                        Alert.alert('Error', v ? 'Failed to publish profile' : 'Failed to unpublish profile');
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

const TraineeProfileEdit = () => {
  const { data: profile, isLoading } = useMyTraineeProfile();
  const updateProfile = useUpdateTraineeProfile();
  const getUploadParams = trpc.upload.getUploadParams.useMutation();
  const [tab, setTab] = useState<TraineeTab>('personal');
  const [fields, setFields] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFields({
        avatarUrl: (profile as any).avatarUrl ?? null,
        bio: (profile as any).bio ?? '',
        dateOfBirth: (profile as any).dateOfBirth ?? '',
        gender: (profile as any).gender ?? '',
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
    const url = await uploadImage(result.assets[0].uri, 'profile', getUploadParams);
    setUploading(false);

    if (url) {
      update('avatarUrl', url);
      await updateProfile.mutateAsync({ avatarUrl: url });
      Alert.alert('Success', 'Avatar updated');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: Record<string, any> = { ...fields };
      for (const key of ['heightCm', 'startWeightKg', 'goalWeightKg', 'dailyCalorieTarget', 'dailyProteinTargetG', 'dailyCarbsTargetG', 'dailyFatTargetG', 'dailyWaterTargetMl']) {
        if (data[key] !== '' && data[key] != null) data[key] = parseFloat(data[key]);
        else delete data[key];
      }
      await updateProfile.mutateAsync(data);
      Alert.alert('Success', 'Profile updated');
    } catch {
      Alert.alert('Error', 'Failed to update profile');
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
      <View className="flex-row px-4 py-2 gap-1">
        {TABS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            className={`flex-1 items-center py-2 rounded-lg ${tab === key ? 'bg-primary' : 'bg-card border border-border'}`}
            onPress={() => setTab(key)}
          >
            <Text className={`text-xs font-medium ${tab === key ? 'text-white' : 'text-muted-foreground'}`}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-4 pb-8">
        {tab === 'personal' && (
          <>
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

            <Card>
              <CardContent className="py-4 px-4 gap-3">
                <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Personal Info</Text>
                <Input label="Bio" value={fields.bio} onChangeText={(v) => update('bio', v)} multiline numberOfLines={3} />
                <Input label="Date of Birth" value={fields.dateOfBirth} onChangeText={(v) => update('dateOfBirth', v)} placeholder="YYYY-MM-DD" />
                <Text className="text-sm font-medium text-foreground">Gender</Text>
                <View className="flex-row flex-wrap gap-2">
                  {GENDERS.map(({ value, label }) => (
                    <TouchableOpacity
                      key={value}
                      className={`px-3 py-2 rounded-lg border ${fields.gender === value ? 'border-teal bg-teal/10' : 'border-border'}`}
                      onPress={() => update('gender', value)}
                    >
                      <Text className={`text-xs font-medium ${fields.gender === value ? 'text-teal' : 'text-muted-foreground'}`}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
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
              <ChipSelect
                options={EXPERIENCE_LEVELS}
                selected={fields.experienceLevel ? [fields.experienceLevel] : []}
                onToggle={(v) => update('experienceLevel', v)}
              />
              <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Activity Level</Text>
              <ChipSelect
                options={ACTIVITY_LEVELS}
                selected={fields.activityLevel ? [fields.activityLevel] : []}
                onToggle={(v) => update('activityLevel', v)}
              />
              <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Fitness Goals</Text>
              <ChipSelect options={FITNESS_GOALS} selected={fields.fitnessGoals ?? []} onToggle={toggleGoal} />
              <Input label="Goal Notes" value={fields.fitnessGoalNotes} onChangeText={(v) => update('fitnessGoalNotes', v)} multiline />
              <Input label="Medical Notes" value={fields.medicalNotes} onChangeText={(v) => update('medicalNotes', v)} multiline />
            </CardContent>
          </Card>
        )}

        {tab === 'nutrition' && (
          <Card>
            <CardContent className="py-4 px-4 gap-3">
              <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Daily Targets</Text>
              <Input label="Calories (kcal)" value={String(fields.dailyCalorieTarget ?? '')} onChangeText={(v) => update('dailyCalorieTarget', v)} keyboardType="numeric" />
              <Input label="Protein (g)" value={String(fields.dailyProteinTargetG ?? '')} onChangeText={(v) => update('dailyProteinTargetG', v)} keyboardType="numeric" />
              <Input label="Carbs (g)" value={String(fields.dailyCarbsTargetG ?? '')} onChangeText={(v) => update('dailyCarbsTargetG', v)} keyboardType="numeric" />
              <Input label="Fat (g)" value={String(fields.dailyFatTargetG ?? '')} onChangeText={(v) => update('dailyFatTargetG', v)} keyboardType="numeric" />
              <Input label="Water (ml)" value={String(fields.dailyWaterTargetMl ?? '')} onChangeText={(v) => update('dailyWaterTargetMl', v)} keyboardType="numeric" />
            </CardContent>
          </Card>
        )}

        {tab === 'privacy' && (
          <Card>
            <CardContent className="py-4 px-4 gap-3">
              <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>
                Privacy
              </Text>
              <Text className="text-sm text-muted-foreground">
                Privacy settings control who can see your profile sections, metrics, goals, and trends. Manage these from the web dashboard for full control over each visibility level (Only Me, My PT, PT & Friends, Everyone).
              </Text>
            </CardContent>
          </Card>
        )}

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
