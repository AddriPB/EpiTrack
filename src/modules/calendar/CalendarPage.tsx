import { useMemo, useState } from "react";
import { YearSummaryGrid } from "./components/YearSummaryGrid";
import { MonthCalendar } from "./components/MonthCalendar";
import { useEpilepsyEvents } from "./hooks/useEpilepsyEvents";
import { buildYearSummary, getMonthLabel, getMonthRange, shiftMonth } from "./utils/date";
import { getMonthlySummary, getYearlySummary } from "./utils/aggregations";
import { FlashNotice } from "../../shared/components/FlashNotice";
import { LoadingState } from "../../shared/components/LoadingState";
import { ErrorState } from "../../shared/components/ErrorState";
import { StatCards } from "../../shared/components/StatCards";

type CalendarView = "month" | "year";

export function CalendarPage() {
  const [view, setView] = useState<CalendarView>("month");
  const [currentMonth, setCurrentMonth] = useState(() => buildYearSummary(new Date()));
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

  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Vue principale</p>
          <h2>{title}</h2>
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
          <div className="period-switcher" aria-label="Changer de période">
            <button
              type="button"
              className="ghost-button"
              onClick={() =>
                setCurrentMonth((value) => shiftMonth(value.year, value.monthIndex, previousStep))
              }
            >
              {view === "month" ? "Mois précédent" : "Année précédente"}
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() =>
                setCurrentMonth((value) => shiftMonth(value.year, value.monthIndex, nextStep))
              }
            >
              {view === "month" ? "Mois suivant" : "Année suivante"}
            </button>
          </div>

          <StatCards
            yellowOrange={view === "month" ? monthSummary.yellowOrange : yearSummary.yellowOrange}
            red={view === "month" ? monthSummary.red : yearSummary.red}
            total={view === "month" ? monthSummary.total : yearSummary.total}
          />

          {view === "month" ? (
            <MonthCalendar year={year} monthIndex={monthIndex} events={monthSummary.events} />
          ) : (
            <YearSummaryGrid year={year} months={yearSummary.months} />
          )}
        </>
      ) : null}
    </section>
  );
}
