import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * Refetches data whenever this screen comes into focus (e.g. navigating back).
 * Pass one or more refetch functions returned by useQuery/useMutation.
 */
export const useRefetchOnFocus = (...refetches: Array<() => void>) => {
  useFocusEffect(
    useCallback(() => {
      refetches.forEach((r) => r());
    }, []),
  );
};
