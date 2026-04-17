import { ChangeEvent, useMemo, useState } from "react";
import { LoadingState } from "../../shared/components/LoadingState";
import { ErrorState } from "../../shared/components/ErrorState";
import { FlashNotice } from "../../shared/components/FlashNotice";
import { EpilepsyEvent } from "../../shared/types/event";
import { getMonthLabelShort } from "../calendar/utils/date";
import { useEpilepsyEventsYears } from "./hooks/useEpilepsyEventsYears";

type Point = {
  label: string;
  value: number;
};

type RollingWindow = {
  label: string;
  monthSpan: number;
  start: Date;
  end: Date;
};

type TrendSummary = {
  current: number;
  previous: number;
  change: number;
  direction: "up" | "down" | "flat";
};

type AveragePeriod =
  | { unit: "years"; value: number }
  | { unit: "months"; value: number };

const CHART_WIDTH = 320;
const CHART_HEIGHT = 168;
const CHART_PADDING_X = 18;
const CHART_PADDING_Y = 18;

export function GraphsPage() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [averageYearsInput, setAverageYearsInput] = useState("1");
  const [averageMonthsInput, setAverageMonthsInput] = useState("");
  const [averagePeriod, setAveragePeriod] = useState<AveragePeriod>({ unit: "years", value: 1 });
  const rollingMonth = useMemo(() => buildRollingWindow(today, 1, "1 mois glissant"), [today]);
  const rollingYear = useMemo(() => buildRollingWindow(today, 12, "12 mois glissants"), [today]);
  const averageMonthSpan = averagePeriod.unit === "years" ? averagePeriod.value * 12 : averagePeriod.value;
  const rollingAverageWindow = useMemo(
    () => buildRollingWindow(today, averageMonthSpan, formatAveragePeriodLabel(averagePeriod)),
    [averageMonthSpan, averagePeriod, today]
  );
  const requiredYears = useMemo(
    () => getRequiredYears(today, rollingMonth, rollingYear, rollingAverageWindow),
    [today, rollingMonth, rollingYear, rollingAverageWindow]
  );
  const { events, loading, error, firebaseReady } = useEpilepsyEventsYears(requiredYears);

  const monthlyAverage = useMemo(
    () => buildMonthlyAverage(events, rollingAverageWindow, averageMonthSpan),
    [averageMonthSpan, events, rollingAverageWindow]
  );
  const monthTrend = useMemo(() => buildTrendSummary(events, rollingMonth), [events, rollingMonth]);
  const yearTrend = useMemo(() => buildTrendSummary(events, rollingYear), [events, rollingYear]);
  const chartPoints = useMemo(() => buildLastTwelveMonthsPoints(events, today), [events, today]);

  function handleAverageYearsChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = event.target.value.replace(/\D+/g, "");
    setAverageYearsInput(nextValue);

    if (nextValue === "") {
      return;
    }

    const parsedValue = Number.parseInt(nextValue, 10);

    if (Number.isNaN(parsedValue) || parsedValue < 1) {
      return;
    }

    setAverageMonthsInput("");
    setAveragePeriod({ unit: "years", value: parsedValue });
  }

  function handleAverageMonthsChange(event: ChangeEvent<HTMLInputElement>) {
    const rawValue = event.target.value.replace(/\D+/g, "");

    if (rawValue === "") {
      setAverageMonthsInput("");
      return;
    }

    const parsedValue = Math.min(12, Number.parseInt(rawValue, 10));

    if (Number.isNaN(parsedValue) || parsedValue < 1) {
      return;
    }

    setAverageMonthsInput(String(parsedValue));
    setAverageYearsInput("");
    setAveragePeriod({ unit: "months", value: parsedValue });
  }

  return (
    <section className="page-section">
      <div className="page-heading page-heading--compact">
        <div>
          <h2>Statistiques</h2>
        </div>
      </div>

      <FlashNotice />

      {!firebaseReady ? (
        <ErrorState
          title="Configuration Firebase manquante"
          description="Renseignez les variables d’environnement Vite pour connecter Firestore."
        />
      ) : null}

      {firebaseReady && loading ? <LoadingState label="Chargement des statistiques…" /> : null}
      {firebaseReady && error ? (
        <ErrorState title="Impossible de charger les données" description={error} />
      ) : null}

      {firebaseReady && !loading && !error ? (
        <>
          <div className="stats-overview" aria-label="Synthèse des statistiques">
            <StatsAverageCard
              average={monthlyAverage}
              period={averagePeriod}
              yearsInput={averageYearsInput}
              monthsInput={averageMonthsInput}
              onYearsChange={handleAverageYearsChange}
              onMonthsChange={handleAverageMonthsChange}
            />
            <StatsTrendCard summary={monthTrend} window={rollingMonth} />
            <StatsTrendCard summary={yearTrend} window={rollingYear} />
          </div>

          <div className="chart-card chart-card--stats">
            <div className="chart-card__header">
              <div>
                <h3>Répartition sur 12 mois</h3>
              </div>
            </div>

            <LineChart points={chartPoints} />
          </div>
        </>
      ) : null}
    </section>
  );
}

