import { useState } from 'react';
import { View, FlatList, RefreshControl, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Star, Search as SearchIcon } from 'lucide-react-native';
import { Text, Input, Card, CardContent, Skeleton } from '@/components/ui';
import { useTrainerSearch } from '@/api/trainer';
import { colors } from '@/constants/theme';

const TrainerCard = ({ trainer, onPress }: { trainer: any; onPress: () => void }) => {
  const rate = trainer.hourlyRateMin
    ? `£${(trainer.hourlyRateMin / 100).toFixed(0)}${trainer.hourlyRateMax ? `-${(trainer.hourlyRateMax / 100).toFixed(0)}` : ''}/hr`
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
                <Text className="text-lg font-semibold text-foreground">
                  {trainer.displayName?.charAt(0) ?? '?'}
                </Text>
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
                  <Text className="text-xs text-foreground">
                    {trainer.ratingAverage?.toFixed(1)} ({trainer.ratingCount})
                  </Text>
                </View>
              )}
              <View className="flex-row items-center gap-2 mt-1">
                {rate && (
                  <Text className="text-xs font-medium text-teal">{rate}</Text>
                )}
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

  // Default search - show all trainers accepting clients
  const { data, isLoading, refetch } = useTrainerSearch({
    acceptingClients: true,
    limit: 50,
  });

  const allTrainers = Array.isArray(data) ? data : (data?.trainers ?? []);
  const trainers = allTrainers.filter((t: any) =>
    !query || t.displayName?.toLowerCase().includes(query.toLowerCase()) ||
    t.city?.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">Find a Trainer</Text>
      </View>

      {/* Search */}
      <View className="px-4 py-3">
        <View className="flex-row items-center bg-card border border-border rounded-lg px-3">
          <SearchIcon size={18} color={colors.mutedForeground} />
          <View className="flex-1">
            <Input
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name or location..."
              className="border-0"
            />
          </View>
        </View>
      </View>

      {isLoading ? (
        <View className="px-4 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </View>
      ) : (
        <FlatList
          data={trainers}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }) => (
            <TrainerCard
              trainer={item}
              onPress={() => router.push(`/trainers/${item.handle}`)}
            />
          )}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-base text-muted-foreground">No trainers found</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.teal} />
          }
        />
      )}
    </SafeAreaView>
  );
};

export default TrainerSearchScreen;
