import { useState } from 'react';
import { View } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { TouchableOpacity } from 'react-native';
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
  const [manual, setManual] = useState({
    addressLine1: currentAddress?.addressLine1 ?? '',
    addressLine2: '',
    city: currentAddress?.city ?? '',
    county: currentAddress?.county ?? '',
    postcode: currentAddress?.postcode ?? '',
  });

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
          className="bg-teal/10 border border-teal rounded-lg py-2 items-center"
          onPress={() => {
            if (!manual.addressLine1 || !manual.city || !manual.postcode) return;
            onSelect({
              addressLine1: manual.addressLine1,
              addressLine2: manual.addressLine2,
              city: manual.city,
              county: manual.county,
              postcode: manual.postcode,
              country: 'GB',
              latitude: 0,
              longitude: 0,
              placeId: '',
            });
            setIsManual(false);
          }}
        >
          <Text className="text-sm font-medium text-teal">Confirm Address</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-medium text-foreground">Address</Text>
        <TouchableOpacity onPress={() => setIsManual(true)}>
          <Text className="text-sm text-teal">Enter manually</Text>
        </TouchableOpacity>
      </View>

      <GooglePlacesAutocomplete
        placeholder="Start typing your address..."
        onPress={(_data, details) => {
          if (!details) return;
          const get = (type: string) => details.address_components?.find((c: any) => c.types.includes(type))?.long_name ?? '';
          onSelect({
            addressLine1: `${get('street_number')} ${get('route')}`.trim(),
            city: get('postal_town') || get('locality'),
            county: get('administrative_area_level_2'),
            postcode: get('postal_code'),
            country: get('country'),
            latitude: details.geometry?.location?.lat ?? 0,
            longitude: details.geometry?.location?.lng ?? 0,
            placeId: details.place_id ?? '',
          });
        }}
        query={{
          key: GOOGLE_API_KEY,
          language: 'en',
          components: 'country:gb',
        }}
        fetchDetails
        enablePoweredByContainer={false}
        styles={{
          container: { flex: 0, zIndex: 10 },
          textInputContainer: {
            backgroundColor: 'transparent',
          },
          textInput: {
            height: 48,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: 'hsl(230, 15%, 22%)',
            backgroundColor: 'hsl(230, 20%, 10%)',
            color: 'hsl(0, 0%, 95%)',
            fontSize: 16,
            paddingHorizontal: 16,
          },
          predefinedPlacesDescription: { color: colors.teal },
          listView: {
            backgroundColor: 'hsl(230, 18%, 14%)',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: 'hsl(230, 15%, 22%)',
            marginTop: 4,
          },
          row: {
            backgroundColor: 'transparent',
            paddingVertical: 12,
            paddingHorizontal: 16,
          },
          separator: {
            backgroundColor: 'hsl(230, 15%, 22%)',
            height: 1,
          },
          description: {
            color: 'hsl(0, 0%, 95%)',
            fontSize: 14,
          },
          poweredContainer: { display: 'none' },
        }}
        textInputProps={{
          placeholderTextColor: 'hsl(230, 10%, 55%)',
          autoCapitalize: 'none',
        }}
      />

      {currentAddress?.addressLine1 && (
        <View className="bg-secondary rounded-lg p-3 gap-0.5">
          <Text className="text-sm font-medium text-foreground">{currentAddress.addressLine1}</Text>
          <Text className="text-xs text-muted-foreground">
            {[currentAddress.city, currentAddress.county, currentAddress.postcode].filter(Boolean).join(', ')}
          </Text>
        </View>
      )}

      <Text className="text-xs text-muted-foreground">
        Your full address is private. Only your postcode area will be shown publicly on the map.
      </Text>
    </View>
  );
};
