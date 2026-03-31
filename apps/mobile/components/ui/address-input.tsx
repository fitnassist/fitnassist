import { useState, useCallback } from 'react';
import { View, TextInput, Modal, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { MapPin, X } from 'lucide-react-native';
import Constants from 'expo-constants';
import { Text } from './text';
import { Input } from './input';
import { Button } from './button';
import { useAlert } from './styled-alert';
import { colors } from '@/constants/theme';

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey ?? '';

export interface AddressResult {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  county: string;
  postcode: string;
  country: string;
  latitude: number;
  longitude: number;
  placeId: string;
}

interface AddressInputProps {
  value?: string;
  placeholder?: string;
  currentAddress?: { addressLine1?: string; city?: string; county?: string; postcode?: string };
  onSelect: (address: AddressResult) => void;
}

export const AddressInput = ({ value, placeholder, currentAddress, onSelect }: AddressInputProps) => {
  const { showAlert } = useAlert();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isManual, setIsManual] = useState(false);
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<{ placeId: string; description: string }[]>([]);
  const [selected, setSelected] = useState<AddressResult | null>(null);
  const [manual, setManual] = useState({
    addressLine1: currentAddress?.addressLine1 ?? '',
    addressLine2: '',
    city: currentAddress?.city ?? '',
    county: currentAddress?.county ?? '',
    postcode: currentAddress?.postcode ?? '',
  });

  const search = useCallback(async (text: string) => {
    setQuery(text);
    if (text.length < 3 || !GOOGLE_API_KEY) { setPredictions([]); return; }
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&components=country:gb&key=${GOOGLE_API_KEY}`
      );
      const data = await res.json();
      setPredictions((data.predictions ?? []).map((p: any) => ({ placeId: p.place_id, description: p.description })));
    } catch {
      setPredictions([]);
    }
  }, []);

  const selectPlace = useCallback(async (placeId: string) => {
    setSheetOpen(false);
    setQuery('');
    setPredictions([]);
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=address_components,geometry&key=${GOOGLE_API_KEY}`
      );
      const data = await res.json();
      const result = data.result;
      if (!result) return;
      const get = (type: string) => result.address_components?.find((c: any) => c.types.includes(type))?.long_name ?? '';
      const addr: AddressResult = {
        addressLine1: `${get('street_number')} ${get('route')}`.trim(),
        city: get('postal_town') || get('locality'),
        county: get('administrative_area_level_2'),
        postcode: get('postal_code'),
        country: get('country'),
        latitude: result.geometry?.location?.lat ?? 0,
        longitude: result.geometry?.location?.lng ?? 0,
        placeId,
      };
      setSelected(addr);
      onSelect(addr);
    } catch {
      showAlert({ title: 'Error', message: 'Failed to get address details' });
    }
  }, [onSelect, showAlert]);

  const handleManualConfirm = () => {
    if (!manual.addressLine1 || !manual.city || !manual.postcode) {
      showAlert({ title: 'Error', message: 'Address line 1, city, and postcode are required' });
      return;
    }
    const addr: AddressResult = {
      ...manual,
      country: 'GB',
      latitude: 0,
      longitude: 0,
      placeId: '',
    };
    setSelected(addr);
    onSelect(addr);
    closeSheet();
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setQuery('');
    setPredictions([]);
    setIsManual(false);
  };

  const displayAddress = selected ?? (currentAddress?.addressLine1 ? currentAddress as any : null);
  const displayLabel = value
    ?? (displayAddress?.addressLine1
      ? [displayAddress.addressLine1, displayAddress.city, displayAddress.postcode].filter(Boolean).join(', ')
      : null);

  return (
    <>
      {/* Trigger */}
      <TouchableOpacity
        onPress={() => setSheetOpen(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: 48,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          paddingHorizontal: 12,
          gap: 8,
        }}
      >
        <MapPin size={16} color={colors.mutedForeground} />
        <Text
          style={{ flex: 1, fontSize: 14, color: displayLabel ? colors.foreground : colors.mutedForeground }}
          numberOfLines={1}
        >
          {displayLabel ?? (placeholder ?? 'Search for your address...')}
        </Text>
      </TouchableOpacity>

      {/* Sheet */}
      <Modal visible={sheetOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeSheet}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, backgroundColor: colors.background }}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderColor: colors.border, gap: 12 }}>
            <TouchableOpacity onPress={closeSheet}>
              <X size={22} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: colors.foreground }}>Search Address</Text>
            <TouchableOpacity onPress={() => setIsManual(!isManual)}>
              <Text style={{ fontSize: 13, color: colors.teal }}>{isManual ? 'Use search' : 'Enter manually'}</Text>
            </TouchableOpacity>
          </View>

          {isManual ? (
            <View style={{ padding: 16, gap: 12 }}>
              <Input label="Address Line 1 *" value={manual.addressLine1} onChangeText={(v) => setManual((m) => ({ ...m, addressLine1: v }))} placeholder="e.g. 123 High Street" />
              <Input label="Address Line 2" value={manual.addressLine2} onChangeText={(v) => setManual((m) => ({ ...m, addressLine2: v }))} placeholder="e.g. Flat 4" />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Input label="City *" value={manual.city} onChangeText={(v) => setManual((m) => ({ ...m, city: v }))} placeholder="e.g. London" />
                </View>
                <View style={{ flex: 1 }}>
                  <Input label="County" value={manual.county} onChangeText={(v) => setManual((m) => ({ ...m, county: v }))} placeholder="e.g. Essex" />
                </View>
              </View>
              <Input label="Postcode *" value={manual.postcode} onChangeText={(v) => setManual((m) => ({ ...m, postcode: v.toUpperCase() }))} placeholder="e.g. SW1A 1AA" />
              <Button onPress={handleManualConfirm}>Confirm Address</Button>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', margin: 16, height: 44, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, gap: 8 }}>
                <MapPin size={16} color={colors.mutedForeground} />
                <TextInput
                  value={query}
                  onChangeText={search}
                  placeholder="Start typing your address..."
                  placeholderTextColor={colors.mutedForeground}
                  style={{ flex: 1, fontSize: 14, color: colors.foreground }}
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {query.length > 0 && (
                  <TouchableOpacity onPress={() => { setQuery(''); setPredictions([]); }}>
                    <X size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                )}
              </View>

              <FlatList
                data={predictions}
                keyExtractor={(p) => p.placeId}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 10 }}
                    onPress={() => selectPlace(item.placeId)}
                  >
                    <MapPin size={14} color={colors.mutedForeground} />
                    <Text style={{ flex: 1, fontSize: 14, color: colors.foreground }} numberOfLines={2}>{item.description}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={{ padding: 24, alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, color: colors.mutedForeground }}>
                      {query.length >= 3 ? 'No results found' : 'Type at least 3 characters to search'}
                    </Text>
                  </View>
                }
              />
            </>
          )}
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};
