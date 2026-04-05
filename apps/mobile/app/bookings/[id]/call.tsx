import { useState, useRef } from "react";
import { View, ActivityIndicator, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { PhoneOff, Video, AlertCircle } from "lucide-react-native";
import { TouchableOpacity } from "react-native";
import { Text } from "@/components/ui";
import { useBooking } from "@/api/booking";
import { useAuth } from "@/hooks/useAuth";

const FIVE_MINUTES_MS = 5 * 60_000;

const CallScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const { role } = useAuth();
  const isTrainer = role === "TRAINER";

  const { data: booking, isLoading } = useBooking(id ?? "");

  const handleLeave = () => {
    Alert.alert(
      "Leave Call",
      "Are you sure you want to leave the video call?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: () => router.back(),
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#000",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color="#5ECEBB" />
      </View>
    );
  }

  const roomUrl = (booking as any)?.dailyRoomUrl;

  if (!booking || booking.sessionType !== "VIDEO_CALL" || !roomUrl) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#000",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 16 }}>
          Video call is not available for this booking.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginTop: 16,
            paddingHorizontal: 24,
            paddingVertical: 12,
            backgroundColor: "#D94F6B",
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Time validation: check if session has ended
  const bookingDateStr = new Date(booking.date).toISOString().split("T")[0];
  const sessionEnd = new Date(`${bookingDateStr}T${booking.endTime}:00`);
  const isExpired = sessionEnd.getTime() < Date.now();

  if (isExpired) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#000",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <AlertCircle size={48} color="rgba(255,255,255,0.6)" />
        <Text style={{ color: "#fff", fontSize: 18 }}>
          This session has ended.
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
          The video call is no longer available.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginTop: 16,
            paddingHorizontal: 24,
            paddingVertical: 12,
            backgroundColor: "#D94F6B",
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            Back to Booking
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Time validation: can only join 5 minutes before start
  const sessionStart = new Date(`${bookingDateStr}T${booking.startTime}:00`);
  const isTooEarly = sessionStart.getTime() - FIVE_MINUTES_MS > Date.now();

  if (isTooEarly) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#000",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <Video size={48} color="rgba(255,255,255,0.6)" />
        <Text style={{ color: "#fff", fontSize: 18 }}>
          Call not available yet
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
          You can join 5 minutes before the session starts at{" "}
          {booking.startTime}.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginTop: 16,
            paddingHorizontal: 24,
            paddingVertical: 12,
            backgroundColor: "#D94F6B",
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            Back to Booking
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Build the Daily.co prebuilt URL with display name
  const clientName =
    (booking as any).clientRoster?.connection?.sender?.name ??
    (booking as any).clientRoster?.connection?.name ??
    "Client";
  const trainerName = (booking as any).trainer?.displayName ?? "Trainer";
  const userName = isTrainer ? trainerName : clientName;
  const callUrl = `${roomUrl}?t=&userName=${encodeURIComponent(userName)}`;

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Header with leave button */}
      <SafeAreaView
        edges={["top"]}
        style={{ backgroundColor: "rgba(0,0,0,0.8)", zIndex: 10 }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            Video Call
          </Text>
          <TouchableOpacity
            onPress={handleLeave}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#D94F6B",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PhoneOff size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Loading indicator */}
      {loading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
            zIndex: 5,
          }}
        >
          <ActivityIndicator size="large" color="#5ECEBB" />
          <Text style={{ color: "#fff", marginTop: 12 }}>
            Connecting to call...
          </Text>
        </View>
      )}

      {/* WebView with Daily.co prebuilt UI */}
      <WebView
        ref={webViewRef}
        source={{ uri: callUrl }}
        style={{ flex: 1, backgroundColor: "#000" }}
        onLoadEnd={() => setLoading(false)}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        mediaCapturePermissionGrantType="grant"
        javaScriptEnabled
        domStorageEnabled
        allowsProtectedMedia
        onNavigationStateChange={(navState) => {
          // Daily.co redirects when user leaves the call
          if (
            navState.url.includes("/left") ||
            navState.url.includes("ended")
          ) {
            router.back();
          }
        }}
      />
    </View>
  );
};

export default CallScreen;
