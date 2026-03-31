import { useState } from 'react';
import { View, ScrollView, Alert, TextInput, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Plus, Trash2, MapPin, X } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { Text, Button, Input, Card, CardContent, TabBar, AddressInput, DatePicker, Badge, useAlert } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { authClient } from '@/lib/auth';
import { hasFeatureAccess } from '@fitnassist/schemas';
import { colors } from '@/constants/theme';

const GOOGLE_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey ?? '';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;

// ===== ACCOUNT TAB =====
const AccountTab = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [newEmail, setNewEmail] = useState('');
  const [emailPw, setEmailPw] = useState('');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const updateName = trpc.user.updateName.useMutation();

  return (
    <View className="gap-4">
      <Card>
        <CardContent className="py-4 px-4 gap-3">
          <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Display Name</Text>
          <Text className="text-xs text-muted-foreground">Update the name displayed on your profile and throughout the site.</Text>
          <Input label="Name" value={name} onChangeText={setName} placeholder="Your name" />
          <Button size="sm" loading={updateName.isPending} onPress={async () => {
            if (!name.trim()) return;
            try { await updateName.mutateAsync({ name: name.trim() }); Alert.alert('Success', 'Name updated'); } catch { Alert.alert('Error', 'Failed to update name'); }
          }}>Update Name</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4 px-4 gap-3">
          <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Change Email</Text>
          <Text className="text-xs text-muted-foreground">Update your email address. You'll need to verify the new email before it takes effect.</Text>
          <Text className="text-xs text-muted-foreground">Current: {user?.email}</Text>
          <Input label="New Email Address" value={newEmail} onChangeText={setNewEmail} placeholder="your.new@email.com" keyboardType="email-address" />
          <Input label="Current Password" value={emailPw} onChangeText={setEmailPw} placeholder="Enter your current password" secureTextEntry />
          <Button size="sm" onPress={async () => {
            if (!newEmail.trim() || !emailPw) return;
            try { await (authClient as any).changeEmail({ newEmail: newEmail.trim(), currentPassword: emailPw }); Alert.alert('Success', 'Check your new email for verification'); setNewEmail(''); setEmailPw(''); } catch { Alert.alert('Error', 'Failed to change email'); }
          }}>Update Email</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4 px-4 gap-3">
          <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Change Password</Text>
          <Text className="text-xs text-muted-foreground">Update your password. Use a strong password with at least 8 characters.</Text>
          <Input label="Current Password" value={currentPw} onChangeText={setCurrentPw} placeholder="Enter current password" secureTextEntry />
          <Input label="New Password" value={newPw} onChangeText={setNewPw} placeholder="Enter new password" secureTextEntry />
          <Input label="Confirm New Password" value={confirmPw} onChangeText={setConfirmPw} placeholder="Confirm new password" secureTextEntry />
          <Button size="sm" onPress={async () => {
            if (newPw !== confirmPw) { Alert.alert('Error', 'Passwords do not match'); return; }
            if (newPw.length < 8) { Alert.alert('Error', 'Password must be at least 8 characters'); return; }
            try { await authClient.changePassword({ currentPassword: currentPw, newPassword: newPw }); Alert.alert('Success', 'Password updated'); setCurrentPw(''); setNewPw(''); setConfirmPw(''); } catch { Alert.alert('Error', 'Failed to update password'); }
          }}>Update Password</Button>
        </CardContent>
      </Card>
    </View>
  );
};

