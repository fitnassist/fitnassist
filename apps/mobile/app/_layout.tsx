import "../global.css";
import "../lib/sentry";
import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { QueryClientProvider, focusManager } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { queryClient } from "@/lib/queryClient";
import { trpc, createTRPCClient } from "@/lib/trpc";
import { useAuth } from "@/hooks/useAuth";
import { AlertProvider } from "@/components/ui";
import { useSse } from "@/lib/sse";
import { useNotifications } from "@/hooks/useNotifications";
import { CartProvider } from "@/hooks/useCart";

// Tell TanStack Query to treat app foreground as "window focus"
focusManager.setEventListener((handleFocus) => {
  const sub = AppState.addEventListener("change", (state) => {
    handleFocus(state === "active");
  });
  return () => sub.remove();
});

// Keep splash screen visible until we're ready
SplashScreen.preventAutoHideAsync();

const AuthenticatedProviders = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  useSse();
  useNotifications();
  return <>{children}</>;
};

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [splashHidden, setSplashHidden] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    // Hide splash only once on initial load
    if (!splashHidden) {
      SplashScreen.hideAsync().catch(() => {});
      setSplashHidden(true);
    }

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, segments]);

  if (!isAuthenticated) return <>{children}</>;

  return <AuthenticatedProviders>{children}</AuthenticatedProviders>;
};

const RootLayout = () => {
  const [trpcClient] = useState(() => createTRPCClient());

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <SafeAreaProvider>
            <AlertProvider>
              <CartProvider>
                <AuthGuard>
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      animation: "slide_from_right",
                    }}
                  >
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen
                      name="(auth)"
                      options={{ animation: "fade" }}
                    />
                    <Stack.Screen name="dashboard" />
                    <Stack.Screen name="trainers" />
                    <Stack.Screen name="bookings" />
                    <Stack.Screen name="messages" />
                    <Stack.Screen name="shop" />
                    <Stack.Screen name="tracking" />
                    <Stack.Screen name="workout" />
                    <Stack.Screen name="scan" />
                  </Stack>
                </AuthGuard>
              </CartProvider>
              <StatusBar style="light" />
            </AlertProvider>
          </SafeAreaProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );
};

export default RootLayout;
