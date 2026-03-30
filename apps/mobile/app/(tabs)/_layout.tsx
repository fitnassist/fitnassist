import { View, Image } from 'react-native';
import { Tabs } from 'expo-router';
import {
  Home,
  MessageCircle,
  Calendar,
  Users,
  BookHeart,
  User,
} from 'lucide-react-native';
import { Text } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useMyTrainerProfile } from '@/api/trainer';
import { useMyTraineeProfile } from '@/api/trainee';
import { useUnreadMessageCount } from '@/api/message';
import { colors } from '@/constants/theme';

const AvatarTabIcon = ({ color, size, focused }: { color: string; size: number; focused: boolean }) => {
  const { role } = useAuth();
  const { data: trainerProfile } = useMyTrainerProfile();
  const { data: traineeProfile } = useMyTraineeProfile();

  const imageUrl = role === 'TRAINER' ? trainerProfile?.profileImageUrl : traineeProfile?.avatarUrl;

  const avatarSize = 40;

  if (imageUrl) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          borderWidth: 2,
          borderColor: focused ? colors.primary : colors.border,
          marginTop: 14,
        }}
      />
    );
  }

  return <User size={size} color={color} />;
};

const TabLayout = () => {
  const { role } = useAuth();
  const isTrainer = role === 'TRAINER';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => {
            const { data: unread } = useUnreadMessageCount();
            const count = unread?.count ?? 0;
            return (
              <View>
                <MessageCircle size={size} color={color} />
                {count > 0 && (
                  <View
                    className="absolute -top-1 -right-2 bg-primary rounded-full h-4 min-w-[16px] items-center justify-center px-0.5"
                  >
                    <Text className="text-[9px] font-bold text-white">
                      {count > 9 ? '9+' : count}
                    </Text>
                  </View>
                )}
              </View>
            );
          },
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, size }) => (
            <Calendar size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: isTrainer ? 'Clients' : 'Diary',
          tabBarIcon: ({ color, size }) =>
            isTrainer ? (
              <Users size={size} color={color} />
            ) : (
              <BookHeart size={size} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '',
          tabBarIcon: ({ color, size, focused }) => (
            <AvatarTabIcon color={color} size={size} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabLayout;
