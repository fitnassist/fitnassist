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
  Globe,
  ShoppingBag,
  BookOpen,
  ClipboardCheck,
  Users,
  Trophy,
  Award,
  Heart,
  Package,
  User,
  UserPen,
  Target,
  ClipboardList,
  Rss,
  ChevronRight,
  LogOut,
} from 'lucide-react-native';
import { Text, Card, CardContent } from '@/components/ui';
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

const Divider = () => <View className="border-b border-border" />;

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
                label="Edit Profile"
                icon={UserPen}
                onPress={() => router.push(isTrainer ? '/dashboard/profile/edit' : '/dashboard/profile/edit')}
              />
              <Divider />
              <MenuItem
                label="Account Settings"
                icon={Settings}
                onPress={() => router.push('/dashboard/settings')}
              />
              <Divider />
              <MenuItem
                label="Notifications"
                icon={Bell}
                onPress={() => router.push('/dashboard/notifications')}
              />
              {isTrainer && (
                <>
                  <Divider />
                  <MenuItem
                    label="Subscription"
                    icon={CreditCard}
                    onPress={() => router.push('/dashboard/subscription')}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Trainer-specific */}
          {isTrainer && (
            <>
              {/* Business */}
              <Text className="text-xs font-medium text-teal uppercase px-1" style={{ letterSpacing: 1 }}>
                Business
              </Text>
              <Card>
                <CardContent className="py-1 px-4">
                  <MenuItem
                    label="Clients"
                    icon={Users}
                    onPress={() => router.push('/dashboard/clients')}
                  />
                  <Divider />
                  <MenuItem
                    label="Onboarding"
                    icon={ClipboardCheck}
                    onPress={() => router.push('/dashboard/onboarding')}
                  />
                  <Divider />
                  <MenuItem
                    label="Resources"
                    icon={BookOpen}
                    onPress={() => router.push('/dashboard/resources')}
                  />
                  <Divider />
                  <MenuItem
                    label="Analytics"
                    icon={BarChart3}
                    onPress={() => router.push('/dashboard/analytics')}
                  />
                  <Divider />
                  <MenuItem
                    label="Reviews"
                    icon={Star}
                    onPress={() => router.push('/dashboard/reviews')}
                  />
                </CardContent>
              </Card>

              {/* Online Presence */}
              <Text className="text-xs font-medium text-teal uppercase px-1" style={{ letterSpacing: 1 }}>
                Online Presence
              </Text>
              <Card>
                <CardContent className="py-1 px-4">
                  <MenuItem
                    label="Website Builder"
                    icon={Globe}
                    onPress={() => router.push('/dashboard/website')}
                  />
                  <Divider />
                  <MenuItem
                    label="Storefront"
                    icon={ShoppingBag}
                    onPress={() => router.push('/dashboard/storefront')}
                  />
                </CardContent>
              </Card>

              {/* Growth */}
              <Text className="text-xs font-medium text-teal uppercase px-1" style={{ letterSpacing: 1 }}>
                Growth
              </Text>
              <Card>
                <CardContent className="py-1 px-4">
                  <MenuItem
                    label="Referrals"
                    icon={Gift}
                    onPress={() => router.push('/dashboard/referrals')}
                  />
                </CardContent>
              </Card>
            </>
          )}

          {/* Trainee-specific */}
          {!isTrainer && (
            <>
              {/* Tracking */}
              <Text className="text-xs font-medium text-teal uppercase px-1" style={{ letterSpacing: 1 }}>
                Tracking
              </Text>
              <Card>
                <CardContent className="py-1 px-4">
                  <MenuItem
                    label="Goals"
                    icon={Target}
                    onPress={() => router.push('/dashboard/goals')}
                  />
                  <Divider />
                  <MenuItem
                    label="My Plans"
                    icon={ClipboardList}
                    onPress={() => router.push('/dashboard/my-plans')}
                  />
                  <Divider />
                  <MenuItem
                    label="My Contacts"
                    icon={User}
                    onPress={() => router.push('/dashboard/contacts')}
                  />
                </CardContent>
              </Card>

              {/* Social */}
              <Text className="text-xs font-medium text-teal uppercase px-1" style={{ letterSpacing: 1 }}>
                Social
              </Text>
              <Card>
                <CardContent className="py-1 px-4">
                  <MenuItem
                    label="Feed"
                    icon={Rss}
                    onPress={() => router.push('/dashboard/feed')}
                  />
                  <Divider />
                  <MenuItem
                    label="Friends"
                    icon={Heart}
                    onPress={() => router.push('/dashboard/friends')}
                  />
                  <Divider />
                  <MenuItem
                    label="Leaderboards"
                    icon={Trophy}
                    onPress={() => router.push('/dashboard/leaderboards')}
                  />
                  <Divider />
                  <MenuItem
                    label="Achievements"
                    icon={Award}
                    onPress={() => router.push('/dashboard/achievements')}
                  />
                </CardContent>
              </Card>

              {/* Purchases */}
              <Card>
                <CardContent className="py-1 px-4">
                  <MenuItem
                    label="Purchases"
                    icon={Package}
                    onPress={() => router.push('/dashboard/purchases')}
                  />
                </CardContent>
              </Card>
            </>
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
