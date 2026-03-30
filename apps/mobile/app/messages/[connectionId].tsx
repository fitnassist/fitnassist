import { useEffect, useRef, useState } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send } from 'lucide-react-native';
import { Text, Skeleton } from '@/components/ui';
import { useThread, useSendMessage, useMarkAsRead } from '@/api/message';
import { useAuth } from '@/hooks/useAuth';
import { formatMessageTime } from '@/lib/dates';
import { colors } from '@/constants/theme';

interface MessageData {
  id: string;
  senderId: string;
  content: string;
  createdAt: Date | string;
  sender: {
    id: string;
    name: string;
    image: string | null;
    trainerProfile?: { profileImageUrl: string | null } | null;
    traineeProfile?: { avatarUrl: string | null } | null;
  };
}

const MessageBubble = ({ message, isOwn, showAvatar }: { message: MessageData; isOwn: boolean; showAvatar: boolean }) => {
  const avatarUrl = message.sender.trainerProfile?.profileImageUrl
    ?? message.sender.traineeProfile?.avatarUrl
    ?? message.sender.image;

  return (
    <View className={`flex-row gap-2 px-4 py-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {!isOwn && (
        <View className="w-8">
          {showAvatar && (
            avatarUrl ? (
              <Image source={{ uri: avatarUrl }} className="w-8 h-8 rounded-full" />
            ) : (
              <View className="w-8 h-8 rounded-full bg-secondary items-center justify-center">
                <Text className="text-xs font-semibold text-foreground">
                  {message.sender.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )
          )}
        </View>
      )}

      <View className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
        <View
          className={`rounded-2xl px-3.5 py-2.5 ${
            isOwn ? 'bg-primary rounded-tr-sm' : 'bg-card border border-border rounded-tl-sm'
          }`}
        >
          <Text className={`text-sm ${isOwn ? 'text-white' : 'text-foreground'}`}>
            {message.content}
          </Text>
        </View>
        {showAvatar && (
          <Text className="text-[10px] text-muted-foreground mt-1 px-1">
            {formatMessageTime(String(message.createdAt))}
          </Text>
        )}
      </View>
    </View>
  );
};

const MessageThreadScreen = () => {
  const { connectionId } = useLocalSearchParams<{ connectionId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data: messages, isLoading, refetch } = useThread(connectionId ?? '');
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();
  const [text, setText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (connectionId) {
      markAsRead.mutate({ connectionId });
    }
  }, [connectionId, messages?.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 2000);
    return () => clearInterval(interval);
  }, [refetch]);

  const handleSend = () => {
    const content = text.trim();
    if (!content || !connectionId) return;

    setText('');
    sendMessage.mutate({ connectionId, content });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sortedMessages: MessageData[] = [...(messages ?? [])].sort(
    (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const isLastInGroup = (index: number): boolean => {
    if (index === sortedMessages.length - 1) return true;
    return sortedMessages[index]!.senderId !== sortedMessages[index + 1]!.senderId;
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Skeleton className="h-5 w-32 rounded" />
        </View>
        <View className="flex-1 px-4 gap-3 py-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-48 rounded-2xl" />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  const otherUser = sortedMessages.find((m) => m.senderId !== user?.id)?.sender;
  const headerName = otherUser?.name ?? 'Conversation';

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">{headerName}</Text>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList<MessageData>
          ref={flatListRef}
          data={sortedMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <MessageBubble
              message={item}
              isOwn={item.senderId === user?.id}
              showAvatar={isLastInGroup(index)}
            />
          )}
          contentContainerStyle={{ paddingVertical: 12 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Input */}
        <View className="flex-row items-end gap-2 px-4 py-3 border-t border-border">
          <View className="flex-1 bg-card border border-border rounded-2xl px-4 py-2 max-h-24">
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Type a message..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              className="text-sm text-foreground"
              style={{ fontSize: 14, padding: 0, margin: 0 }}
            />
          </View>
          <TouchableOpacity
            onPress={handleSend}
            disabled={!text.trim()}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              text.trim() ? 'bg-primary' : 'bg-secondary'
            }`}
          >
            <Send size={18} color={text.trim() ? '#fff' : colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default MessageThreadScreen;
