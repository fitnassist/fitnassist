import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Syncs tab state with a `?tab=` query param in the URL.
 * Falls back to `defaultTab` when no param is present.
 */
export const useTabParam = <T extends string>(defaultTab: T) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') as T) || defaultTab;

  const setTab = useCallback(
    (value: string) => {
      setSearchParams(
        value === defaultTab ? {} : { tab: value },
        { replace: true }
      );
    },
    [defaultTab, setSearchParams]
  );

  return [tab, setTab] as const;
};
