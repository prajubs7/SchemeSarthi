import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const storageKey = (schemeId: string) => `documentChecklist:${schemeId}`;

/** Which required documents the user has ticked for a scheme, kept on the device only. */
export function useDocumentChecklist(schemeId: string) {
  const [checked, setChecked] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    setChecked([]);
    AsyncStorage.getItem(storageKey(schemeId))
      .then(raw => {
        if (cancelled || !raw) return;
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) setChecked(parsed.map(String));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [schemeId]);

  const toggle = useCallback(
    (doc: string) => {
      setChecked(prev => {
        const next = prev.includes(doc)
          ? prev.filter(d => d !== doc)
          : [...prev, doc];
        AsyncStorage.setItem(storageKey(schemeId), JSON.stringify(next)).catch(
          () => {},
        );
        return next;
      });
    },
    [schemeId],
  );

  return { checked, toggle };
}
