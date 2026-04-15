import { MonthSummary } from "../../../shared/types/event";

type YearSummaryGridProps = {
  year: number;
  months: MonthSummary[];
};

export function YearSummaryGrid({ year, months }: YearSummaryGridProps) {
  return (
    <div className="year-grid" aria-label={`Synthèse annuelle ${year}`}>
      {months.map((month) => (
        <article key={month.monthKey} className="year-card">
          <div>
            <p className="year-card__label">{month.label}</p>
            <strong className="year-card__value">{month.total}</strong>
          </div>
          <span className="year-card__meta">crise(s)</span>
        </article>
      ))}
    </div>
  );
}
