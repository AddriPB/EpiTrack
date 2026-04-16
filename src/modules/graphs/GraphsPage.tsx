import { useMemo, useState } from "react";
import { LoadingState } from "../../shared/components/LoadingState";
import { ErrorState } from "../../shared/components/ErrorState";
import { FlashNotice } from "../../shared/components/FlashNotice";
import { useEpilepsyEvents } from "../calendar/hooks/useEpilepsyEvents";
import { buildYearSummary, getMonthLabel, shiftMonth } from "../calendar/utils/date";
import { getYearlySummary } from "../calendar/utils/aggregations";

type GraphView = "month" | "year";
type Point = {
  label: string;
  value: number;
};

const CHART_WIDTH = 320;
const CHART_HEIGHT = 168;
const CHART_PADDING_X = 18;
const CHART_PADDING_Y = 18;

export function GraphsPage() {
  const [view, setView] = useState<GraphView>("month");
  const [currentPeriod, setCurrentPeriod] = useState(() => buildYearSummary(new Date()));
  const { year, monthIndex } = currentPeriod;
  const { events, loading, error, firebaseReady } = useEpilepsyEvents(year);

  const monthPoints = useMemo(() => buildMonthPoints(events, year, monthIndex), [events, year, monthIndex]);
  const yearPoints = useMemo(() => buildYearPoints(events, year), [events, year]);
  const chartPoints = view === "month" ? monthPoints : yearPoints;
  const title = view === "month" ? getMonthLabel(year, monthIndex) : String(year);

  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <h2>Graphiques</h2>
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
        <ErrorState title="Impossible de charger les données" description={error} />
      ) : null}

      {firebaseReady && !loading && !error ? (
        <>
          <div className="period-switcher period-switcher--compact" aria-label="Changer de période">
            <button
              type="button"
              className="ghost-button ghost-button--nav"
              onClick={() =>
                setCurrentPeriod((value) =>
                  shiftMonth(value.year, value.monthIndex, view === "month" ? -1 : -12)
                )
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
                setCurrentPeriod((value) =>
                  shiftMonth(value.year, value.monthIndex, view === "month" ? 1 : 12)
                )
              }
              aria-label={view === "month" ? "Afficher le mois suivant" : "Afficher l’année suivante"}
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>

          <div className="chart-card">
            <LineChart points={chartPoints} />
          </div>
        </>
      ) : null}
    </section>
  );
}

function buildMonthPoints(events: Array<{ dateKey: string; month: number; year: number; day: number }>, year: number, monthIndex: number): Point[] {
  const month = monthIndex + 1;
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayTotals = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    return events.filter((event) => event.year === year && event.month === month && event.day === day).length;
  });

  return dayTotals.map((value, index) => ({
    label: String(index + 1),
    value
  }));
}

function buildYearPoints(events: Array<{ year: number; monthKey: string }>, year: number): Point[] {
  return getYearlySummary(events as never[], year).months.map((month) => ({
    label: month.label.replace(".", ""),
    value: month.total
  }));
}

function LineChart({ points }: { points: Point[] }) {
  const maxValue = Math.max(...points.map((point) => point.value), 1);
  const stepX = points.length > 1 ? (CHART_WIDTH - CHART_PADDING_X * 2) / (points.length - 1) : 0;
  const usableHeight = CHART_HEIGHT - CHART_PADDING_Y * 2;
  const linePath = points
    .map((point, index) => {
      const x = CHART_PADDING_X + stepX * index;
      const y = CHART_HEIGHT - CHART_PADDING_Y - (point.value / maxValue) * usableHeight;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  const tickIndexes = points.length > 12 ? [0, 5, 10, 15, 20, 25, 30].filter((index) => index < points.length) : points.map((_, index) => index);

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="chart__svg" role="img" aria-label="Graphique des crises">
        <path className="chart__baseline" d={`M ${CHART_PADDING_X} ${CHART_HEIGHT - CHART_PADDING_Y} H ${CHART_WIDTH - CHART_PADDING_X}`} />
        <path className="chart__line" d={linePath} />
        {points.map((point, index) => {
          const x = CHART_PADDING_X + stepX * index;
          const y = CHART_HEIGHT - CHART_PADDING_Y - (point.value / maxValue) * usableHeight;
          return <circle key={`${point.label}-${index}`} cx={x} cy={y} r="2.8" className="chart__dot" />;
        })}
      </svg>

      <div className="chart__labels">
        {tickIndexes.map((index) => (
          <span key={`${points[index].label}-${index}`} className="chart__label">
            {points[index].label}
          </span>
        ))}
      </div>
    </div>
  );
}
