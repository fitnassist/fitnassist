import { useState } from 'react';
import { View, FlatList, RefreshControl, Image, TouchableOpacity, TextInput, Switch, Modal, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Star, Search as SearchIcon, SlidersHorizontal, X } from 'lucide-react-native';
import { Text, Skeleton, PillSelect } from '@/components/ui';
import { useTrainerSearch } from '@/api/trainer';
import { TRAINER_SERVICES } from '@fitnassist/schemas/src/constants/services.constants';
import { TRAINER_QUALIFICATIONS } from '@fitnassist/schemas/src/constants/qualifications.constants';
import { colors } from '@/constants/theme';

const RADIUS_OPTIONS = ['5', '10', '15', '25', '50'];
const TRAVEL_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'CLIENT_TRAVELS', label: 'Studio/Gym' },
  { value: 'TRAINER_TRAVELS', label: 'Mobile' },
  { value: 'BOTH', label: 'Flexible' },
];
const SORT_OPTIONS = [
  { value: 'distance', label: 'Distance' },
  { value: 'recently_active', label: 'Recently Active' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_low', label: 'Price (Low–High)' },
  { value: 'price_high', label: 'Price (High–Low)' },
];

const UK_QUALIFICATIONS = TRAINER_QUALIFICATIONS.filter((q) => q.region === 'uk');
const INTL_QUALIFICATIONS = TRAINER_QUALIFICATIONS.filter((q) => q.region === 'international');

const TrainerRow = ({ trainer, onPress }: { trainer: any; onPress: () => void }) => {
  const rate = trainer.hourlyRateMin
    ? `£${(trainer.hourlyRateMin / 100).toFixed(0)}${trainer.hourlyRateMax ? `–${(trainer.hourlyRateMax / 100).toFixed(0)}` : ''}/hr`
    : null;

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} className="px-4 py-3 flex-row gap-3 border-b border-border">
      {trainer.profileImageUrl ? (
        <Image source={{ uri: trainer.profileImageUrl }} className="w-12 h-12 rounded-full" />
      ) : (
        <View className="w-12 h-12 rounded-full bg-secondary items-center justify-center">
          <Text className="text-sm font-semibold text-foreground">{trainer.displayName?.charAt(0) ?? '?'}</Text>
        </View>
      )}
      <View className="flex-1 gap-0.5">
        <Text className="text-sm font-semibold text-foreground">{trainer.displayName}</Text>
        {trainer.city && (
          <View className="flex-row items-center gap-1">
            <MapPin size={11} color={colors.mutedForeground} />
            <Text className="text-xs text-muted-foreground">
              {trainer.city}{trainer.postcode ? `, ${trainer.postcode}` : ''}
              {trainer.distance != null ? ` · ${trainer.distance.toFixed(1)} mi` : ''}
            </Text>
          </View>
        )}
        <View className="flex-row items-center gap-2 mt-0.5">
          {trainer.ratingCount > 0 && (
            <View className="flex-row items-center gap-1">
              <Star size={11} color={colors.teal} fill={colors.teal} />
              <Text className="text-xs text-foreground">{trainer.ratingAverage?.toFixed(1)}</Text>
            </View>
          )}
          {rate && <Text className="text-xs font-medium text-teal">{rate}</Text>}
          {trainer.acceptingClients && (
            <View className="bg-teal/20 rounded-full px-1.5 py-0.5">
              <Text className="text-[10px] font-medium text-teal">Accepting</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const TrainerSearchScreen = () => {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState('');
  const [radius, setRadius] = useState('10');
  const [services, setServices] = useState<string[]>([]);
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [travelOption, setTravelOption] = useState('');
  const [acceptingClients, setAcceptingClients] = useState(true);
  const [sortBy, setSortBy] = useState('distance');
  const [minRate, setMinRate] = useState('');
  const [maxRate, setMaxRate] = useState('');

  const activeFilterCount =
    services.length +
    qualifications.length +
    (radius !== '10' ? 1 : 0) +
    (travelOption ? 1 : 0) +
    (minRate ? 1 : 0) +
    (maxRate ? 1 : 0) +
    (acceptingClients ? 1 : 0);

  const { data, isLoading, refetch } = useTrainerSearch({
    acceptingClients: acceptingClients || undefined,
    services: services.length > 0 ? services : undefined,
    qualifications: qualifications.length > 0 ? qualifications : undefined,
    travelOption: (travelOption as 'CLIENT_TRAVELS' | 'TRAINER_TRAVELS' | 'BOTH') || undefined,
    minRate: minRate ? Math.round(parseFloat(minRate) * 100) : undefined,
    maxRate: maxRate ? Math.round(parseFloat(maxRate) * 100) : undefined,
    radiusMiles: parseInt(radius),
    sortBy: sortBy as any,
    limit: 50,
  });

  const allTrainers = Array.isArray(data) ? data : (data?.trainers ?? []);
  const trainers = allTrainers.filter((t: any) =>
    !query || t.displayName?.toLowerCase().includes(query.toLowerCase()) ||
    t.city?.toLowerCase().includes(query.toLowerCase()),
  );

  const clearFilters = () => {
    setRadius('10');
    setServices([]);
    setQualifications([]);
    setTravelOption('');
    setAcceptingClients(true);
    setSortBy('distance');
    setMinRate('');
    setMaxRate('');
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground flex-1">Find a Trainer</Text>
      </View>

      {/* Search bar */}
      <View className="px-4 py-3 border-b border-border">
        <View className="flex-row gap-2">
          <View className="flex-1 flex-row items-center bg-card border border-border rounded-lg px-3 h-11">
            <SearchIcon size={16} color={colors.mutedForeground} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name or location..."
              placeholderTextColor={colors.mutedForeground}
              className="flex-1 ml-2 text-sm text-foreground"
              style={{ color: colors.foreground }}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <X size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            className="h-11 px-3 rounded-lg border bg-card border-border items-center justify-center relative"
            onPress={() => setShowFilters(true)}
          >
            <SlidersHorizontal size={18} color={colors.foreground} />
            {activeFilterCount > 0 && (
              <View className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary items-center justify-center">
                <Text className="text-[10px] text-white font-bold">{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View className="px-4 gap-3 pt-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </View>
      ) : (
        <FlatList
          data={trainers}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }) => (
            <TrainerRow trainer={item} onPress={() => router.push(`/trainers/${item.handle}`)} />
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-base text-muted-foreground">No trainers found</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.teal} />}
        />
      )}

      {/* Filter Bottom Sheet */}
      <Modal visible={showFilters} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowFilters(false)}>
        <View className="flex-1 bg-background">
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
            <Text className="text-base font-semibold text-foreground">Filters</Text>
            <View className="flex-row items-center gap-4">
              {activeFilterCount > 0 && (
                <TouchableOpacity onPress={clearFilters}>
                  <Text className="text-sm text-primary">Clear all</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <X size={24} color={colors.foreground} />
              </TouchableOpacity>
            </View>
          </View>

          <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-5 pb-8" keyboardShouldPersistTaps="handled">
              {/* Sort by */}
              <View className="gap-2">
                <Text className="text-sm font-medium text-foreground">Sort by</Text>
                <PillSelect
                  options={SORT_OPTIONS}
                  value={sortBy}
                  onChange={setSortBy}
                />
              </View>

              {/* Accepting clients */}
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-foreground">Accepting new clients</Text>
                <Switch
                  value={acceptingClients}
                  onValueChange={setAcceptingClients}
                  trackColor={{ false: colors.muted, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>

              {/* Radius */}
              <View className="gap-2">
                <Text className="text-sm font-medium text-foreground">Search radius</Text>
                <PillSelect
                  options={RADIUS_OPTIONS.map((r) => ({ value: r, label: `${r} mi` }))}
                  value={radius}
                  onChange={setRadius}
                />
              </View>

              {/* Training location */}
              <View className="gap-2">
                <Text className="text-sm font-medium text-foreground">Training location</Text>
                <PillSelect
                  options={TRAVEL_OPTIONS}
                  value={travelOption}
                  onChange={setTravelOption}
                />
              </View>

              {/* Price range */}
              <View className="gap-2">
                <Text className="text-sm font-medium text-foreground">Price range (per hour)</Text>
                <View className="flex-row items-center gap-2">
                  <View className="flex-1 flex-row items-center bg-card border border-border rounded-lg px-3 h-11">
                    <Text className="text-sm text-muted-foreground mr-1">£</Text>
                    <TextInput
                      value={minRate}
                      onChangeText={setMinRate}
                      placeholder="Min"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="numeric"
                      className="flex-1 text-sm text-foreground"
                      style={{ color: colors.foreground }}
                    />
                  </View>
                  <Text className="text-muted-foreground">–</Text>
                  <View className="flex-1 flex-row items-center bg-card border border-border rounded-lg px-3 h-11">
                    <Text className="text-sm text-muted-foreground mr-1">£</Text>
                    <TextInput
                      value={maxRate}
                      onChangeText={setMaxRate}
                      placeholder="Max"
                      placeholderTextColor={colors.mutedForeground}
                      keyboardType="numeric"
                      className="flex-1 text-sm text-foreground"
                      style={{ color: colors.foreground }}
                    />
                  </View>
                </View>
              </View>

              {/* Services */}
              <View className="gap-2">
                <Text className="text-sm font-medium text-foreground">Services</Text>
                <PillSelect
                  options={TRAINER_SERVICES.map((s) => ({ value: s.value, label: s.label }))}
                  value={services}
                  onChange={setServices}
                  multiple
                />
              </View>

              {/* Qualifications - UK */}
              <View className="gap-2">
                <Text className="text-sm font-medium text-foreground">Qualifications</Text>
                <Text className="text-xs text-muted-foreground">UK</Text>
                <PillSelect
                  options={UK_QUALIFICATIONS.map((q) => ({ value: q.value, label: q.label }))}
                  value={qualifications}
                  onChange={setQualifications}
                  multiple
                />
              </View>

              {/* Qualifications - International */}
              <View className="gap-2">
                <Text className="text-xs text-muted-foreground">International</Text>
                <PillSelect
                  options={INTL_QUALIFICATIONS.map((q) => ({ value: q.value, label: q.label }))}
                  value={qualifications}
                  onChange={setQualifications}
                  multiple
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default TrainerSearchScreen;
