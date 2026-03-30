import { View, TouchableOpacity, Image } from 'react-native';
import { Text } from '@/components/ui';
import { formatDistanceToNow } from '@/lib/dates';
import { colors } from '@/constants/theme';

interface ConversationItemProps {
  id: string;
  name: string;
  imageUrl: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  status?: string;
  onPress: () => void;
  onLongPress?: () => void;
}

export const ConversationItem = ({
  name,
  imageUrl,
  lastMessage,
  lastMessageAt,
  unreadCount,
  status,
  onPress,
  onLongPress,
}: ConversationItemProps) => {
  const isDisconnected = status === 'CLOSED';
  const hasUnread = unreadCount > 0;

  return (
    <TouchableOpacity
      className="flex-row items-center px-4 py-3 gap-3"
      activeOpacity={0.6}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} className="w-12 h-12 rounded-full" />
      ) : (
        <View className="w-12 h-12 rounded-full bg-secondary items-center justify-center">
          <Text className="text-base font-semibold text-foreground">
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <View className="flex-1 gap-0.5">
        <View className="flex-row items-center justify-between">
          <Text
            className={`text-base ${hasUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground'}`}
            numberOfLines={1}
          >
            {name}
          </Text>
          {lastMessageAt && (
            <Text className="text-xs text-muted-foreground">
              {formatDistanceToNow(lastMessageAt)}
            </Text>
          )}
        </View>
        <View className="flex-row items-center justify-between">
          <Text
            className={`text-sm flex-1 mr-2 ${hasUnread ? 'text-foreground' : 'text-muted-foreground'}`}
            numberOfLines={1}
          >
            {isDisconnected ? 'Disconnected' : (lastMessage ?? 'No messages yet')}
          </Text>
          {hasUnread && (
            <View
              className="rounded-full h-5 min-w-[20px] items-center justify-center px-1"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};
