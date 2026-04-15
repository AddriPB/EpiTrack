import { useEffect, useState } from "react";
import { subscribeToYearEvents } from "../../../services/epilepsy-events/eventService";
import { EpilepsyEvent } from "../../../shared/types/event";
import { isFirebaseConfigured } from "../../../services/firebase/config";
import { useAuth } from "../../../services/auth/AuthContext";

type UseEpilepsyEventsResult = {
  events: EpilepsyEvent[];
  loading: boolean;
  error: string | null;
  firebaseReady: boolean;
};

export function useEpilepsyEvents(year: number): UseEpilepsyEventsResult {
  const { user } = useAuth();
  const firebaseReady = isFirebaseConfigured();
  const [events, setEvents] = useState<EpilepsyEvent[]>([]);
  const [loading, setLoading] = useState(firebaseReady && Boolean(user));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseReady || !user) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToYearEvents(
      user.uid,
      year,
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
  }, [firebaseReady, user, year]);

  return { events, loading, error, firebaseReady };
}