function StatsAverageCard({
  average,
  period,
  yearsInput,
  monthsInput,
  onYearsChange,
  onMonthsChange
}: {
  average: { value: number; total: number; months: number };
  period: AveragePeriod;
  yearsInput: string;
  monthsInput: string;
  onYearsChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onMonthsChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <article className="stats-card">
      <p className="section-label">Crises / mois</p>
      <div className="stats-card__row">
        <div>
          <span className="stats-card__label">Moyenne glissante</span>
          <strong className="stats-card__value">{formatAverage(average.value)}</strong>
        </div>

        <div className="stats-card__controls">
          <label className="stats-card__control" htmlFor="average-years">
            <span>Années</span>
            <input
              id="average-years"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={yearsInput}
              onChange={onYearsChange}
              placeholder="1"
            />
          </label>

          <label className="stats-card__control" htmlFor="average-months">
            <span>Mois</span>
            <input
              id="average-months"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={monthsInput}
              onChange={onMonthsChange}
              placeholder="1-12"
            />
          </label>
        </div>
      </div>

      <p className="stats-card__range">{average.total} crise(s) sur {average.months} mois glissants</p>
      <p className="stats-card__comparison">Fenêtre choisie : {formatAveragePeriodLabel(period)}</p>
    </article>
  );
}

function StatsTrendCard({
  summary,
  window
}: {
  summary: TrendSummary;
  window: RollingWindow;
}) {
  return (
    <article className="stats-card">
      <p className="section-label">{window.label}</p>
      <div className="stats-card__row">
        <div>
          <span className="stats-card__label">Total crises</span>
          <strong className="stats-card__value">{summary.current}</strong>
        </div>

        <div
          className={`stats-card__trend stats-card__trend--${summary.direction}`}
          aria-label={`Variation ${formatSignedPercent(summary.change)}`}
        >
          <span className="stats-card__trend-sign">{formatSignedPercent(summary.change)}</span>
          <span className="stats-card__trend-label">vs période précédente</span>
        </div>
      </div>

      <p className="stats-card__range">{formatDateRange(window.start, window.end)}</p>
      <p className="stats-card__comparison">Période précédente : {summary.previous} crise(s)</p>
    </article>
  );
}

function buildTrendSummary(events: EpilepsyEvent[], currentWindow: RollingWindow): TrendSummary {
  const current = countEventsInRange(events, currentWindow.start, currentWindow.end);
  const previousWindow = buildPreviousWindow(currentWindow);
  const previous = countEventsInRange(events, previousWindow.start, previousWindow.end);
  const change = calculatePercentChange(current, previous);

  return {
    current,
    previous,
    change,
    direction: getTrendDirection(change)
  };
}

function buildMonthlyAverage(events: EpilepsyEvent[], window: RollingWindow, monthSpan: number) {
  const total = countEventsInRange(events, window.start, window.end);
  const months = Math.max(1, monthSpan);

  return {
    value: total / months,
    total,
    months
  };
}

