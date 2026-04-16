import { useEffect, useMemo, useState } from "react";
import { subscribeToYearsEvents } from "../../../services/epilepsy-events/eventService";
import { EpilepsyEvent } from "../../../shared/types/event";
import { isFirebaseConfigured } from "../../../services/firebase/config";
import { useAuth } from "../../../services/auth/AuthContext";

type UseEpilepsyEventsYearsResult = {
  events: EpilepsyEvent[];
  loading: boolean;
  error: string | null;
  firebaseReady: boolean;
};

export function useEpilepsyEventsYears(years: number[]): UseEpilepsyEventsYearsResult {
  const { user } = useAuth();
  const firebaseReady = isFirebaseConfigured();
  const stableYears = useMemo(
    () => Array.from(new Set(years)).sort((left, right) => left - right),
    [years]
  );
  const yearsKey = stableYears.join(",");
  const [events, setEvents] = useState<EpilepsyEvent[]>([]);
  const [loading, setLoading] = useState(firebaseReady && Boolean(user));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseReady || !user || stableYears.length === 0) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToYearsEvents(
      user.uid,
      stableYears,
      (items) => {
        setEvents(items);
        setLoading(false);
      },
      (message) => {
        setError(message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [firebaseReady, user, yearsKey]);

  return { events, loading, error, firebaseReady };
}
