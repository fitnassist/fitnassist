import { View, ScrollView, Alert, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Settings,
  Bell,
  CreditCard,
  BarChart3,
  Star,
  Gift,
  Trophy,
  ShoppingBag,
  Users,
  ChevronRight,
  LogOut,
} from 'lucide-react-native';
import { Text, Card, CardContent, Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useMyTrainerProfile } from '@/api/trainer';
import { useMyTraineeProfile } from '@/api/trainee';
import { colors } from '@/constants/theme';

interface MenuItemProps {
  label: string;
  icon: React.ElementType;
  onPress: () => void;
  destructive?: boolean;
}

const MenuItem = ({ label, icon: Icon, onPress, destructive }: MenuItemProps) => (
  <TouchableOpacity
    className="flex-row items-center py-3.5 px-1 gap-3"
    activeOpacity={0.6}
    onPress={onPress}
  >
    <Icon size={20} color={destructive ? colors.destructive : colors.mutedForeground} />
    <Text className={`flex-1 text-base ${destructive ? 'text-destructive' : 'text-foreground'}`}>
      {label}
    </Text>
    {!destructive && <ChevronRight size={18} color={colors.mutedForeground} />}
  </TouchableOpacity>
);

const ProfileScreen = () => {
  const router = useRouter();
  const { user, role, signOut } = useAuth();
  const isTrainer = role === 'TRAINER';
  const { data: trainerProfile } = useMyTrainerProfile();
  const { data: traineeProfile } = useMyTraineeProfile();

  const profileImage = isTrainer ? trainerProfile?.profileImageUrl : traineeProfile?.avatarUrl;
  const displayName = isTrainer ? trainerProfile?.displayName : user?.name;

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch {
            Alert.alert('Error', 'Failed to sign out');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        {/* Header */}
        <View className="px-4 py-4">
          <Text className="text-2xl font-extralight text-foreground uppercase" style={{ letterSpacing: 2 }}>
            Profile
          </Text>
        </View>

        {/* Profile Card */}
        <View className="px-4 mb-6">
          <Card>
            <CardContent className="py-5 px-4">
              <View className="flex-row items-center gap-4">
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    className="w-16 h-16 rounded-full"
                  />
                ) : (
                  <View className="w-16 h-16 rounded-full bg-primary items-center justify-center">
                    <Text className="text-xl font-bold text-white">
                      {(displayName ?? user?.name ?? '?').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View className="flex-1 gap-0.5">
                  <Text className="text-lg font-semibold text-foreground">
                    {displayName ?? user?.name}
                  </Text>
                  <Text className="text-sm text-muted-foreground">{user?.email}</Text>
                  <Text className="text-xs text-primary capitalize">{role?.toLowerCase()}</Text>
                </View>
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Menu Sections */}
        <View className="px-4 gap-4">
          {/* General */}
          <Card>
            <CardContent className="py-1 px-4">
              <MenuItem
                label="Account Settings"
                icon={Settings}
                onPress={() => router.push('/dashboard/settings')}
              />
              <View className="border-b border-border" />
              <MenuItem
                label="Notifications"
                icon={Bell}
                onPress={() => router.push('/dashboard/settings')}
              />
            </CardContent>
          </Card>

          {/* Trainer-specific */}
          {isTrainer && (
            <Card>
              <CardContent className="py-1 px-4">
                <MenuItem
                  label="Analytics"
                  icon={BarChart3}
                  onPress={() => router.push('/dashboard/analytics')}
                />
                <View className="border-b border-border" />
                <MenuItem
                  label="Reviews"
                  icon={Star}
                  onPress={() => router.push('/dashboard/reviews')}
                />
                <View className="border-b border-border" />
                <MenuItem
                  label="Referrals"
                  icon={Gift}
                  onPress={() => router.push('/dashboard/referrals')}
                />
                <View className="border-b border-border" />
                <MenuItem
                  label="Subscription"
                  icon={CreditCard}
                  onPress={() => router.push('/dashboard/settings')}
                />
              </CardContent>
            </Card>
          )}

          {/* Trainee-specific */}
          {!isTrainer && (
            <Card>
              <CardContent className="py-1 px-4">
                <MenuItem
                  label="Achievements"
                  icon={Trophy}
                  onPress={() => router.push('/dashboard/achievements')}
                />
                <View className="border-b border-border" />
                <MenuItem
                  label="Leaderboards"
                  icon={Users}
                  onPress={() => router.push('/dashboard/leaderboards')}
                />
                <View className="border-b border-border" />
                <MenuItem
                  label="Purchases"
                  icon={ShoppingBag}
                  onPress={() => router.push('/dashboard/purchases')}
                />
              </CardContent>
            </Card>
          )}

          {/* Sign Out */}
          <Card>
            <CardContent className="py-1 px-4">
              <MenuItem
                label="Sign Out"
                icon={LogOut}
                onPress={handleSignOut}
                destructive
              />
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;
