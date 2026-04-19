import { FormEvent, useMemo, useState } from "react";
import { YearSummaryGrid } from "./components/YearSummaryGrid";
import { MonthCalendar } from "./components/MonthCalendar";
import { useEpilepsyEvents } from "./hooks/useEpilepsyEvents";
import { buildYearSummary, getMonthLabel, getMonthRange, shiftMonth } from "./utils/date";
import { getMonthlySummary, getYearlySummary } from "./utils/aggregations";
import { FlashNotice } from "../../shared/components/FlashNotice";
import { LoadingState } from "../../shared/components/LoadingState";
import { ErrorState } from "../../shared/components/ErrorState";
import { StatCards } from "../../shared/components/StatCards";
import { Modal } from "../../shared/components/Modal";
import {
  saveEpilepsyEvent,
  deleteEpilepsyEvents,
  updateEpilepsyEvent
} from "../../services/epilepsy-events/eventService";
import { CreateEpilepsyEventInput, EpilepsyEvent, EventColor } from "../../shared/types/event";
import { useAuth } from "../../services/auth/AuthContext";
import { EVENT_COLORS } from "../../shared/constants/designTokens";
import { pushFlashNotice } from "../../shared/utils/flash";
import { EventForm } from "../events/components/EventForm";

type CalendarView = "month" | "year";
type DayModalMode = "create" | "actions" | "edit" | "delete";
type EditableDayEvent = {
  id: string;
  date: string;
  color: EventColor;
  observation: string;
};

const DEFAULT_COLOR: EventColor = "yellow";

