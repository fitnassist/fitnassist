import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  Dimensions,
  BackHandler,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { useKeepAwake } from "expo-keep-awake";
import MapView, { Polyline, Marker, PROVIDER_DEFAULT } from "react-native-maps";
import {
  ArrowLeft,
  Play,
  Pause,
  Square,
  Save,
  Trash2,
  MapPin,
  Clock,
  Route,
  Gauge,
  Mountain,
} from "lucide-react-native";
import {
  Text,
  Card,
  CardContent,
  Button,
  Input,
  useAlert,
} from "@/components/ui";
import { trpc } from "@/lib/trpc";
import { colors } from "@/constants/theme";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TrackingState = "IDLE" | "ACTIVE" | "PAUSED" | "FINISHED";
type ActivityType = "RUN" | "WALK" | "CYCLE" | "HIKE";

interface Coordinate {
  latitude: number;
  longitude: number;
  altitude?: number | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACTIVITY_OPTIONS: { value: ActivityType; label: string }[] = [
  { value: "RUN", label: "Run" },
  { value: "WALK", label: "Walk" },
  { value: "CYCLE", label: "Cycle" },
  { value: "HIKE", label: "Hike" },
];

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#304a7d" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#255763" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0e1626" }],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const encodeValue = (value: number): string => {
  value = value < 0 ? ~(value << 1) : value << 1;
  let encoded = "";
  while (value >= 0x20) {
    encoded += String.fromCharCode((0x20 | (value & 0x1f)) + 63);
    value >>= 5;
  }
  encoded += String.fromCharCode(value + 63);
  return encoded;
};

const encodePolyline = (coordinates: Coordinate[]): string => {
  let encoded = "";
  let prevLat = 0;
  let prevLng = 0;
  for (const { latitude, longitude } of coordinates) {
    const lat = Math.round(latitude * 1e5);
    const lng = Math.round(longitude * 1e5);
    encoded += encodeValue(lat - prevLat) + encodeValue(lng - prevLng);
    prevLat = lat;
    prevLng = lng;
  }
  return encoded;
};

