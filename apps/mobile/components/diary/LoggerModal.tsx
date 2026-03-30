import { View, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import { Text } from '@/components/ui';
import { colors } from '@/constants/theme';

interface LoggerModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const LoggerModal = ({ visible, onClose, title, children }: LoggerModalProps) => (
  <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
    <View className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
        <Text className="text-base font-semibold text-foreground">{title}</Text>
        <TouchableOpacity onPress={onClose}>
          <X size={24} color={colors.foreground} />
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-4 pb-8" keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  </Modal>
);
