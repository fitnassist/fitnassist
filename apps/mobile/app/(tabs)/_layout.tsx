import { Tabs } from 'expo-router';
import {
  Home,
  MessageCircle,
  Calendar,
  Users,
  BookHeart,
  User,
} from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { colors } from '@/constants/theme';

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
          tabBarIcon: ({ color, size }) => (
            <MessageCircle size={size} color={color} />
          ),
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
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
};

export default TabLayout;