const formatDuration = (totalSeconds: number): string => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const formatPace = (secPerKm: number): string => {
  if (!isFinite(secPerKm) || secPerKm <= 0) return "--:--";
  const mins = Math.floor(secPerKm / 60);
  const secs = Math.round(secPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const formatDistance = (km: number): string => {
  if (km < 0.01) return "0.00";
  return km.toFixed(2);
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TrackingScreen = () => {
  useKeepAwake();

  const router = useRouter();
  const { showAlert } = useAlert();
  const mapRef = useRef<MapView>(null);

  // State
  const [state, setState] = useState<TrackingState>("IDLE");
  const [activityType, setActivityType] = useState<ActivityType>("RUN");
  const [coordinates, setCoordinates] = useState<Coordinate[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [totalElevation, setTotalElevation] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(
    null,
  );
  const [notes, setNotes] = useState("");
  const [calories, setCalories] = useState("");
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Refs
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef<TrackingState>("IDLE");
  const coordinatesRef = useRef<Coordinate[]>([]);
  const distanceRef = useRef(0);
  const elevationRef = useRef(0);

  // tRPC
  const logActivity = trpc.diary.logActivity.useMutation();
  const utils = trpc.useUtils();

  // Keep refs in sync
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // ---------------------------------------------------------------------------
  // Permissions
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const requestPermission = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "GPS tracking requires location permission. Please enable it in your device settings.",
          [{ text: "OK", onPress: () => router.back() }],
        );
        return;
      }
      setPermissionGranted(true);

      // Get initial location
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setCurrentLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          altitude: loc.coords.altitude,
        });
      } catch {
        // Silently fail - will get location when tracking starts
      }
    };
    requestPermission();
  }, []);

  // ---------------------------------------------------------------------------
  // Back handler - prevent accidental navigation during tracking
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const handleBack = () => {
      if (stateRef.current === "ACTIVE" || stateRef.current === "PAUSED") {
        Alert.alert(
          "Stop Tracking?",
          "You have an active tracking session. Are you sure you want to leave? Your progress will be lost.",
          [
            { text: "Stay", style: "cancel" },
            { text: "Leave", style: "destructive", onPress: () => cleanup() },
          ],
        );
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener("hardwareBackPress", handleBack);
    return () => sub.remove();
  }, []);

  // ---------------------------------------------------------------------------
  // Cleanup on unmount
  // ---------------------------------------------------------------------------

  const cleanup = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    router.back();
  }, [router]);

  useEffect(() => {
    return () => {
      if (subscriptionRef.current) subscriptionRef.current.remove();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Timer
  // ---------------------------------------------------------------------------

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      if (stateRef.current === "ACTIVE") {
        setTotalSeconds((prev) => prev + 1);
      }
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // GPS tracking
  // ---------------------------------------------------------------------------

  const startLocationTracking = useCallback(async () => {
    if (subscriptionRef.current) return;
    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 10,
        timeInterval: 3000,
      },
      (location) => {
        const coord: Coordinate = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude: location.coords.altitude,
        };

        setCurrentLocation(coord);

        if (stateRef.current !== "ACTIVE") return;

        const prevCoords = coordinatesRef.current;
        if (prevCoords.length > 0) {
          const last = prevCoords[prevCoords.length - 1]!;
          const dist = haversineDistance(
            last.latitude,
            last.longitude,
            coord.latitude,
            coord.longitude,
          );
          distanceRef.current += dist;
          setTotalDistance(distanceRef.current);

          // Elevation gain
          if (
            coord.altitude != null &&
            last.altitude != null &&
            coord.altitude > last.altitude
          ) {
            const gain = (coord.altitude - last.altitude) / 1000; // Convert m to km... no, keep in meters
            elevationRef.current += coord.altitude - last.altitude;
            setTotalElevation(elevationRef.current);
          }
        }

        coordinatesRef.current = [...prevCoords, coord];
        setCoordinates(coordinatesRef.current);

        // Center map on current location
        mapRef.current?.animateToRegion(
          {
            latitude: coord.latitude,
            longitude: coord.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          },
          300,
        );
      },
    );
    subscriptionRef.current = sub;
  }, []);

  const stopLocationTracking = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Controls
  // ---------------------------------------------------------------------------

  const handleStart = useCallback(async () => {
    coordinatesRef.current = [];
    distanceRef.current = 0;
    elevationRef.current = 0;
    setCoordinates([]);
    setTotalDistance(0);
    setTotalElevation(0);
    setTotalSeconds(0);

    setState("ACTIVE");
    startTimer();
    await startLocationTracking();
  }, [startTimer, startLocationTracking]);

  const handlePause = useCallback(() => {
    setState("PAUSED");
  }, []);

  const handleResume = useCallback(() => {
    setState("ACTIVE");
  }, []);

  const handleStop = useCallback(() => {
    stopTimer();
    stopLocationTracking();
    setState("FINISHED");
  }, [stopTimer, stopLocationTracking]);

  const handleDiscard = useCallback(() => {
    showAlert({
      title: "Discard Activity",
      message: "Are you sure you want to discard this activity?",
      actions: [
        {
          label: "Discard",
          variant: "destructive",
          onPress: () => router.back(),
        },
        { label: "Cancel", variant: "outline" },
      ],
    });
  }, [showAlert, router]);

  const handleSave = useCallback(() => {
    const date = new Date().toISOString().split("T")[0]!;
    const coords = coordinatesRef.current;

    logActivity.mutate(
      {
        date,
        activityType,
        durationSeconds: totalSeconds,
        distanceKm:
          totalDistance > 0 ? parseFloat(totalDistance.toFixed(3)) : undefined,
        routePolyline: coords.length > 1 ? encodePolyline(coords) : undefined,
        startLatitude: coords[0]?.latitude,
        startLongitude: coords[0]?.longitude,
        endLatitude: coords[coords.length - 1]?.latitude,
        endLongitude: coords[coords.length - 1]?.longitude,
        elevationGainM:
          totalElevation > 0
            ? parseFloat(totalElevation.toFixed(1))
            : undefined,
        caloriesBurned: calories ? parseInt(calories, 10) : undefined,
        notes: notes || undefined,
        source: "MANUAL" as const,
      },
      {
        onSuccess: () => {
          utils.diary.getEntries.invalidate();
          router.back();
        },
        onError: () => {
          showAlert({
            title: "Error",
            message: "Failed to save activity. Please try again.",
          });
        },
      },
    );
  }, [
    activityType,
    totalSeconds,
    totalDistance,
    totalElevation,
    calories,
    notes,
    logActivity,
    utils,
    router,
    showAlert,
  ]);

  const handleBack = useCallback(() => {
    if (state === "ACTIVE" || state === "PAUSED") {
      Alert.alert(
        "Stop Tracking?",
        "You have an active tracking session. Are you sure you want to leave?",
        [
          { text: "Stay", style: "cancel" },
          {
            text: "Leave",
            style: "destructive",
            onPress: () => {
              stopTimer();
              stopLocationTracking();
              router.back();
            },
          },
        ],
      );
    } else {
      router.back();
    }
  }, [state, stopTimer, stopLocationTracking, router]);

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const pace = totalDistance > 0 ? totalSeconds / totalDistance : 0; // sec per km

  // ---------------------------------------------------------------------------
  // Map region for finished state (show full route)
  // ---------------------------------------------------------------------------

  const getRouteRegion = () => {
    if (coordinates.length === 0 && currentLocation) {
      return {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    if (coordinates.length === 0) return undefined;

    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;
    for (const c of coordinates) {
      if (c.latitude < minLat) minLat = c.latitude;
      if (c.latitude > maxLat) maxLat = c.latitude;
      if (c.longitude < minLng) minLng = c.longitude;
      if (c.longitude > maxLng) maxLng = c.longitude;
    }
    const padding = 0.002;
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(maxLat - minLat + padding, 0.005),
      longitudeDelta: Math.max(maxLng - minLng + padding, 0.005),
    };
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (!permissionGranted) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <MapPin size={48} color={colors.mutedForeground} />
        <Text className="text-base text-muted-foreground mt-4">
          Requesting location permission...
        </Text>
      </SafeAreaView>
    );
  }

  // --- IDLE STATE ---
  if (state === "IDLE") {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        {/* Header */}
        <View className="flex-row items-center px-4 py-4 gap-3">
          <TouchableOpacity onPress={handleBack}>
            <ArrowLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text
            className="text-2xl font-extralight text-foreground uppercase"
            style={{ letterSpacing: 2 }}
          >
            GPS Tracking
          </Text>
        </View>

        <View className="flex-1 px-4 justify-center">
          {/* Activity type picker */}
          <Text
            className="text-sm font-medium text-muted-foreground uppercase mb-3"
            style={{ letterSpacing: 1 }}
          >
            Activity Type
          </Text>
          <View className="flex-row flex-wrap gap-3 mb-8">
            {ACTIVITY_OPTIONS.map(({ value, label }) => {
              const active = activityType === value;
              return (
                <TouchableOpacity
                  key={value}
                  className={`flex-1 min-w-[45%] py-4 rounded-xl border items-center ${
                    active ? "border-teal bg-teal/10" : "border-border bg-card"
                  }`}
                  onPress={() => setActivityType(value)}
                >
                  <Text
                    className={`text-base font-semibold ${active ? "text-teal" : "text-muted-foreground"}`}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Map preview showing current location */}
          {currentLocation && (
            <View className="h-48 rounded-xl overflow-hidden mb-8">
              <MapView
                style={{ flex: 1 }}
                provider={PROVIDER_DEFAULT}
                customMapStyle={DARK_MAP_STYLE}
                initialRegion={{
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker coordinate={currentLocation}>
                  <View className="w-4 h-4 rounded-full bg-teal border-2 border-white" />
                </Marker>
              </MapView>
            </View>
          )}

          {/* Start button */}
          <TouchableOpacity
            className="py-5 rounded-2xl items-center"
            style={{ backgroundColor: colors.coral }}
            onPress={handleStart}
          >
            <View className="flex-row items-center gap-2">
              <Play size={24} color="#fff" fill="#fff" />
              <Text className="text-xl font-bold text-white">
                Start{" "}
                {activityType.charAt(0) + activityType.slice(1).toLowerCase()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- ACTIVE / PAUSED STATE ---
  if (state === "ACTIVE" || state === "PAUSED") {
    const region = currentLocation
      ? {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }
      : undefined;

    return (
      <View className="flex-1 bg-background">
        {/* Map */}
        <View className="flex-1">
          {region && (
            <MapView
              ref={mapRef}
              style={{ flex: 1 }}
              provider={PROVIDER_DEFAULT}
              customMapStyle={DARK_MAP_STYLE}
              initialRegion={region}
              showsUserLocation={false}
              showsCompass={false}
            >
              {coordinates.length > 1 && (
                <Polyline
                  coordinates={coordinates}
                  strokeColor={colors.teal}
                  strokeWidth={4}
                />
              )}
              {currentLocation && (
                <Marker coordinate={currentLocation}>
                  <View className="w-4 h-4 rounded-full bg-teal border-2 border-white" />
                </Marker>
              )}
            </MapView>
          )}
        </View>

        {/* Stats overlay */}
        <SafeAreaView edges={["top"]} className="absolute top-0 left-0 right-0">
          <View
            className="mx-4 mt-2 rounded-2xl overflow-hidden"
            style={{ backgroundColor: "rgba(20, 22, 34, 0.9)" }}
          >
            <View className="px-4 py-3">
              {/* Paused indicator */}
              {state === "PAUSED" && (
                <View className="items-center mb-2">
                  <Text
                    className="text-xs font-bold text-yellow-400 uppercase"
                    style={{ letterSpacing: 2 }}
                  >
                    Paused
                  </Text>
                </View>
              )}

              {/* Duration */}
              <View className="items-center mb-3">
                <Text
                  className="text-5xl font-bold text-foreground"
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {formatDuration(totalSeconds)}
                </Text>
              </View>

              {/* Distance + Pace */}
              <View className="flex-row justify-around">
                <View className="items-center">
                  <View className="flex-row items-center gap-1 mb-1">
                    <Route size={12} color={colors.teal} />
                    <Text className="text-xs text-muted-foreground">
                      Distance
                    </Text>
                  </View>
                  <Text className="text-xl font-bold text-foreground">
                    {formatDistance(totalDistance)} km
                  </Text>
                </View>
                <View className="items-center">
                  <View className="flex-row items-center gap-1 mb-1">
                    <Gauge size={12} color={colors.teal} />
                    <Text className="text-xs text-muted-foreground">Pace</Text>
                  </View>
                  <Text className="text-xl font-bold text-foreground">
                    {formatPace(pace)} /km
                  </Text>
                </View>
                {totalElevation > 0 && (
                  <View className="items-center">
                    <View className="flex-row items-center gap-1 mb-1">
                      <Mountain size={12} color={colors.teal} />
                      <Text className="text-xs text-muted-foreground">
                        Elevation
                      </Text>
                    </View>
                    <Text className="text-xl font-bold text-foreground">
                      {Math.round(totalElevation)} m
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </SafeAreaView>

        {/* Controls */}
        <SafeAreaView
          edges={["bottom"]}
          className="absolute bottom-0 left-0 right-0"
        >
          <View className="flex-row justify-center items-center gap-6 px-4 pb-4">
            {state === "ACTIVE" ? (
              <>
                <TouchableOpacity
                  className="w-16 h-16 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.muted }}
                  onPress={handlePause}
                >
                  <Pause
                    size={28}
                    color={colors.foreground}
                    fill={colors.foreground}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  className="w-16 h-16 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.destructive }}
                  onPress={handleStop}
                >
                  <Square size={28} color="#fff" fill="#fff" />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  className="w-16 h-16 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.teal }}
                  onPress={handleResume}
                >
                  <Play
                    size={28}
                    color={colors.tealForeground}
                    fill={colors.tealForeground}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  className="w-16 h-16 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.destructive }}
                  onPress={handleStop}
                >
                  <Square size={28} color="#fff" fill="#fff" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // --- FINISHED STATE ---
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        {/* Header */}
        <View className="flex-row items-center px-4 py-4 gap-3">
          <Text
            className="text-2xl font-extralight text-foreground uppercase"
            style={{ letterSpacing: 2 }}
          >
            Activity Summary
          </Text>
        </View>

        {/* Route map */}
        {coordinates.length > 1 && (
          <View className="h-56 mx-4 rounded-xl overflow-hidden mb-4">
            <MapView
              style={{ flex: 1 }}
              provider={PROVIDER_DEFAULT}
              customMapStyle={DARK_MAP_STYLE}
              initialRegion={getRouteRegion()}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Polyline
                coordinates={coordinates}
                strokeColor={colors.teal}
                strokeWidth={4}
              />
              {coordinates.length > 0 && (
                <>
                  <Marker coordinate={coordinates[0]!}>
                    <View className="w-3 h-3 rounded-full bg-green-500 border border-white" />
                  </Marker>
                  <Marker coordinate={coordinates[coordinates.length - 1]!}>
                    <View className="w-3 h-3 rounded-full bg-red-500 border border-white" />
                  </Marker>
                </>
              )}
            </MapView>
          </View>
        )}

        {/* Stats */}
        <View className="px-4 mb-4">
          <Card>
            <CardContent className="py-4 px-4">
              <View className="flex-row items-center gap-2 mb-3">
                <Text className="text-lg font-bold text-teal">
                  {activityType.charAt(0) + activityType.slice(1).toLowerCase()}
                </Text>
              </View>

              <View className="flex-row flex-wrap gap-y-4">
                <View className="w-1/2">
                  <View className="flex-row items-center gap-1 mb-1">
                    <Clock size={14} color={colors.teal} />
                    <Text className="text-xs text-muted-foreground">
                      Duration
                    </Text>
                  </View>
                  <Text className="text-2xl font-bold text-foreground">
                    {formatDuration(totalSeconds)}
                  </Text>
                </View>
                <View className="w-1/2">
                  <View className="flex-row items-center gap-1 mb-1">
                    <Route size={14} color={colors.teal} />
                    <Text className="text-xs text-muted-foreground">
                      Distance
                    </Text>
                  </View>
                  <Text className="text-2xl font-bold text-foreground">
                    {formatDistance(totalDistance)} km
                  </Text>
                </View>
                <View className="w-1/2">
                  <View className="flex-row items-center gap-1 mb-1">
                    <Gauge size={14} color={colors.teal} />
                    <Text className="text-xs text-muted-foreground">
                      Avg Pace
                    </Text>
                  </View>
                  <Text className="text-2xl font-bold text-foreground">
                    {formatPace(pace)} /km
                  </Text>
                </View>
                {totalElevation > 0 && (
                  <View className="w-1/2">
                    <View className="flex-row items-center gap-1 mb-1">
                      <Mountain size={14} color={colors.teal} />
                      <Text className="text-xs text-muted-foreground">
                        Elevation Gain
                      </Text>
                    </View>
                    <Text className="text-2xl font-bold text-foreground">
                      {Math.round(totalElevation)} m
                    </Text>
                  </View>
                )}
              </View>
            </CardContent>
          </Card>
        </View>

        {/* Optional fields */}
        <View className="px-4 gap-3 mb-4">
          <Input
            label="Calories Burned (optional)"
            value={calories}
            onChangeText={setCalories}
            keyboardType="number-pad"
            placeholder="e.g. 300"
          />
          <Input
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="How did it feel?"
          />
        </View>

        {/* Actions */}
        <View className="px-4 gap-3">
          <TouchableOpacity
            className="py-4 rounded-xl items-center flex-row justify-center gap-2"
            style={{ backgroundColor: colors.coral }}
            onPress={handleSave}
            disabled={logActivity.isPending}
          >
            <Save size={20} color="#fff" />
            <Text className="text-base font-bold text-white">
              {logActivity.isPending ? "Saving..." : "Save Activity"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="py-4 rounded-xl items-center flex-row justify-center gap-2 border border-border"
            onPress={handleDiscard}
          >
            <Trash2 size={20} color={colors.destructive} />
            <Text
              className="text-base font-medium"
              style={{ color: colors.destructive }}
            >
              Discard
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TrackingScreen;
