import { useState, useEffect, useCallback, useRef } from 'react';
import { trpc } from '@/lib/trpc';

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const isSupported = typeof Notification !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;

  const { data: vapidData } = trpc.notification.getVapidPublicKey.useQuery(undefined, {
    enabled: isSupported,
    staleTime: Infinity,
  });

  const registerMutation = trpc.notification.registerPushSubscription.useMutation();
  const registerMutationRef = useRef(registerMutation);
  registerMutationRef.current = registerMutation;

  const registerSubscription = useCallback(async (vapidPublicKey: string) => {
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer,
      });
    }

    const p256dh = subscription.getKey('p256dh');
    const auth = subscription.getKey('auth');

    if (p256dh && auth) {
      await registerMutationRef.current.mutateAsync({
        endpoint: subscription.endpoint,
        p256dh: arrayBufferToBase64(p256dh),
        auth: arrayBufferToBase64(auth),
      });
    }
  }, []);

  useEffect(() => {
    if (!isSupported) return;

    // Auto-register if permission already granted
    if (Notification.permission === 'granted' && vapidData?.key) {
      registerSubscription(vapidData.key).catch(() => {});
    }
  }, [vapidData?.key, isSupported, registerSubscription]);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      // If VAPID key is available, register immediately
      if (vapidData?.key) {
        try {
          await registerSubscription(vapidData.key);
        } catch (err) {
          console.error('[PushNotifications] Registration failed:', err);
        }
      }
      return true;
    }

    return false;
  }, [isSupported, vapidData?.key, registerSubscription]);

  return {
    isSupported,
    permission,
    requestPermission,
    isEnabled: permission === 'granted',
    isConfigured: !!vapidData?.key,
  };
};

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return window.btoa(binary);
};
