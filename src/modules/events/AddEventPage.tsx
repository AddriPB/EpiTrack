import { FormEvent, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveEpilepsyEvent } from "../../services/epilepsy-events/eventService";
import { EVENT_COLORS } from "../../shared/constants/designTokens";
import { EventColor } from "../../shared/types/event";
import { formatInputDate } from "../../shared/utils/date";
import { isFirebaseConfigured } from "../../services/firebase/config";
import { ErrorState } from "../../shared/components/ErrorState";
import { useAuth } from "../../services/auth/AuthContext";

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
      window.sessionStorage.setItem("epitrack-flash", "Enregistrée");
      navigate("/calendar");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
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

      <form className="form-card form-card--entry" onSubmit={handleSubmit}>
        <label className="field field--date">
          <span>Date</span>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
        </label>

        <fieldset className="field fieldset fieldset--severity">
          <legend>Gravité</legend>
          <div className="color-picker" role="radiogroup" aria-label="Choisir une couleur">
            {EVENT_COLORS.map((item) => (
              <label
                key={item.value}
                className={`color-choice${color === item.value ? " color-choice--selected" : ""}`}
              >
                <input
                  type="radio"
                  name="color"
                  value={item.value}
                  checked={color === item.value}
                  onChange={() => setColor(item.value)}
                  className={`color-choice__input color-choice__input--${item.value}`}
                />
                <span className={`color-choice__label color-choice__label--${item.value}`}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="field">
          <span>Observation</span>
          <textarea
            rows={2}
            value={observation}
            onChange={(event) => setObservation(event.target.value)}
            placeholder="Facultatif"
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button type="submit" className="primary-button primary-button--compact" disabled={saving}>
          {saving ? "Enregistrement…" : "Valider"}
        </button>
      </form>
    </section>
  );
}
