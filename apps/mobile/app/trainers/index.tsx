import { useState } from 'react';
import { View, FlatList, RefreshControl, Image, TouchableOpacity, TextInput, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Star, Search as SearchIcon, SlidersHorizontal, X } from 'lucide-react-native';
import { Text, Card, CardContent, Skeleton, PillSelect, Badge } from '@/components/ui';
import { useTrainerSearch } from '@/api/trainer';
import { TRAINER_SERVICES } from '@fitnassist/schemas/src/constants/services.constants';
import { colors } from '@/constants/theme';

const RADIUS_OPTIONS = ['5', '10', '15', '25', '50'];
const TRAVEL_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'CLIENT_TRAVELS', label: 'Studio/Gym' },
  { value: 'TRAINER_TRAVELS', label: 'Mobile' },
  { value: 'BOTH', label: 'Flexible' },
];

const TrainerCard = ({ trainer, onPress }: { trainer: any; onPress: () => void }) => {
  const rate = trainer.hourlyRateMin
    ? `£${(trainer.hourlyRateMin / 100).toFixed(0)}${trainer.hourlyRateMax ? `–${(trainer.hourlyRateMax / 100).toFixed(0)}` : ''}/hr`
    : null;

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      <Card className="mx-4 mb-3">
        <CardContent className="py-4 px-4">
          <View className="flex-row gap-3">
            {trainer.profileImageUrl ? (
              <Image source={{ uri: trainer.profileImageUrl }} className="w-16 h-16 rounded-full" />
            ) : (
              <View className="w-16 h-16 rounded-full bg-secondary items-center justify-center">
                <Text className="text-lg font-semibold text-foreground">{trainer.displayName?.charAt(0) ?? '?'}</Text>
              </View>
            )}
            <View className="flex-1 gap-1">
              <Text className="text-base font-semibold text-foreground">{trainer.displayName}</Text>
              {trainer.city && (
                <View className="flex-row items-center gap-1">
                  <MapPin size={12} color={colors.mutedForeground} />
                  <Text className="text-xs text-muted-foreground">
                    {trainer.city}{trainer.postcode ? `, ${trainer.postcode}` : ''}
                    {trainer.distance != null ? ` · ${trainer.distance.toFixed(1)} mi` : ''}
                  </Text>
                </View>
              )}
              {trainer.ratingCount > 0 && (
                <View className="flex-row items-center gap-1">
                  <Star size={12} color={colors.teal} fill={colors.teal} />
                  <Text className="text-xs text-foreground">{trainer.ratingAverage?.toFixed(1)} ({trainer.ratingCount})</Text>
                </View>
              )}
              <View className="flex-row items-center gap-2 mt-1">
                {rate && <Text className="text-xs font-medium text-teal">{rate}</Text>}
                {trainer.acceptingClients && (
                  <View className="bg-teal/20 rounded-full px-2 py-0.5">
                    <Text className="text-[10px] font-medium text-teal">Accepting clients</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );
};

const TrainerSearchScreen = () => {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [radius, setRadius] = useState('10');
  const [services, setServices] = useState<string[]>([]);
  const [travelOption, setTravelOption] = useState('');
  const [acceptingClients, setAcceptingClients] = useState(true);

  const activeFilterCount = services.length + (radius !== '10' ? 1 : 0) + (travelOption ? 1 : 0) + (acceptingClients ? 1 : 0);

  const { data, isLoading, refetch } = useTrainerSearch({
    acceptingClients: acceptingClients || undefined,
    services: services.length > 0 ? services : undefined,
    radiusMiles: parseInt(radius),
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
    setTravelOption('');
    setAcceptingClients(true);
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
      <View className="px-4 py-3 gap-2 border-b border-border">
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
            className={`h-11 px-3 rounded-lg border items-center justify-center relative ${showFilters ? 'bg-primary border-primary' : 'bg-card border-border'}`}
            onPress={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={18} color={showFilters ? '#fff' : colors.foreground} />
            {activeFilterCount > 0 && (
              <View className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary items-center justify-center">
                <Text className="text-[10px] text-white font-bold">{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Filter panel */}
        {showFilters && (
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
            <View className="gap-4 pt-1 pb-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-medium text-muted-foreground uppercase" style={{ letterSpacing: 1 }}>Filters</Text>
                {activeFilterCount > 0 && (
                  <TouchableOpacity onPress={clearFilters}>
                    <Text className="text-xs text-primary">Clear all</Text>
                  </TouchableOpacity>
                )}
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
            </View>
          </ScrollView>
        )}
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
            <TrainerCard trainer={item} onPress={() => router.push(`/trainers/${item.handle}`)} />
          )}
          ListHeaderComponent={<View className="h-3" />}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-base text-muted-foreground">No trainers found</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.teal} />}
        />
      )}
    </SafeAreaView>
  );
};

export default TrainerSearchScreen;
