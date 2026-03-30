import { useState, useEffect } from 'react';
import { View, ScrollView, Alert, Image, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, Check } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Text, Button, Input, Card, CardContent, Skeleton } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useMyTrainerProfile, useUpdateTrainerProfile } from '@/api/trainer';
import { useMyTraineeProfile, useUpdateTraineeProfile } from '@/api/trainee';
import { colors } from '@/constants/theme';

type TrainerTab = 'basic' | 'location' | 'services' | 'media' | 'settings';
type TraineeTab = 'personal' | 'body' | 'fitness' | 'nutrition' | 'privacy';

const TRAINER_SERVICES = [
  'personal-training', 'strength-conditioning', 'weight-loss', 'bodybuilding',
  'sports-performance', 'group-fitness', 'hiit', 'crossfit', 'nutrition-coaching',
  'rehabilitation', 'mobility-flexibility', 'pre-postnatal', 'senior-fitness',
  'stress-management', 'yoga', 'pilates',
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

const ChipSelect = ({ options, selected, onToggle, multi = true }: {
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
  multi?: boolean;
}) => (
  <View className="flex-row flex-wrap gap-2">
    {options.map((opt) => {
      const active = selected.includes(opt);
      return (
        <TouchableOpacity
          key={opt}
          className={`px-3 py-2 rounded-lg border ${active ? 'border-primary bg-primary/10' : 'border-border'}`}
          onPress={() => onToggle(opt)}
        >
          <Text className={`text-xs font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>
            {opt.replace(/-/g, ' ').replace(/_/g, ' ')}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const TrainerProfileEdit = () => {
  const { data: profile, isLoading } = useMyTrainerProfile();
  const updateProfile = useUpdateTrainerProfile();
  const [tab, setTab] = useState<TrainerTab>('basic');
  const [fields, setFields] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

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
        travelOption: (profile as any).travelOption ?? 'CLIENT_TRAVELS',
        services: (profile as any).services ?? [],
        hourlyRateMin: ((profile as any).hourlyRateMin ?? 0) / 100,
        hourlyRateMax: ((profile as any).hourlyRateMax ?? 0) / 100,
        acceptingClients: (profile as any).acceptingClients ?? true,
        isPublished: (profile as any).isPublished ?? false,
      });
    }
  }, [profile]);

  const update = (key: string, value: any) => setFields((f) => ({ ...f, [key]: value }));
  const toggleService = (s: string) => {
    const current = fields.services ?? [];
    update('services', current.includes(s) ? current.filter((x: string) => x !== s) : [...current, s]);
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
        )}

        {tab === 'location' && (
          <Card>
            <CardContent className="py-4 px-4 gap-3">
              <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Location</Text>
              <Input label="Address" value={fields.addressLine1} onChangeText={(v) => update('addressLine1', v)} />
              <Input label="City" value={fields.city} onChangeText={(v) => update('city', v)} />
              <Input label="County" value={fields.county} onChangeText={(v) => update('county', v)} />
              <Input label="Postcode" value={fields.postcode} onChangeText={(v) => update('postcode', v)} />
              <Input label="Country" value={fields.country} onChangeText={(v) => update('country', v)} />
              <Text className="text-sm font-medium text-foreground mt-2">Travel Option</Text>
              {TRAVEL_OPTIONS.map(({ value, label }) => (
                <TouchableOpacity
                  key={value}
                  className={`px-3 py-3 rounded-lg border ${fields.travelOption === value ? 'border-primary bg-primary/10' : 'border-border'}`}
                  onPress={() => update('travelOption', value)}
                >
                  <Text className={`text-sm ${fields.travelOption === value ? 'text-primary font-medium' : 'text-foreground'}`}>{label}</Text>
                </TouchableOpacity>
              ))}
            </CardContent>
          </Card>
        )}

        {tab === 'services' && (
          <Card>
            <CardContent className="py-4 px-4 gap-3">
              <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Services Offered</Text>
              <ChipSelect options={TRAINER_SERVICES} selected={fields.services ?? []} onToggle={toggleService} />
              <Text className="text-sm font-medium text-teal uppercase mt-4" style={{ letterSpacing: 1 }}>Hourly Rate</Text>
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
        )}

        {tab === 'media' && (
          <Card>
            <CardContent className="py-4 px-4 gap-3">
              <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Media</Text>
              <Text className="text-sm text-muted-foreground">
                Photo and video uploads require the web app for now. Open your browser to manage gallery images and video intro.
              </Text>
            </CardContent>
          </Card>
        )}

        {tab === 'settings' && (
          <Card>
            <CardContent className="py-4 px-4 gap-3">
              <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Profile Settings</Text>
              <View className="flex-row items-center justify-between py-2">
                <Text className="text-sm text-foreground">Published</Text>
                <Switch
                  value={fields.isPublished}
                  onValueChange={(v) => update('isPublished', v)}
                  trackColor={{ false: colors.muted, true: colors.teal }}
                  thumbColor="#fff"
                />
              </View>
              <View className="flex-row items-center justify-between py-2">
                <Text className="text-sm text-foreground">Accepting New Clients</Text>
                <Switch
                  value={fields.acceptingClients}
                  onValueChange={(v) => update('acceptingClients', v)}
                  trackColor={{ false: colors.muted, true: colors.teal }}
                  thumbColor="#fff"
                />
              </View>
            </CardContent>
          </Card>
        )}

        <Button onPress={handleSave} loading={saving}>Save Changes</Button>
      </ScrollView>
    </>
  );
};

const TraineeProfileEdit = () => {
  const { data: profile, isLoading } = useMyTraineeProfile();
  const updateProfile = useUpdateTraineeProfile();
  const [tab, setTab] = useState<TraineeTab>('personal');
  const [fields, setFields] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFields({
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: Record<string, any> = { ...fields };
      // Convert numeric strings
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
                    className={`px-3 py-2 rounded-lg border ${fields.gender === value ? 'border-primary bg-primary/10' : 'border-border'}`}
                    onPress={() => update('gender', value)}
                  >
                    <Text className={`text-xs font-medium ${fields.gender === value ? 'text-primary' : 'text-muted-foreground'}`}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </CardContent>
          </Card>
        )}

        {tab === 'body' && (
          <Card>
            <CardContent className="py-4 px-4 gap-3">
              <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Body Metrics</Text>
              <View className="flex-row items-center justify-between py-2">
                <Text className="text-sm text-foreground">Unit Preference</Text>
                <View className="flex-row gap-1 bg-card border border-border rounded-lg p-1">
                  <TouchableOpacity
                    className={`px-3 py-1 rounded-md ${fields.unitPreference === 'METRIC' ? 'bg-primary' : ''}`}
                    onPress={() => update('unitPreference', 'METRIC')}
                  >
                    <Text className={`text-xs ${fields.unitPreference === 'METRIC' ? 'text-white' : 'text-muted-foreground'}`}>Metric</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`px-3 py-1 rounded-md ${fields.unitPreference === 'IMPERIAL' ? 'bg-primary' : ''}`}
                    onPress={() => update('unitPreference', 'IMPERIAL')}
                  >
                    <Text className={`text-xs ${fields.unitPreference === 'IMPERIAL' ? 'text-white' : 'text-muted-foreground'}`}>Imperial</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Input
                label={fields.unitPreference === 'METRIC' ? 'Height (cm)' : 'Height (inches)'}
                value={String(fields.heightCm ?? '')}
                onChangeText={(v) => update('heightCm', v)}
                keyboardType="numeric"
              />
              <Input
                label={fields.unitPreference === 'METRIC' ? 'Start Weight (kg)' : 'Start Weight (lbs)'}
                value={String(fields.startWeightKg ?? '')}
                onChangeText={(v) => update('startWeightKg', v)}
                keyboardType="numeric"
              />
              <Input
                label={fields.unitPreference === 'METRIC' ? 'Goal Weight (kg)' : 'Goal Weight (lbs)'}
                value={String(fields.goalWeightKg ?? '')}
                onChangeText={(v) => update('goalWeightKg', v)}
                keyboardType="numeric"
              />
            </CardContent>
          </Card>
        )}

        {tab === 'fitness' && (
          <Card>
            <CardContent className="py-4 px-4 gap-3">
              <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Experience Level</Text>
              <ChipSelect
                options={EXPERIENCE_LEVELS}
                selected={fields.experienceLevel ? [fields.experienceLevel] : []}
                onToggle={(v) => update('experienceLevel', v)}
                multi={false}
              />
              <Text className="text-sm font-medium text-teal uppercase mt-2" style={{ letterSpacing: 1 }}>Activity Level</Text>
              <ChipSelect
                options={ACTIVITY_LEVELS}
                selected={fields.activityLevel ? [fields.activityLevel] : []}
                onToggle={(v) => update('activityLevel', v)}
                multi={false}
              />
              <Text className="text-sm font-medium text-teal uppercase mt-2" style={{ letterSpacing: 1 }}>Fitness Goals</Text>
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
                Privacy settings are managed in the web app for now
              </Text>
              <Text className="text-sm text-muted-foreground">
                Control who can see your bio, metrics, goals, progress photos, trends and more from the web dashboard settings.
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
