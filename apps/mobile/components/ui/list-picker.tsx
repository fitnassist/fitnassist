import { useState, useMemo } from 'react';
import { View, FlatList, TextInput, Modal, Image } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { Check, Search, X } from 'lucide-react-native';
import { Text } from './text';
import { colors } from '@/constants/theme';

export interface ListPickerItem {
  id: string;
  label: string;
  description?: string;
  avatarUrl?: string;
}

interface ListPickerProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  items: ListPickerItem[];
  onSelect: (item: ListPickerItem) => void;
  selectedIds?: string[];
  searchable?: boolean;
  multi?: boolean;
}

export const ListPicker = ({
  visible,
  onClose,
  title,
  items,
  onSelect,
  selectedIds = [],
  searchable = true,
  multi = false,
}: ListPickerProps) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q),
    );
  }, [items, search]);

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
          <Text className="text-base font-semibold text-foreground">{title}</Text>
          <TouchableOpacity onPress={handleClose}>
            <X size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        {searchable && (
          <View className="px-4 pt-3 pb-2">
            <View className="flex-row items-center h-10 bg-card border border-border rounded-lg px-3">
              <Search size={16} color={colors.mutedForeground} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search..."
                placeholderTextColor={colors.mutedForeground}
                className="flex-1 text-foreground ml-2"
                style={{ fontSize: 14, padding: 0, margin: 0 }}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <X size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* List */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
          renderItem={({ item }) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <TouchableOpacity
                className={`flex-row items-center py-3.5 px-4 border-b border-border gap-3 ${isSelected ? 'bg-teal/5' : ''}`}
                onPress={() => {
                  onSelect(item);
                  if (!multi) handleClose();
                }}
                activeOpacity={0.6}
              >
                {(item.avatarUrl !== undefined) && (
                  item.avatarUrl ? (
                    <Image source={{ uri: item.avatarUrl }} className="w-9 h-9 rounded-full" />
                  ) : (
                    <View className="w-9 h-9 rounded-full bg-secondary items-center justify-center">
                      <Text className="text-sm font-semibold text-foreground">{item.label.charAt(0)}</Text>
                    </View>
                  )
                )}
                <View className="flex-1 gap-0.5">
                  <Text className="text-sm text-foreground">{item.label}</Text>
                  {item.description && (
                    <Text className="text-xs text-muted-foreground">{item.description}</Text>
                  )}
                </View>
                {isSelected && <Check size={18} color={colors.teal} />}
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Text className="text-sm text-muted-foreground">
                {search ? 'No results found' : 'No items available'}
              </Text>
            </View>
          }
        />
      </View>
    </Modal>
  );
};
