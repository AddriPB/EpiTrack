import { MonthSummary } from "../../../shared/types/event";

type YearSummaryGridProps = {
  year: number;
  months: MonthSummary[];
};

export function YearSummaryGrid({ year, months }: YearSummaryGridProps) {
  return (
    <section className="year-summary" aria-label={`Synthèse annuelle ${year}`}>
      <div className="year-summary__header">
        <div>
          <p className="section-label">Lecture annuelle</p>
          <h3>{year}</h3>
        </div>
        <span className="year-summary__meta">12 mois</span>
      </div>

      <div className="year-grid">
        {months.map((month) => (
          <article key={month.monthKey} className="year-card">
            <p className="year-card__label">{month.label}</p>
            <div className="year-card__summary">
              <strong className="year-card__value">{month.total}</strong>
              <span className="year-card__meta">crises</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
