import { useState, useCallback } from 'react';
import { View, FlatList, TextInput as RNTextInput } from 'react-native';
import { TouchableOpacity } from 'react-native';
import { MapPin, X } from 'lucide-react-native';
import Constants from 'expo-constants';
import { Text } from './text';
import { Input } from './input';
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
  currentAddress?: { addressLine1?: string; city?: string; county?: string; postcode?: string };
  onSelect: (address: AddressResult) => void;
}

export const AddressInput = ({ currentAddress, onSelect }: AddressInputProps) => {
  const [isManual, setIsManual] = useState(false);
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<{ placeId: string; description: string }[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<AddressResult | null>(null);
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
    setPredictions([]);
    setQuery('');
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
      setSelectedAddress(addr);
      onSelect(addr);
    } catch {}
  }, [onSelect]);

  if (isManual) {
    return (
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-medium text-foreground">Manual Entry</Text>
          <TouchableOpacity onPress={() => setIsManual(false)}>
            <Text className="text-sm text-teal">Use address lookup</Text>
          </TouchableOpacity>
        </View>
        <Input label="Address Line 1 *" value={manual.addressLine1} onChangeText={(v) => setManual((m) => ({ ...m, addressLine1: v }))} placeholder="e.g. 123 High Street" />
        <Input label="Address Line 2" value={manual.addressLine2} onChangeText={(v) => setManual((m) => ({ ...m, addressLine2: v }))} placeholder="e.g. Flat 4" />
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Input label="City *" value={manual.city} onChangeText={(v) => setManual((m) => ({ ...m, city: v }))} placeholder="e.g. London" />
          </View>
          <View className="flex-1">
            <Input label="County" value={manual.county} onChangeText={(v) => setManual((m) => ({ ...m, county: v }))} placeholder="e.g. Greater London" />
          </View>
        </View>
        <Input label="Postcode *" value={manual.postcode} onChangeText={(v) => setManual((m) => ({ ...m, postcode: v.toUpperCase() }))} placeholder="e.g. SW1A 1AA" />
        <TouchableOpacity
          className="bg-teal/10 border border-teal rounded-lg py-2.5 items-center"
          onPress={() => {
            if (!manual.addressLine1 || !manual.city || !manual.postcode) return;
            const addr: AddressResult = {
              addressLine1: manual.addressLine1,
              addressLine2: manual.addressLine2,
              city: manual.city,
              county: manual.county,
              postcode: manual.postcode,
              country: 'GB',
              latitude: 0,
              longitude: 0,
              placeId: '',
            };
            setSelectedAddress(addr);
            onSelect(addr);
            setIsManual(false);
          }}
        >
          <Text className="text-sm font-medium text-teal">Confirm Address</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayAddress = selectedAddress ?? (currentAddress?.addressLine1 ? currentAddress as any : null);

  return (
    <View className="gap-2" style={{ zIndex: 10 }}>
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-medium text-foreground">Address</Text>
        <TouchableOpacity onPress={() => setIsManual(true)}>
          <Text className="text-sm text-teal">Enter manually</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center h-12 bg-background border border-border rounded-lg px-3">
        <MapPin size={16} color={colors.mutedForeground} />
        <RNTextInput
          value={query}
          onChangeText={search}
          placeholder="Start typing your address..."
          placeholderTextColor="hsl(230, 10%, 55%)"
          style={{ flex: 1, fontSize: 16, color: 'hsl(0, 0%, 95%)', marginLeft: 8, padding: 0, margin: 0 }}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setPredictions([]); }}>
            <X size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {predictions.length > 0 && (
        <View className="bg-card border border-border rounded-lg max-h-48 overflow-hidden">
          {predictions.map((p) => (
            <TouchableOpacity
              key={p.placeId}
              className="px-3 py-3 border-b border-border"
              onPress={() => selectPlace(p.placeId)}
            >
              <Text className="text-sm text-foreground" numberOfLines={1}>{p.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {displayAddress?.addressLine1 && !query && (
        <View className="bg-secondary rounded-lg p-3 gap-0.5">
          <Text className="text-sm font-medium text-foreground">{displayAddress.addressLine1}</Text>
          <Text className="text-xs text-muted-foreground">
            {[displayAddress.city, displayAddress.county, displayAddress.postcode].filter(Boolean).join(', ')}
          </Text>
        </View>
      )}

      <Text className="text-xs text-muted-foreground">
        Your full address is private. Only your postcode area will be shown publicly on the map.
      </Text>
    </View>
  );
};
