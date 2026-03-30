import { View, ScrollView, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Star, Clock, CheckCircle } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Button, Card, CardContent, Skeleton, Badge } from '@/components/ui';
import { useTrainerByHandle } from '@/api/trainer';
import { colors } from '@/constants/theme';

const TrainerProfileScreen = () => {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const { data: trainer, isLoading } = useTrainerByHandle(handle ?? '');

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Skeleton className="h-5 w-32 rounded" />
        </View>
        <View className="px-4 py-6 gap-4">
          <View className="items-center gap-3">
            <Skeleton className="w-24 h-24 rounded-full" />
            <Skeleton className="h-6 w-40 rounded" />
          </View>
          <Skeleton className="h-32 rounded-lg" />
        </View>
      </SafeAreaView>
    );
  }

  if (!trainer) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-base font-semibold text-foreground">Trainer</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">Trainer not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const rate = trainer.hourlyRateMin
    ? `£${(trainer.hourlyRateMin / 100).toFixed(0)}${trainer.hourlyRateMax ? ` - £${(trainer.hourlyRateMax / 100).toFixed(0)}` : ''} / hr`
    : null;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">{trainer.displayName}</Text>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="pb-24">
        {/* Hero */}
        <View className="items-center py-6 gap-3">
          {trainer.profileImageUrl ? (
            <Image source={{ uri: trainer.profileImageUrl }} className="w-24 h-24 rounded-full" />
          ) : (
            <View className="w-24 h-24 rounded-full bg-secondary items-center justify-center">
              <Text className="text-2xl font-bold text-foreground">
                {trainer.displayName?.charAt(0)}
              </Text>
            </View>
          )}
          <Text className="text-xl font-semibold text-foreground">{trainer.displayName}</Text>

          {trainer.city && (
            <View className="flex-row items-center gap-1">
              <MapPin size={14} color={colors.mutedForeground} />
              <Text className="text-sm text-muted-foreground">
                {trainer.city}{trainer.postcode ? `, ${trainer.postcode}` : ''}
              </Text>
            </View>
          )}

          <View className="flex-row items-center gap-3">
            {trainer.ratingCount > 0 && (
              <View className="flex-row items-center gap-1">
                <Star size={14} color={colors.teal} fill={colors.teal} />
                <Text className="text-sm text-foreground">
                  {trainer.ratingAverage?.toFixed(1)} ({trainer.ratingCount} reviews)
                </Text>
              </View>
            )}
            {trainer.acceptingClients && (
              <View className="flex-row items-center gap-1">
                <CheckCircle size={14} color={colors.teal} />
                <Text className="text-sm text-teal">Accepting clients</Text>
              </View>
            )}
          </View>

          {rate && (
            <View className="flex-row items-center gap-1">
              <Clock size={14} color={colors.mutedForeground} />
              <Text className="text-sm font-medium text-foreground">{rate}</Text>
            </View>
          )}
        </View>

        {/* Bio */}
        {trainer.bio && (
          <View className="px-4 mb-4">
            <Card>
              <CardContent className="py-4 px-4 gap-2">
                <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>
                  About
                </Text>
                <Text className="text-sm text-foreground leading-5">{trainer.bio}</Text>
              </CardContent>
            </Card>
          </View>
        )}

        {/* Services */}
        {trainer.services && trainer.services.length > 0 && (
          <View className="px-4 mb-4">
            <Card>
              <CardContent className="py-4 px-4 gap-2">
                <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>
                  Services
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {trainer.services.map((service: string) => (
                    <Badge key={service} variant="secondary">
                      <Text className="text-xs text-foreground">{service.replace(/_/g, ' ')}</Text>
                    </Badge>
                  ))}
                </View>
              </CardContent>
            </Card>
          </View>
        )}

        {/* Gallery */}
        {trainer.galleryImages && trainer.galleryImages.length > 0 && (
          <View className="px-4 mb-4">
            <Text className="text-sm font-medium text-teal uppercase mb-2 px-1" style={{ letterSpacing: 1 }}>
              Gallery
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
              {trainer.galleryImages.map((url: string, i: number) => (
                <Image
                  key={i}
                  source={{ uri: url }}
                  className="w-48 h-48 rounded-lg mr-2"
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* CTA */}
      <View className="absolute bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-4">
        <SafeAreaView edges={['bottom']}>
          <Button onPress={() => Alert.alert('Coming Soon', 'Booking will be available soon')}>
            Contact Trainer
          </Button>
        </SafeAreaView>
      </View>
    </SafeAreaView>
  );
};

export default TrainerProfileScreen;