// ===== SCHEDULING TAB =====
const BUFFER_OPTIONS = [
  { value: 0, label: 'No buffer' },
  { value: 5, label: '5 minutes' },
  { value: 10, label: '10 minutes' },
  { value: 15, label: '15 minutes' },
  { value: 20, label: '20 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '60 minutes' },
  { value: 90, label: '90 minutes' },
  { value: 120, label: '120 minutes' },
];

// LocationAddressInput removed - using shared AddressInput component

const SchedulingTab = () => {
  const { data: weekly, refetch: refetchWeekly } = trpc.availability.getWeekly.useQuery();
  const { data: travel, refetch: refetchTravel } = trpc.availability.getTravelSettings.useQuery();
  const { data: video, refetch: refetchVideo } = trpc.availability.getVideoSettings.useQuery();
  const { data: overrides, refetch: refetchOverrides } = trpc.availability.getOverrides.useQuery({
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 90 * 86400000).toISOString(),
  });
  const { data: locations, refetch: refetchLocations } = trpc.sessionLocation.list.useQuery();
  const updateLocation = trpc.sessionLocation.update.useMutation();

  const setWeekly = trpc.availability.setWeekly.useMutation();
  const updateTravel = trpc.availability.updateTravelSettings.useMutation();
  const updateVideo = trpc.availability.updateVideoSettings.useMutation();
  const createOverride = trpc.availability.createOverride.useMutation();
  const deleteOverride = trpc.availability.deleteOverride.useMutation();
  const createLocation = trpc.sessionLocation.create.useMutation();
  const deleteLocation = trpc.sessionLocation.delete.useMutation();

  const [newSlotDay, setNewSlotDay] = useState('MONDAY');
  const [newSlotStart, setNewSlotStart] = useState('09:00');
  const [newSlotEnd, setNewSlotEnd] = useState('17:00');
  const [newSlotDuration, setNewSlotDuration] = useState('60');
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showBlockDate, setShowBlockDate] = useState(false);
  const [newBlockDate, setNewBlockDate] = useState('');
  const [newBlockReason, setNewBlockReason] = useState('');
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationAddress, setNewLocationAddress] = useState('');
  const [newLocationLatLng, setNewLocationLatLng] = useState<{ latitude: number; longitude: number; placeId: string } | null>(null);
  const [travelBuffer, setTravelBuffer] = useState((travel as any)?.travelBufferMin ?? 15);
  const [smartTravel, setSmartTravel] = useState((travel as any)?.smartTravelEnabled ?? false);
  const [offersVideo, setOffersVideo] = useState((video as any)?.offersVideoSessions ?? false);
  const [videoFree, setVideoFree] = useState((video as any)?.videoCallsFree ?? false);

  const slots = (weekly ?? []) as any[];
  const overridesList = (overrides ?? []) as any[];
  const locationsList = (locations ?? []) as any[];

  // Group slots by day
  const slotsByDay = new Map<string, any[]>();
  for (const day of DAYS) slotsByDay.set(day, []);
  for (const slot of slots) {
    const list = slotsByDay.get(slot.dayOfWeek) ?? [];
    list.push(slot);
    slotsByDay.set(slot.dayOfWeek, list);
  }

  const handleAddSlot = () => {
    const dur = parseInt(newSlotDuration);
    if (dur < 15 || dur > 180) { Alert.alert('Error', 'Duration must be 15-180 minutes'); return; }
    const updated = [...slots, { dayOfWeek: newSlotDay, startTime: newSlotStart, endTime: newSlotEnd, sessionDurationMin: dur }];
    setWeekly.mutate({ slots: updated } as any, { onSuccess: () => { refetchWeekly(); setShowAddSlot(false); } });
  };

  const handleRemoveSlot = (index: number) => {
    const updated = slots.filter((_: any, i: number) => i !== index);
    setWeekly.mutate({ slots: updated } as any, { onSuccess: () => refetchWeekly() });
  };

  return (
    <View className="gap-4">
      {/* Weekly Schedule */}
      <Card>
        <CardContent className="py-4 px-4 gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Weekly Availability</Text>
            <TouchableOpacity onPress={() => setShowAddSlot(!showAddSlot)}>
              <Text className="text-sm text-teal">{showAddSlot ? 'Cancel' : '+ Add'}</Text>
            </TouchableOpacity>
          </View>

          {DAYS.map((day) => {
            const daySlots = slotsByDay.get(day) ?? [];
            return (
              <View key={day} className="py-1">
                <Text className="text-xs font-medium text-muted-foreground mb-1">{day}</Text>
                {daySlots.length === 0 ? (
                  <Text className="text-xs text-muted-foreground/50">No availability</Text>
                ) : (
                  daySlots.map((slot: any, i: number) => {
                    const globalIndex = slots.indexOf(slot);
                    return (
                      <View key={i} className="flex-row items-center justify-between py-1">
                        <Text className="text-sm text-foreground">{slot.startTime} - {slot.endTime} ({slot.sessionDurationMin ?? 60}min)</Text>
                        <TouchableOpacity onPress={() => handleRemoveSlot(globalIndex)}>
                          <Trash2 size={14} color={colors.destructive} />
                        </TouchableOpacity>
                      </View>
                    );
                  })
                )}
              </View>
            );
          })}

          {showAddSlot && (
            <View className="bg-secondary/50 rounded-lg p-3 gap-3 border border-border">
              <View className="flex-row flex-wrap gap-1">
                {DAYS.map((d) => (
                  <TouchableOpacity key={d} className={`px-2 py-1.5 rounded ${newSlotDay === d ? 'bg-teal' : 'bg-card border border-border'}`} onPress={() => setNewSlotDay(d)}>
                    <Text className={`text-xs ${newSlotDay === d ? 'text-teal-foreground' : 'text-muted-foreground'}`}>{d.slice(0, 3)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View className="flex-row gap-2">
                <View className="flex-1"><Input label="Start" value={newSlotStart} onChangeText={setNewSlotStart} placeholder="09:00" /></View>
                <View className="flex-1"><Input label="End" value={newSlotEnd} onChangeText={setNewSlotEnd} placeholder="17:00" /></View>
                <View className="flex-1"><Input label="Duration" value={newSlotDuration} onChangeText={setNewSlotDuration} placeholder="60" keyboardType="number-pad" /></View>
              </View>
              <Text className="text-xs text-muted-foreground">Duration: 15-180 min</Text>
              <Button size="sm" onPress={handleAddSlot} loading={setWeekly.isPending}>Add Slot</Button>
            </View>
          )}
        </CardContent>
      </Card>

      {/* Session Locations */}
      <Card>
        <CardContent className="py-4 px-4 gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Session Locations</Text>
            <TouchableOpacity onPress={() => setShowAddLocation(!showAddLocation)}>
              <Text className="text-sm text-teal">{showAddLocation ? 'Cancel' : '+ Add'}</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-xs text-muted-foreground">Where you offer training sessions.</Text>

          {locationsList.length === 0 && !showAddLocation && (
            <Text className="text-xs text-muted-foreground">No locations added yet.</Text>
          )}

          {locationsList.map((loc: any) => (
            <View key={loc.id} className="flex-row items-center justify-between py-2 border-b border-border">
              <View className="flex-1 gap-0.5">
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm font-medium text-foreground">{loc.name}</Text>
                  {loc.isDefault && <View className="bg-teal/20 rounded px-1.5 py-0.5"><Text className="text-[10px] text-teal">Default</Text></View>}
                  {!loc.isActive && <View className="bg-secondary rounded px-1.5 py-0.5"><Text className="text-[10px] text-muted-foreground">Inactive</Text></View>}
                </View>
                {(loc.city || loc.postcode) && (
                  <Text className="text-xs text-muted-foreground">{[loc.addressLine1, loc.city, loc.postcode].filter(Boolean).join(', ')}</Text>
                )}
              </View>
              <View className="flex-row items-center gap-2">
                {!loc.isDefault && (
                  <TouchableOpacity onPress={() => updateLocation.mutate({ id: loc.id, isDefault: true } as any, { onSuccess: () => refetchLocations() })}>
                    <Text className="text-xs text-teal">Set Default</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => {
                  Alert.alert('Delete', `Remove ${loc.name}?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deleteLocation.mutate({ id: loc.id }, { onSuccess: () => refetchLocations() }) },
                  ]);
                }}>
                  <Trash2 size={14} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {showAddLocation && (
            <View className="bg-secondary/50 rounded-lg p-3 gap-3 border border-border">
              <Input label="Name" value={newLocationName} onChangeText={setNewLocationName} placeholder="e.g. Home Gym" />
              <AddressInput
                currentAddress={{}}
                onSelect={(addr) => {
                  setNewLocationAddress([addr.addressLine1, addr.city, addr.postcode].filter(Boolean).join(', '));
                  setNewLocationLatLng({ latitude: addr.latitude, longitude: addr.longitude, placeId: addr.placeId });
                }}
              />
              <View className="flex-row gap-2">
                <Button size="sm" className="flex-1" disabled={!newLocationName.trim()} onPress={() => {
                  createLocation.mutate({
                    name: newLocationName,
                    address: newLocationAddress,
                    ...(newLocationLatLng ?? {}),
                  } as any, {
                    onSuccess: () => { refetchLocations(); setNewLocationName(''); setNewLocationAddress(''); setNewLocationLatLng(null); setShowAddLocation(false); },
                  });
                }} loading={createLocation.isPending}>Add Location</Button>
                <Button size="sm" variant="outline" className="flex-1" onPress={() => setShowAddLocation(false)}>Cancel</Button>
              </View>
            </View>
          )}
        </CardContent>
      </Card>

      {/* Travel Settings */}
      <Card>
        <CardContent className="py-4 px-4 gap-3">
          <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Travel Settings</Text>
          <View className="gap-1">
            <Text className="text-xs font-medium text-foreground">Travel buffer between sessions</Text>
            <Text className="text-xs text-muted-foreground">Minimum time between sessions to account for travel.</Text>
          </View>
          <View className="flex-row flex-wrap gap-1">
            {BUFFER_OPTIONS.map(({ value, label }) => (
              <TouchableOpacity
                key={value}
                className={`px-3 py-2 rounded-lg border ${travelBuffer === value ? 'border-teal bg-teal/10' : 'border-border'}`}
                onPress={() => setTravelBuffer(value)}
              >
                <Text className={`text-xs ${travelBuffer === value ? 'text-teal' : 'text-muted-foreground'}`}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View className="flex-row items-center justify-between py-2">
            <View className="flex-1 gap-0.5">
              <Text className="text-sm text-foreground">Smart travel time</Text>
              <Text className="text-xs text-muted-foreground">Use Google Maps to calculate actual travel time.</Text>
            </View>
            <Switch value={smartTravel} onValueChange={setSmartTravel} trackColor={{ false: colors.muted, true: colors.teal }} thumbColor="#fff" />
          </View>
          <Button size="sm" variant="outline" onPress={() => {
            updateTravel.mutate({ travelBufferMin: travelBuffer, smartTravelEnabled: smartTravel } as any, {
              onSuccess: () => { refetchTravel(); Alert.alert('Success', 'Travel settings saved'); },
            });
          }} loading={updateTravel.isPending}>Save</Button>
        </CardContent>
      </Card>

      {/* Video Settings */}
      <Card>
        <CardContent className="py-4 px-4 gap-3">
          <View className="flex-row items-center gap-2">
            <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Video Sessions</Text>
            <View className="bg-primary/20 rounded px-1.5 py-0.5"><Text className="text-[10px] text-primary font-medium">ELITE</Text></View>
          </View>
          <View className="flex-row items-center justify-between py-2">
            <View className="flex-1 gap-0.5">
              <Text className="text-sm text-foreground">Offer video sessions</Text>
              <Text className="text-xs text-muted-foreground">Allow clients to book video call sessions with you.</Text>
            </View>
            <Switch value={offersVideo} onValueChange={(v) => {
              setOffersVideo(v);
              if (!v) setVideoFree(false);
              updateVideo.mutate({ offersVideoSessions: v, ...(v ? {} : { videoCallsFree: false }) } as any, { onSuccess: () => refetchVideo() });
            }} trackColor={{ false: colors.muted, true: colors.teal }} thumbColor="#fff" />
          </View>
          {offersVideo && (
            <View className="flex-row items-center justify-between py-2">
              <View className="flex-1 gap-0.5">
                <Text className="text-sm text-foreground">Video calls are free</Text>
                <Text className="text-xs text-muted-foreground">No payment required for video call sessions.</Text>
              </View>
              <Switch value={videoFree} onValueChange={(v) => {
                setVideoFree(v);
                updateVideo.mutate({ offersVideoSessions: true, videoCallsFree: v } as any, { onSuccess: () => refetchVideo() });
              }} trackColor={{ false: colors.muted, true: colors.teal }} thumbColor="#fff" />
            </View>
          )}
        </CardContent>
      </Card>

      {/* Date Overrides */}
      <Card>
        <CardContent className="py-4 px-4 gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Blocked Dates</Text>
            <TouchableOpacity onPress={() => setShowBlockDate(!showBlockDate)}>
              <Text className="text-sm text-teal">{showBlockDate ? 'Cancel' : 'Block Date'}</Text>
            </TouchableOpacity>
          </View>

          {overridesList.length === 0 && !showBlockDate && (
            <Text className="text-xs text-muted-foreground">No blocked dates.</Text>
          )}

          {overridesList.map((o: any) => (
            <View key={o.id} className="flex-row items-center justify-between py-2 border-b border-border">
              <View>
                <Text className="text-sm text-foreground">
                  {new Date(o.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
                {o.reason && <Text className="text-xs text-muted-foreground">{o.reason}</Text>}
              </View>
              <TouchableOpacity onPress={() => {
                Alert.alert('Unblock', 'Remove this blocked date?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Unblock', onPress: () => deleteOverride.mutate({ id: o.id }, { onSuccess: () => refetchOverrides() }) },
                ]);
              }}>
                <Trash2 size={14} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          ))}

          {showBlockDate && (
            <View className="bg-secondary/50 rounded-lg p-3 gap-3 border border-border">
              <DatePicker
                value={newBlockDate}
                onChange={setNewBlockDate}
                minDate={new Date()}
                placeholder="Select date to block"
              />
              <Input label="Reason (optional)" value={newBlockReason} onChangeText={setNewBlockReason} placeholder="e.g. Holiday" />
              <View className="flex-row gap-2">
                <Button size="sm" className="flex-1" disabled={!newBlockDate} onPress={() => {
                  createOverride.mutate({ date: newBlockDate, isBlocked: true, reason: newBlockReason || undefined } as any, {
                    onSuccess: () => { refetchOverrides(); setNewBlockDate(''); setNewBlockReason(''); setShowBlockDate(false); },
                  });
                }} loading={createOverride.isPending}>Block Date</Button>
                <Button size="sm" variant="outline" className="flex-1" onPress={() => setShowBlockDate(false)}>Cancel</Button>
              </View>
            </View>
          )}
        </CardContent>
      </Card>
    </View>
  );
};

// ===== PAYMENTS TAB =====
const PaymentsTab = () => {
  const { data: settings, refetch } = trpc.payment.getSettings.useQuery();
  const updateSettings = trpc.payment.updateSettings.useMutation();
  const updatePrice = trpc.payment.updateSessionPrice.useMutation();
  const createOnboarding = trpc.payment.createOnboardingLink.useMutation();
  const getDashboard = trpc.payment.getDashboardLink.useMutation();

  const s = settings as any;
  const isConnected = s?.stripeOnboardingComplete ?? false;
  const currentPrice = s?.sessionPrice?.amount ?? 0;
  const [price, setPrice] = useState(String(currentPrice / 100));

  return (
    <View className="gap-4">
      {/* Stripe Connect */}
      <Card>
        <CardContent className="py-4 px-4 gap-3">
          <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Stripe Connect</Text>
          <Text className="text-xs text-muted-foreground">
            {isConnected
              ? 'Your Stripe account is connected. You can accept session payments.'
              : 'Connect your Stripe account to accept session payments from clients.'}
          </Text>
          {isConnected ? (
            <View className="gap-2">
              <Button size="sm" variant="outline" onPress={async () => {
                try {
                  const result = await getDashboard.mutateAsync();
                  if ((result as any).url) await WebBrowser.openBrowserAsync((result as any).url);
                } catch { Alert.alert('Error', 'Failed to open Stripe dashboard'); }
              }} loading={getDashboard.isPending}>Open Stripe Dashboard</Button>
            </View>
          ) : (
            <Button size="sm" onPress={async () => {
              try {
                const result = await createOnboarding.mutateAsync();
                if ((result as any).url) { await WebBrowser.openBrowserAsync((result as any).url); refetch(); }
              } catch { Alert.alert('Error', 'Failed to start Stripe setup'); }
            }} loading={createOnboarding.isPending}>Connect Stripe</Button>
          )}
        </CardContent>
      </Card>

      {/* Payment Settings */}
      {isConnected && (
        <Card>
          <CardContent className="py-4 px-4 gap-3">
            <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Payment Settings</Text>

            <View className="flex-row items-center justify-between py-2">
              <View className="flex-1 gap-0.5">
                <Text className="text-sm text-foreground">Accept Payments</Text>
                <Text className="text-xs text-muted-foreground">Enable session payment collection from clients.</Text>
              </View>
              <Switch value={s?.paymentsEnabled ?? false} onValueChange={(v) => {
                updateSettings.mutate({ paymentsEnabled: v }, { onSuccess: () => refetch() });
              }} trackColor={{ false: colors.muted, true: colors.teal }} thumbColor="#fff" />
            </View>

            <View className="flex-row items-center justify-between py-2">
              <View className="flex-1 gap-0.5">
                <Text className="text-sm text-foreground">First Session Free</Text>
                <Text className="text-xs text-muted-foreground">New clients get their first session at no charge.</Text>
              </View>
              <Switch value={s?.firstSessionFree ?? false} onValueChange={(v) => {
                updateSettings.mutate({ firstSessionFree: v }, { onSuccess: () => refetch() });
              }} trackColor={{ false: colors.muted, true: colors.teal }} thumbColor="#fff" />
            </View>
          </CardContent>
        </Card>
      )}

      {/* Session Price */}
      {isConnected && (
        <Card>
          <CardContent className="py-4 px-4 gap-3">
            <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Session Price</Text>
            <Text className="text-xs text-muted-foreground">Set the price per session (£1 - £1,000).</Text>
            <Input label="Price per session (£)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="e.g. 45" />
            <Button size="sm" onPress={() => {
              const amount = Math.round(parseFloat(price) * 100);
              if (isNaN(amount) || amount < 100 || amount > 100000) { Alert.alert('Error', 'Price must be between £1 and £1,000'); return; }
              updatePrice.mutate({ amount, currency: 'gbp' }, { onSuccess: () => { refetch(); Alert.alert('Success', 'Session price updated'); } });
            }} loading={updatePrice.isPending}>Save Price</Button>
          </CardContent>
        </Card>
      )}

      {/* Cancellation Policy */}
      {isConnected && s?.cancellationPolicy && (
        <Card>
          <CardContent className="py-4 px-4 gap-3">
            <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Cancellation Policy</Text>
            <Text className="text-xs text-muted-foreground">
              Full refund: {s.cancellationPolicy.fullRefundHours}h before · Partial refund: {s.cancellationPolicy.partialRefundPercent}% if cancelled {s.cancellationPolicy.partialRefundHours}h before
            </Text>
            <Text className="text-xs text-muted-foreground">Edit cancellation policy in the web app for full control.</Text>
          </CardContent>
        </Card>
      )}
    </View>
  );
};

// ===== INTEGRATIONS TAB =====
const PROVIDER_META: Record<string, { name: string; description: string; color: string; dataTypes: string[]; authPath: string }> = {
  STRAVA: { name: 'Strava', description: 'Sync runs, rides, swims and other activities', color: '#FC4C02', dataTypes: ['Activities', 'GPS Routes', 'Heart Rate'], authPath: '/api/integrations/strava/auth' },
  GOOGLE_FIT: { name: 'Google Fit', description: 'Sync steps, sleep, weight and activities', color: '#4285F4', dataTypes: ['Steps', 'Sleep', 'Weight', 'Activities'], authPath: '/api/integrations/google-fit/auth' },
  FITBIT: { name: 'Fitbit', description: 'Sync steps, sleep, heart rate, water and weight', color: '#00B0B9', dataTypes: ['Steps', 'Sleep', 'Heart Rate', 'Water', 'Weight'], authPath: '/api/integrations/fitbit/auth' },
  GARMIN: { name: 'Garmin', description: 'Sync activities, steps, sleep and body data', color: '#007CC3', dataTypes: ['Activities', 'Steps', 'Sleep', 'Weight'], authPath: '/api/integrations/garmin/auth' },
};

const SYNC_PREF_LABELS: Record<string, string> = { activities: 'Activities', steps: 'Steps', sleep: 'Sleep', weight: 'Weight', water: 'Water' };

const apiUrl = Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:3001';

const IntegrationsTab = () => {
  const { data: providers } = trpc.integration.availableProviders.useQuery();
  const { data: connections, refetch } = trpc.integration.list.useQuery();
  const disconnectMut = trpc.integration.disconnect.useMutation();
  const updatePrefsMut = trpc.integration.updatePreferences.useMutation();
  const { showAlert } = useAlert();

  const availableProviders = (providers ?? []) as string[];
  const connectionMap = new Map(((connections ?? []) as any[]).map((c: any) => [c.provider, c]));

  if (availableProviders.length === 0) {
    return (
      <View className="items-center justify-center py-12 gap-2">
        <Text className="text-base text-muted-foreground">No integrations available yet.</Text>
      </View>
    );
  }

  return (
    <View className="gap-4">
      <Card>
        <CardContent className="py-4 px-4 gap-1">
          <Text className="text-sm font-medium text-teal uppercase" style={{ letterSpacing: 1 }}>Connected Apps</Text>
          <Text className="text-xs text-muted-foreground mb-2">Connect your fitness apps to automatically sync activities, steps, sleep and more.</Text>
        </CardContent>
      </Card>

      {availableProviders.map((providerKey) => {
        const meta = PROVIDER_META[providerKey];
        if (!meta) return null;
        const connection = connectionMap.get(providerKey) as any;
        const isConnected = connection && connection.status !== 'DISCONNECTED';
        const prefs = (connection?.syncPreferences ?? { activities: true, steps: true, sleep: true, weight: true, water: true }) as Record<string, boolean>;

        return (
          <Card key={providerKey}>
            <CardContent className="py-4 px-4 gap-3">
              <View className="flex-row items-start gap-3">
                <View className="w-10 h-10 rounded-lg items-center justify-center" style={{ backgroundColor: meta.color }}>
                  <Text className="text-white font-bold text-sm">{meta.name.charAt(0)}</Text>
                </View>
                <View className="flex-1 gap-0.5">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-sm font-semibold text-foreground">{meta.name}</Text>
                    {isConnected && (
                      <Badge variant={connection.status === 'ERROR' ? 'destructive' : 'default'}>
                        {connection.status === 'SYNCING' ? 'Syncing...' : connection.status === 'ERROR' ? 'Error' : 'Connected'}
                      </Badge>
                    )}
                  </View>
                  <Text className="text-xs text-muted-foreground">{meta.description}</Text>
                  {isConnected && connection.lastSyncAt && (
                    <Text className="text-xs text-muted-foreground">Last synced: {new Date(connection.lastSyncAt).toLocaleDateString()}</Text>
                  )}
                  {isConnected && connection.lastSyncError && (
                    <Text className="text-xs text-destructive">{connection.lastSyncError}</Text>
                  )}
                  {isConnected && !connection.initialImportComplete && (
                    <Text className="text-xs text-muted-foreground">Importing history...</Text>
                  )}
                </View>
                {isConnected ? (
                  <Button size="sm" variant="outline" onPress={() => {
                    showAlert({
                      title: `Disconnect ${meta.name}?`,
                      message: `This will stop syncing data from ${meta.name}. Your existing diary entries will not be deleted.`,
                      actions: [
                        { label: 'Disconnect', variant: 'destructive', onPress: () => disconnectMut.mutate({ provider: providerKey } as any, { onSuccess: () => refetch() }) },
                        { label: 'Cancel', variant: 'outline' },
                      ],
                    });
                  }}>Disconnect</Button>
                ) : (
                  <Button size="sm" onPress={async () => {
                    await WebBrowser.openBrowserAsync(`${apiUrl}${meta.authPath}`);
                    refetch();
                  }}>Connect</Button>
                )}
              </View>

              {/* Sync preferences */}
              {isConnected && (
                <View className="mt-2 pt-3 border-t border-border gap-2">
                  <Text className="text-xs font-medium text-foreground">Sync preferences</Text>
                  {Object.entries(SYNC_PREF_LABELS).map(([key, label]) => (
                    <View key={key} className="flex-row items-center justify-between py-1">
                      <Text className="text-sm text-foreground">{label}</Text>
                      <Switch
                        value={prefs[key] ?? true}
                        onValueChange={(v) => updatePrefsMut.mutate({ provider: providerKey, preferences: { ...prefs, [key]: v } } as any, { onSuccess: () => refetch() })}
                        trackColor={{ false: colors.muted, true: colors.teal }}
                        thumbColor="#fff"
                      />
                    </View>
                  ))}
                </View>
              )}

              {/* Data types when not connected */}
              {!isConnected && (
                <View className="flex-row flex-wrap gap-1 mt-1">
                  {meta.dataTypes.map((type) => (
                    <View key={type} className="bg-secondary rounded px-2 py-0.5">
                      <Text className="text-xs text-muted-foreground">{type}</Text>
                    </View>
                  ))}
                </View>
              )}
            </CardContent>
          </Card>
        );
      })}
    </View>
  );
};

// ===== DANGER ZONE TAB =====
const DangerZoneTab = () => {
  const { signOut } = useAuth();

  return (
    <Card>
      <CardContent className="py-4 px-4 gap-3">
        <Text className="text-sm font-medium text-destructive uppercase" style={{ letterSpacing: 1 }}>Danger Zone</Text>
        <Text className="text-xs text-muted-foreground">Permanently delete your account and all associated data. This cannot be undone.</Text>
        <Button variant="destructive" size="sm" onPress={() => {
          Alert.alert('Delete Account', 'This action is permanent and cannot be undone. Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => {
              try { await authClient.deleteUser(); await signOut(); } catch { Alert.alert('Error', 'Failed to delete account'); }
            }},
          ]);
        }}>Delete Account</Button>
      </CardContent>
    </Card>
  );
};

// ===== MAIN SCREEN =====
type SettingsTab = 'account' | 'scheduling' | 'payments' | 'integrations' | 'danger';

const SettingsScreen = () => {
  const router = useRouter();
  const { role } = useAuth();
  const isTrainer = role === 'TRAINER';
  const { data: subscription } = trpc.subscription.getCurrent.useQuery(undefined, { enabled: isTrainer });
  const currentTier = (subscription?.effectiveTier ?? 'FREE') as 'FREE' | 'PRO' | 'ELITE';

  const [tab, setTab] = useState<SettingsTab>('account');

  const tabs: { key: SettingsTab; label: string }[] = [
    { key: 'account', label: 'Account' },
    ...(isTrainer ? [{ key: 'scheduling' as SettingsTab, label: 'Scheduling' }] : []),
    ...(isTrainer ? [{ key: 'payments' as SettingsTab, label: 'Payments' }] : []),
    ...(!isTrainer ? [{ key: 'integrations' as SettingsTab, label: 'Integrations' }] : []),
    { key: 'danger', label: 'Danger' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-foreground">Settings</Text>
      </View>

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      <ScrollView className="flex-1" contentContainerClassName="px-4 py-2 gap-4 pb-8">
        {tab === 'account' && <AccountTab />}
        {tab === 'scheduling' && (
          hasFeatureAccess(currentTier, 'booking') ? <SchedulingTab /> : (
            <Card><CardContent className="py-6 px-4 items-center gap-2">
              <Text className="text-sm text-muted-foreground text-center">Upgrade to Pro to access scheduling settings.</Text>
              <Button size="sm" onPress={() => router.push('/dashboard/subscription')}>Upgrade</Button>
            </CardContent></Card>
          )
        )}
        {tab === 'payments' && (
          hasFeatureAccess(currentTier, 'sessionPayments') ? <PaymentsTab /> : (
            <Card><CardContent className="py-6 px-4 items-center gap-2">
              <Text className="text-sm text-muted-foreground text-center">Upgrade to Elite to access payment settings.</Text>
              <Button size="sm" onPress={() => router.push('/dashboard/subscription')}>Upgrade</Button>
            </CardContent></Card>
          )
        )}
        {tab === 'integrations' && <IntegrationsTab />}
        {tab === 'danger' && <DangerZoneTab />}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SettingsScreen;
