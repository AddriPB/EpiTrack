import { FormEvent, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { EmptyState } from "../../shared/components/EmptyState";
import { ErrorState } from "../../shared/components/ErrorState";
import { LoadingState } from "../../shared/components/LoadingState";
import { Modal } from "../../shared/components/Modal";
import { FlashNotice } from "../../shared/components/FlashNotice";
import { useAuth } from "../../services/auth/AuthContext";
import { isFirebaseConfigured } from "../../services/firebase/config";
import {
  createTreatment,
  deleteTreatment,
  subscribeToTreatments,
  updateTreatment
} from "../../services/treatments/treatmentService";
import { Treatment, TreatmentInput } from "../../shared/types/treatment";
import { pushFlashNotice } from "../../shared/utils/flash";

type ModalState =
  | { mode: "create"; draft: TreatmentInput }
  | { mode: "edit"; treatmentId: string; draft: TreatmentInput }
  | { mode: "delete"; treatment: Treatment }
  | null;

const EMPTY_DRAFT: TreatmentInput = {
  name: "",
  morningDose: "",
  eveningDose: ""
};

export function TreatmentPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const firebaseReady = isFirebaseConfigured();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(firebaseReady && Boolean(user));
  const [error, setError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<ModalState>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedTreatmentId, setConfirmedTreatmentId] = useState<string | null>(null);
  const confirmationTimeoutRef = useRef<number | null>(null);
  const knownTreatmentIdsRef = useRef<string[]>([]);
  const pendingCreateRef = useRef(false);

  useEffect(() => {
    if (!firebaseReady || !user) {
      setTreatments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToTreatments(
      user.uid,
      (items) => {
        const nextIds = items.map((item) => item.id);
        const addedIds = nextIds.filter((id) => !knownTreatmentIdsRef.current.includes(id));

        setTreatments(items);
        knownTreatmentIdsRef.current = nextIds;

        if (pendingCreateRef.current && addedIds.length > 0) {
          showConfirmation(addedIds[addedIds.length - 1]);
          pendingCreateRef.current = false;
        }

        setLoading(false);
      },
      (message) => {
        setError(message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [firebaseReady, user]);

  useEffect(() => {
    return () => {
      if (confirmationTimeoutRef.current) {
        window.clearTimeout(confirmationTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (params.get("action") !== "create") {
      return;
    }

    openCreateModal();
    navigate("/treatment", { replace: true });
  }, [location.search, navigate]);

  function showConfirmation(id: string) {
    setConfirmedTreatmentId(id);

    if (confirmationTimeoutRef.current) {
      window.clearTimeout(confirmationTimeoutRef.current);
    }

    confirmationTimeoutRef.current = window.setTimeout(() => {
      setConfirmedTreatmentId(null);
      confirmationTimeoutRef.current = null;
    }, 1400);
  }

  function openCreateModal() {
    setError(null);
    setModalState({ mode: "create", draft: { ...EMPTY_DRAFT } });
  }

  function openEditModal(treatment: Treatment) {
    setError(null);
    setModalState({
      mode: "edit",
      treatmentId: treatment.id,
      draft: {
        name: treatment.name,
        morningDose: treatment.morningDose,
        eveningDose: treatment.eveningDose
      }
    });
  }

  function openDeleteModal(treatment: Treatment) {
    setError(null);
    setModalState({ mode: "delete", treatment });
  }

  function closeModal() {
    setModalState(null);
    setSubmitting(false);
  }

  function updateDraft(key: keyof TreatmentInput, value: string) {
    setModalState((current) => {
      if (!current || current.mode === "delete") {
        return current;
      }

      return {
        ...current,
        draft: {
          ...current.draft,
          [key]: value
        }
      };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !modalState || modalState.mode === "delete") {
      setError("Connexion requise.");
      return;
    }

    if (!modalState.draft.name.trim()) {
      setError("Le nom du médicament est requis.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (modalState.mode === "create") {
        pendingCreateRef.current = true;
        await createTreatment(user.uid, modalState.draft);
        pushFlashNotice("Traitement enregistré");
      } else {
        await updateTreatment(user.uid, modalState.treatmentId, modalState.draft);
        showConfirmation(modalState.treatmentId);
        pushFlashNotice("Traitement enregistré");
      }

      closeModal();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Enregistrement impossible.");
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!user || !modalState || modalState.mode !== "delete") {
      setError("Connexion requise.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await deleteTreatment(user.uid, modalState.treatment.id);
      pushFlashNotice("Traitement supprimé");
      closeModal();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Suppression impossible.");
      setSubmitting(false);
    }
  }

  if (!firebaseReady) {
    return (
      <section className="page-section">
        <ErrorState title="Firebase manquant" description="Ajoutez la config pour utiliser les traitements." />
      </section>
    );
  }

  if (!user) {
    return (
      <section className="page-section">
        <ErrorState title="Connexion requise" description="Connectez-vous pour gérer les traitements." />
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="page-heading page-heading--compact">
        <div>
          <h2>Traitement</h2>
        </div>
      </div>

      <FlashNotice />

      {loading ? <LoadingState label="Chargement…" /> : null}
      {error ? <ErrorState title="Traitements indisponibles" description={error} /> : null}

      {!loading && !error && treatments.length === 0 ? (
        <EmptyState
          title="Aucun traitement"
          description="Ajoutez un médicament."
        />
      ) : null}

      <div className="treatment-list treatment-list--cards">
        {treatments.map((treatment) => (
          <article
            key={treatment.id}
            className={`treatment-card${
              confirmedTreatmentId === treatment.id ? " treatment-card--confirmed" : ""
            }`}
          >
            <div className="treatment-card__header">
              <div>
                <h3 className="treatment-card__title">{treatment.name}</h3>
              </div>
              <div className="treatment-card__actions">
                <button
                  type="button"
                  className="ghost-button ghost-button--compact"
                  onClick={() => openEditModal(treatment)}
                >
                  Modifier
                </button>
                <button
                  type="button"
                  className="ghost-button ghost-button--compact ghost-button--danger"
                  onClick={() => openDeleteModal(treatment)}
                >
                  Supprimer
                </button>
              </div>
            </div>

            <dl className="treatment-card__grid">
              <div className="treatment-card__item">
                <dt>Matin</dt>
                <dd>{treatment.morningDose || "Non précisé"}</dd>
              </div>
              <div className="treatment-card__item">
                <dt>Soir</dt>
                <dd>{treatment.eveningDose || "Non précisé"}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      {modalState?.mode === "create" || modalState?.mode === "edit" ? (
        <Modal title={modalState.mode === "create" ? "Nouveau traitement" : "Modifier le traitement"} onClose={closeModal}>
          <form className="modal-stack" onSubmit={(event) => void handleSubmit(event)}>
            <label className="field">
              <span>Médicament</span>
              <input
                type="text"
                value={modalState.draft.name}
                onChange={(event) => updateDraft("name", event.target.value)}
                placeholder="Nom"
              />
            </label>

            <div className="treatment-form__doses">
              <label className="field">
                <span>Matin</span>
                <input
                  type="text"
                  value={modalState.draft.morningDose}
                  onChange={(event) => updateDraft("morningDose", event.target.value)}
                  placeholder="Dose"
                />
              </label>

              <label className="field">
                <span>Soir</span>
                <input
                  type="text"
                  value={modalState.draft.eveningDose}
                  onChange={(event) => updateDraft("eveningDose", event.target.value)}
                  placeholder="Dose"
                />
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="ghost-button ghost-button--compact" onClick={closeModal}>
                Annuler
              </button>
              <button type="submit" className="primary-button primary-button--compact" disabled={submitting}>
                {submitting ? "En cours…" : modalState.mode === "create" ? "Créer" : "Enregistrer"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {modalState?.mode === "delete" ? (
        <Modal title="Supprimer le traitement" onClose={closeModal}>
          <div className="modal-stack">
            <p className="modal-text">
              Supprimer <strong>{modalState.treatment.name}</strong> ?
            </p>
            <div className="modal-actions">
              <button type="button" className="ghost-button ghost-button--compact" onClick={closeModal}>
                Annuler
              </button>
              <button
                type="button"
                className="primary-button primary-button--danger primary-button--compact"
                onClick={() => {
                  void handleDelete();
                }}
                disabled={submitting}
              >
                {submitting ? "Suppression…" : "Supprimer"}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}