export function CalendarPage() {
  const { user } = useAuth();
  const [view, setView] = useState<CalendarView>("month");
  const [currentMonth, setCurrentMonth] = useState(() => buildYearSummary(new Date()));
  const [modalMode, setModalMode] = useState<DayModalMode | null>(null);
  const [activeDay, setActiveDay] = useState<{ label: string; events: EpilepsyEvent[] } | null>(null);
  const [editableEvents, setEditableEvents] = useState<EditableDayEvent[]>([]);
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventColor, setNewEventColor] = useState<EventColor>(DEFAULT_COLOR);
  const [newEventObservation, setNewEventObservation] = useState("");
  const [modalBusy, setModalBusy] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const { year, monthIndex } = currentMonth;
  const { events, loading, error, firebaseReady } = useEpilepsyEvents(year);

  const monthRange = useMemo(() => getMonthRange(year, monthIndex), [year, monthIndex]);
  const monthSummary = useMemo(
    () => getMonthlySummary(events, monthRange.monthKey),
    [events, monthRange.monthKey]
  );
  const yearSummary = useMemo(() => getYearlySummary(events, year), [events, year]);

  const title = view === "month" ? getMonthLabel(year, monthIndex) : String(year);
  const previousStep = view === "month" ? -1 : -12;
  const nextStep = view === "month" ? 1 : 12;

  function handleMonthSelect(monthKey: string) {
    const [selectedYear, selectedMonth] = monthKey.split("-");
    const parsedYear = Number.parseInt(selectedYear, 10);
    const parsedMonth = Number.parseInt(selectedMonth, 10);

    if (Number.isNaN(parsedYear) || Number.isNaN(parsedMonth)) {
      return;
    }

    setCurrentMonth({
      year: parsedYear,
      monthIndex: parsedMonth - 1
    });
    setView("month");
  }

  function closeModal() {
    setModalMode(null);
    setActiveDay(null);
    setEditableEvents([]);
    setNewEventDate("");
    setNewEventColor(DEFAULT_COLOR);
    setNewEventObservation("");
    setModalBusy(false);
    setModalError(null);
  }

  function openCreateModal(day: { dateKey: string; label: string; events: EpilepsyEvent[] }) {
    setActiveDay(day);
    setEditableEvents([]);
    setNewEventDate(day.dateKey);
    setNewEventColor(DEFAULT_COLOR);
    setNewEventObservation("");
    setModalMode("create");
    setModalError(null);
  }

  function openDayActions(day: { dateKey: string; label: string; events: EpilepsyEvent[] }) {
    setActiveDay(day);
    setEditableEvents(
      day.events.map((event) => ({
        id: event.id,
        date: event.dateKey,
        color: event.color,
        observation: event.observation ?? ""
      }))
    );
    setModalMode("actions");
    setModalError(null);
  }

  async function handleCreateEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !activeDay) {
      setModalError("Connexion requise.");
      return;
    }

    setModalBusy(true);
    setModalError(null);

    try {
      await saveEpilepsyEvent(user.uid, {
        date: newEventDate,
        color: newEventColor,
        observation: newEventObservation.trim() || undefined
      });
      pushFlashNotice("Crise enregistrée");
      closeModal();
    } catch (submissionError) {
      setModalError(submissionError instanceof Error ? submissionError.message : "Enregistrement impossible.");
      setModalBusy(false);
    }
  }

  function updateEditableEvent(id: string, patch: Partial<EditableDayEvent>) {
    setEditableEvents((currentItems) =>
      currentItems.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  async function handleSaveDayEvents(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !activeDay) {
      setModalError("Connexion requise.");
      return;
    }

    setModalBusy(true);
    setModalError(null);

    try {
      await Promise.all(
        editableEvents.map((item) =>
          updateEpilepsyEvent(user.uid, item.id, {
            date: item.date,
            color: item.color,
            observation: item.observation.trim() || undefined
          } satisfies CreateEpilepsyEventInput)
        )
      );

      pushFlashNotice("Crises enregistrées");
      closeModal();
    } catch (submissionError) {
      setModalError(submissionError instanceof Error ? submissionError.message : "Modification impossible.");
      setModalBusy(false);
    }
  }

  async function handleDeleteDayEvents() {
    if (!user || !activeDay) {
      setModalError("Connexion requise.");
      return;
    }

    setModalBusy(true);
    setModalError(null);

    try {
      await deleteEpilepsyEvents(
        user.uid,
        activeDay.events.map((entry) => entry.id)
      );
      pushFlashNotice("Crises supprimées");
      closeModal();
    } catch (submissionError) {
      setModalError(submissionError instanceof Error ? submissionError.message : "Suppression impossible.");
      setModalBusy(false);
    }
  }

  return (
    <section className="page-section page-section--fab-clearance">
      <div className="page-heading">
        <div>
          <h2>Calendrier</h2>
        </div>

        <div className="segmented-control" role="tablist" aria-label="Choisir une vue">
          <button
            type="button"
            className={view === "month" ? "is-active" : ""}
            onClick={() => setView("month")}
          >
            Mois
          </button>
          <button
            type="button"
            className={view === "year" ? "is-active" : ""}
            onClick={() => setView("year")}
          >
            Année
          </button>
        </div>
      </div>

      <FlashNotice />

      {!firebaseReady ? (
        <ErrorState
          title="Configuration Firebase manquante"
          description="Renseignez les variables d’environnement Vite pour connecter Firestore."
        />
      ) : null}

      {firebaseReady && loading ? <LoadingState label="Chargement des données…" /> : null}
      {firebaseReady && error ? (
        <ErrorState
          title="Impossible de charger les données"
          description={error}
        />
      ) : null}

      {firebaseReady && !loading && !error ? (
        <>
          <div className="period-switcher period-switcher--compact" aria-label="Changer de période">
            <button
              type="button"
              className="ghost-button ghost-button--nav"
              onClick={() =>
                setCurrentMonth((value) => shiftMonth(value.year, value.monthIndex, previousStep))
              }
              aria-label={view === "month" ? "Afficher le mois précédent" : "Afficher l’année précédente"}
            >
              <span aria-hidden="true">←</span>
            </button>
            <div className="period-switcher__current">
              <strong>{title}</strong>
            </div>
            <button
              type="button"
              className="ghost-button ghost-button--nav"
              onClick={() =>
                setCurrentMonth((value) => shiftMonth(value.year, value.monthIndex, nextStep))
              }
              aria-label={view === "month" ? "Afficher le mois suivant" : "Afficher l’année suivante"}
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>

          <StatCards
            yellowOrange={view === "month" ? monthSummary.yellowOrange : yearSummary.yellowOrange}
            red={view === "month" ? monthSummary.red : yearSummary.red}
            total={view === "month" ? monthSummary.total : yearSummary.total}
          />

          {view === "month" ? (
            <MonthCalendar
              year={year}
              monthIndex={monthIndex}
              events={monthSummary.events}
              onDaySelect={openCreateModal}
              onDayLongPress={openDayActions}
            />
          ) : (
            <YearSummaryGrid year={year} months={yearSummary.months} onMonthSelect={handleMonthSelect} />
          )}
        </>
      ) : null}

      {modalMode && activeDay ? (
        <Modal
          title={
            modalMode === "create"
              ? `Nouvelle crise du ${activeDay.label}`
              : modalMode === "actions"
              ? `Crises du ${activeDay.label}`
              : modalMode === "edit"
                ? `Modifier les crises du ${activeDay.label}`
                : `Supprimer les crises du ${activeDay.label}`
          }
          onClose={closeModal}
          showCloseButton={false}
        >
          {modalMode === "create" ? (
            <EventForm
              date={newEventDate}
              color={newEventColor}
              observation={newEventObservation}
              saving={modalBusy}
              error={modalError}
              onDateChange={setNewEventDate}
              onColorChange={setNewEventColor}
              onObservationChange={setNewEventObservation}
              onCancel={closeModal}
              onSubmit={(event) => void handleCreateEvent(event)}
            />
          ) : null}

          {modalMode === "actions" ? (
            <div className="modal-stack">
              <p className="modal-text">
                {activeDay.events.length} crise(s) enregistrée(s) sur cette journée.
              </p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="ghost-button ghost-button--compact"
                  onClick={closeModal}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="primary-button primary-button--compact"
                  onClick={() => setModalMode("edit")}
                >
                  Modifier
                </button>
              </div>
              <button
                type="button"
                className="ghost-button ghost-button--compact ghost-button--danger"
                onClick={() => setModalMode("delete")}
              >
                Supprimer
              </button>
            </div>
          ) : null}

          {modalMode === "edit" ? (
            <form className="modal-stack" onSubmit={(event) => void handleSaveDayEvents(event)}>
              <div className="edit-events-list">
                {editableEvents.map((item, index) => (
                  <article key={item.id} className="form-card edit-event-card">
                    <p className="section-label">Crise {index + 1}</p>

                    <label className="field field--date">
                      <span>Date</span>
                      <input
                        type="date"
                        value={item.date}
                        onChange={(event) => updateEditableEvent(item.id, { date: event.target.value })}
                        required
                      />
                    </label>

                    <fieldset className="field fieldset fieldset--severity">
                      <legend>Gravité</legend>
                      <div className="color-picker" role="radiogroup" aria-label={`Gravité crise ${index + 1}`}>
                        {EVENT_COLORS.map((choice) => (
                          <label
                            key={choice.value}
                            className={`color-choice${item.color === choice.value ? " color-choice--selected" : ""}`}
                          >
                            <input
                              type="radio"
                              name={`color-${item.id}`}
                              value={choice.value}
                              checked={item.color === choice.value}
                              onChange={() => updateEditableEvent(item.id, { color: choice.value })}
                              className={`color-choice__input color-choice__input--${choice.value}`}
                            />
                            <span className={`color-choice__label color-choice__label--${choice.value}`}>
                              {choice.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    <label className="field">
                      <span>Observation</span>
                      <textarea
                        rows={2}
                        value={item.observation}
                        onChange={(event) =>
                          updateEditableEvent(item.id, { observation: event.target.value })
                        }
                        placeholder="Facultatif"
                      />
                    </label>
                  </article>
                ))}
              </div>

              {modalError ? <p className="form-error">{modalError}</p> : null}

              <div className="modal-actions">
                <button type="button" className="ghost-button ghost-button--compact" onClick={closeModal}>
                  Annuler
                </button>
                <button type="submit" className="primary-button primary-button--compact" disabled={modalBusy}>
                  {modalBusy ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </form>
          ) : null}

          {modalMode === "delete" ? (
            <div className="modal-stack">
              <p className="modal-text">
                Cette action supprime définitivement toutes les crises enregistrées pour le {activeDay.label}.
              </p>
              {modalError ? <p className="form-error">{modalError}</p> : null}
              <div className="modal-actions">
                <button
                  type="button"
                  className="ghost-button ghost-button--compact"
                  onClick={() => setModalMode("actions")}
                >
                  Retour
                </button>
                <button
                  type="button"
                  className="primary-button primary-button--danger primary-button--compact"
                  disabled={modalBusy}
                  onClick={() => {
                    void handleDeleteDayEvents();
                  }}
                >
                  {modalBusy ? "Suppression…" : "Supprimer"}
                </button>
              </div>
            </div>
          ) : null}
        </Modal>
      ) : null}
    </section>
  );
}
