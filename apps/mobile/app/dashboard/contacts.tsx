import { View, FlatList, RefreshControl, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MessageCircle, User } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { Text, Card, CardContent, Skeleton, Badge } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { colors } from '@/constants/theme';

const ContactsScreen = () => {
  const router = useRouter();
  const { data: requests, isLoading, refetch } = trpc.contact.getMyRequests.useQuery();

  const accepted = (requests ?? []).filter((r: any) => r.status === 'ACCEPTED');

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">My Contacts</Text>
      </View>

      {isLoading ? (
        <View className="px-4 py-4 gap-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </View>
      ) : (
        <FlatList
          data={accepted}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item }: { item: any }) => {
            const trainerName = item.trainer?.displayName ?? 'Trainer';
            const trainerImage = item.trainer?.profileImageUrl ?? null;

            return (
              <TouchableOpacity
                className="flex-row items-center px-4 py-3 gap-3 border-b border-border"
                activeOpacity={0.6}
                onPress={() => router.push(`/trainers/${item.trainer?.handle}`)}
              >
                {trainerImage ? (
                  <Image source={{ uri: trainerImage }} className="w-12 h-12 rounded-full" />
                ) : (
                  <View className="w-12 h-12 rounded-full bg-secondary items-center justify-center">
                    <User size={20} color={colors.mutedForeground} />
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-base font-medium text-foreground">{trainerName}</Text>
                  <Text className="text-xs text-muted-foreground">Connected</Text>
                </View>
                <TouchableOpacity onPress={() => router.push(`/messages/${item.id}`)}>
                  <MessageCircle size={20} color={colors.teal} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View className="items-center justify-center py-12 gap-2">
              <User size={48} color={colors.mutedForeground} />
              <Text className="text-base text-muted-foreground">No trainer connections yet</Text>
              <Text className="text-sm text-muted-foreground text-center">Find a trainer and send a connection request</Text>
            </View>
          }
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={colors.teal} />}
        />
      )}
    </SafeAreaView>
  );
};

export default ContactsScreen;
