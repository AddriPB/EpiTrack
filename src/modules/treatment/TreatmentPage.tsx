import { FormEvent, TouchEvent, useEffect, useRef, useState } from "react";
import { ErrorState } from "../../shared/components/ErrorState";
import { LoadingState } from "../../shared/components/LoadingState";
import { EmptyState } from "../../shared/components/EmptyState";
import { isFirebaseConfigured } from "../../services/firebase/config";
import { useAuth } from "../../services/auth/AuthContext";
import {
  createTreatment,
  deleteTreatment,
  subscribeToTreatments,
  updateTreatment
} from "../../services/treatments/treatmentService";
import { Treatment } from "../../shared/types/treatment";

type TreatmentDraft = {
  id: string;
  name: string;
  morningDose: string;
  eveningDose: string;
  isNew?: boolean;
};

const SWIPE_DELETE_THRESHOLD = 84;

export function TreatmentPage() {
  const { user } = useAuth();
  const firebaseReady = isFirebaseConfigured();
  const [drafts, setDrafts] = useState<TreatmentDraft[]>([]);
  const [loading, setLoading] = useState(firebaseReady && Boolean(user));
  const [error, setError] = useState<string | null>(null);
  const swipeStartRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!firebaseReady || !user) {
      setDrafts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToTreatments(
      user.uid,
      (items) => {
        setDrafts((currentDrafts) => mergeDrafts(currentDrafts, items));
        setLoading(false);
      },
      (message) => {
        setError(message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [firebaseReady, user]);

  function updateDraft(id: string, key: keyof TreatmentDraft, value: string) {
    setDrafts((currentDrafts) =>
      currentDrafts.map((draft) => (draft.id === id ? { ...draft, [key]: value } : draft))
    );
  }

  function addLine() {
    setDrafts((currentDrafts) => [
      ...currentDrafts,
      {
        id: `new-${crypto.randomUUID()}`,
        name: "",
        morningDose: "",
        eveningDose: "",
        isNew: true
      }
    ]);
  }

  async function saveLine(event: FormEvent<HTMLFormElement>, draft: TreatmentDraft) {
    event.preventDefault();

    if (!user) {
      setError("Connexion requise.");
      return;
    }

    if (!draft.name.trim()) {
      setError("Le nom du médicament est requis.");
      return;
    }

    setError(null);

    try {
      const payload = {
        name: draft.name,
        morningDose: draft.morningDose,
        eveningDose: draft.eveningDose
      };

      if (draft.isNew) {
        await createTreatment(user.uid, payload);
      } else {
        await updateTreatment(user.uid, draft.id, payload);
      }
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Enregistrement impossible.");
    }
  }

  async function removeLine(draft: TreatmentDraft) {
    if (draft.isNew) {
      setDrafts((currentDrafts) => currentDrafts.filter((entry) => entry.id !== draft.id));
      return;
    }

    if (!user) {
      setError("Connexion requise.");
      return;
    }

    try {
      await deleteTreatment(user.uid, draft.id);
      setError(null);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Suppression impossible.");
    }
  }

  function handleTouchStart(event: TouchEvent<HTMLElement>, id: string) {
    swipeStartRef.current[id] = event.changedTouches[0]?.clientX ?? 0;
  }

  function handleTouchEnd(event: TouchEvent<HTMLElement>, draft: TreatmentDraft) {
    const startX = swipeStartRef.current[draft.id];
    const endX = event.changedTouches[0]?.clientX ?? startX;

    if (startX - endX > SWIPE_DELETE_THRESHOLD) {
      void removeLine(draft);
    }

    delete swipeStartRef.current[draft.id];
  }

  if (!firebaseReady) {
    return (
      <section className="page-section">
        <ErrorState
          title="Configuration Firebase manquante"
          description="Ajoutez les variables Vite avant d’utiliser les traitements."
        />
      </section>
    );
  }

  if (!user) {
    return (
      <section className="page-section">
        <ErrorState
          title="Connexion requise"
          description="Connectez-vous avant d’enregistrer un traitement."
        />
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <h2>Traitement</h2>
          <p className="page-heading__hint">Glissez une ligne vers la gauche pour la supprimer.</p>
        </div>
      </div>

      {loading ? <LoadingState label="Chargement du traitement…" /> : null}
      {error ? <ErrorState title="Impossible de gérer le traitement" description={error} /> : null}

      {!loading && !error && drafts.length === 0 ? (
        <EmptyState
          title="Aucun traitement"
          description="Ajoutez une première ligne pour saisir un médicament et sa posologie matin / soir."
        />
      ) : null}

      <div className="treatment-list">
        {drafts.map((draft) => (
          <form
            key={draft.id}
            className="form-card treatment-row"
            onSubmit={(event) => {
              void saveLine(event, draft);
            }}
            onTouchStart={(event) => handleTouchStart(event, draft.id)}
            onTouchEnd={(event) => handleTouchEnd(event, draft)}
          >
            <label className="field">
              <span>Médicament</span>
              <input
                type="text"
                value={draft.name}
                onChange={(event) => updateDraft(draft.id, "name", event.target.value)}
                placeholder="Nom du médicament"
              />
            </label>

            <div className="treatment-row__doses">
              <label className="field">
                <span>Matin</span>
                <input
                  type="text"
                  value={draft.morningDose}
                  onChange={(event) => updateDraft(draft.id, "morningDose", event.target.value)}
                  placeholder="Dose matin"
                />
              </label>

              <label className="field">
                <span>Soir</span>
                <input
                  type="text"
                  value={draft.eveningDose}
                  onChange={(event) => updateDraft(draft.id, "eveningDose", event.target.value)}
                  placeholder="Dose soir"
                />
              </label>
            </div>

            <div className="treatment-row__actions">
              <button type="submit" className="primary-button">
                {draft.isNew ? "Créer" : "Modifier"}
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  void removeLine(draft);
                }}
              >
                Supprimer
              </button>
            </div>
          </form>
        ))}
      </div>

      <button type="button" className="primary-button" onClick={addLine}>
        Ajouter un traitement
      </button>
    </section>
  );
}

function mergeDrafts(currentDrafts: TreatmentDraft[], treatments: Treatment[]) {
  const newDrafts = currentDrafts.filter((draft) => draft.isNew);
  const savedDrafts = treatments.map((treatment) => ({
    id: treatment.id,
    name: treatment.name,
    morningDose: treatment.morningDose,
    eveningDose: treatment.eveningDose
  }));

  return [...savedDrafts, ...newDrafts];
}
