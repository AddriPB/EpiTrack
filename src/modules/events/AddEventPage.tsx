import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveEpilepsyEvent } from "../../services/epilepsy-events/eventService";
import { EventColor } from "../../shared/types/event";
import { formatInputDate } from "../../shared/utils/date";
import { isFirebaseConfigured } from "../../services/firebase/config";
import { ErrorState } from "../../shared/components/ErrorState";
import { useAuth } from "../../services/auth/AuthContext";
import { pushFlashNotice } from "../../shared/utils/flash";
import { EventForm } from "./components/EventForm";

const DEFAULT_COLOR: EventColor = "yellow";

export function AddEventPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firebaseReady = useMemo(() => isFirebaseConfigured(), []);
  const [date, setDate] = useState(() => formatInputDate(new Date()));
  const [color, setColor] = useState<EventColor>(DEFAULT_COLOR);
  const [observation, setObservation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!firebaseReady) {
      setError("Configuration Firebase manquante.");
      return;
    }

    if (!user) {
      setError("Connexion requise.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await saveEpilepsyEvent(user.uid, {
        date,
        color,
        observation: observation.trim() || undefined
      });
      pushFlashNotice("Crise enregistrée");
      navigate("/calendar");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    navigate("/calendar");
  }

  if (!firebaseReady) {
    return (
      <section className="page-section">
        <ErrorState
          title="Configuration Firebase manquante"
          description="Ajoutez les variables Vite avant d’enregistrer des crises."
        />
      </section>
    );
  }

  if (!user) {
    return (
      <section className="page-section">
        <ErrorState
          title="Connexion requise"
          description="Connectez-vous avant d’enregistrer une crise."
        />
      </section>
    );
  }

  return (
    <section className="page-section page-section--narrow entry-page">
      <div className="page-heading page-heading--entry">
        <div>
          <h2>Nouvelle crise</h2>
        </div>
      </div>

      <EventForm
        date={date}
        color={color}
        observation={observation}
        saving={saving}
        error={error}
        onDateChange={setDate}
        onColorChange={setColor}
        onObservationChange={setObservation}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
