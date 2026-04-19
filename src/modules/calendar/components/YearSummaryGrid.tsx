import { MonthSummary } from "../../../shared/types/event";

type YearSummaryGridProps = {
  year: number;
  months: MonthSummary[];
  onMonthSelect: (monthKey: string) => void;
};

export function YearSummaryGrid({ year, months, onMonthSelect }: YearSummaryGridProps) {
  return (
    <section className="year-summary" aria-label={`Synthèse annuelle ${year}`}>
      <div className="year-summary__header">
        <h3>{year}</h3>
      </div>

      <div className="year-grid">
        {months.map((month) => (
          <button
            key={month.monthKey}
            type="button"
            className="year-card"
            onClick={() => onMonthSelect(month.monthKey)}
            aria-label={`Afficher ${month.label} ${year}`}
          >
            <span className="year-card__label">{month.label}</span>
            <span className="year-card__summary">
              <strong className="year-card__value">{month.total}</strong>
              <span className="year-card__meta">crises</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
