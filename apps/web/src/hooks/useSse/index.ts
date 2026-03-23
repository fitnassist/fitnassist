import { useSseSubscription } from './useSseSubscription';
import { useSseEvents } from './useSseEvents';

export const useSse = () => {
  const { isConnected, lastEvent } = useSseSubscription();
  useSseEvents(lastEvent);
  return { isConnected };
};