function formatAveragePeriodLabel(period: AveragePeriod) {
  if (period.unit === "years") {
    return `${period.value} an${period.value > 1 ? "s" : ""} glissant${period.value > 1 ? "s" : ""}`;
  }

  return `${period.value} mois glissant${period.value > 1 ? "s" : ""}`;
}

function buildLastTwelveMonthsPoints(events: EpilepsyEvent[], today: Date): Point[] {
  return Array.from({ length: 12 }, (_, index) => {
    const monthDate = shiftMonthClamped(today, index - 11);
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth() + 1;
    const monthKey = `${year}-${String(month).padStart(2, "0")}`;

    return {
      label: getMonthLabelShort(year, monthDate.getMonth()).replace(".", ""),
      value: events.filter((event) => event.monthKey === monthKey).length
    };
  });
}

function buildRollingWindow(end: Date, monthSpan: number, label: string): RollingWindow {
  const start = shiftMonthClamped(end, -monthSpan);

  return {
    label,
    monthSpan,
    start,
    end
  };
}

function buildPreviousWindow(window: RollingWindow): RollingWindow {
  const end = addDays(window.start, -1);
  const start = shiftMonthClamped(end, -window.monthSpan);

  return {
    label: "Période précédente",
    monthSpan: window.monthSpan,
    start,
    end
  };
}

function getRequiredYears(
  today: Date,
  rollingMonth: RollingWindow,
  rollingYear: RollingWindow,
  rollingAverageWindow: RollingWindow
) {
  return Array.from(
    new Set([
      today.getFullYear(),
      rollingMonth.start.getFullYear(),
      rollingYear.start.getFullYear(),
      rollingAverageWindow.start.getFullYear(),
      buildPreviousWindow(rollingYear).start.getFullYear()
    ])
  ).sort((left, right) => left - right);
}

function countEventsInRange(events: EpilepsyEvent[], start: Date, end: Date) {
  const startKey = toDateKey(start);
  const endKey = toDateKey(end);

  return events.filter((event) => event.dateKey >= startKey && event.dateKey <= endKey).length;
}

function calculatePercentChange(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return Math.round(((current - previous) / previous) * 100);
}

function getTrendDirection(change: number): "up" | "down" | "flat" {
  if (change > 0) {
    return "up";
  }

  if (change < 0) {
    return "down";
  }

  return "flat";
}

function formatSignedPercent(value: number) {
  if (value === 0) {
    return "0%";
  }

  return `${value > 0 ? "+" : ""}${value}%`;
}

function formatAverage(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1
  }).format(value);
}

function formatDateRange(start: Date, end: Date) {
  return `${formatLocalDate(start)} au ${formatLocalDate(end)}`;
}

function formatLocalDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(date);
}

function toDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function shiftMonthClamped(date: Date, delta: number) {
  const targetMonthIndex = date.getMonth() + delta;
  const targetYear = date.getFullYear() + Math.floor(targetMonthIndex / 12);
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;
  const maxDay = new Date(targetYear, normalizedMonth + 1, 0).getDate();
  const targetDay = Math.min(date.getDate(), maxDay);

  return new Date(targetYear, normalizedMonth, targetDay);
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

  return (
    <div className="chart">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="chart__svg"
        role="img"
        aria-label="Graphique des crises sur les douze derniers mois"
      >
        <path
          className="chart__baseline"
          d={`M ${CHART_PADDING_X} ${CHART_HEIGHT - CHART_PADDING_Y} H ${CHART_WIDTH - CHART_PADDING_X}`}
        />
        <path className="chart__line" d={linePath} />
        {points.map((point, index) => {
          const x = CHART_PADDING_X + stepX * index;
          const y = CHART_HEIGHT - CHART_PADDING_Y - (point.value / maxValue) * usableHeight;
          const labelY = Math.max(12, y - 8);

          return (
            <g key={`${point.label}-${index}`}>
              <text x={x} y={labelY} textAnchor="middle" className="chart__point-value">
                {point.value}
              </text>
              <circle cx={x} cy={y} r="2.8" className="chart__dot" />
            </g>
          );
        })}
      </svg>

      <div className="chart__labels">
        {points.map((point, index) => (
          <span key={`${point.label}-${index}`} className="chart__label">
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
}
