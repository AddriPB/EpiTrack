type StatCardsProps = {
  yellowOrange: number;
  red: number;
  total: number;
};

export function StatCards({ yellowOrange, red, total }: StatCardsProps) {
  return (
    <div className="stat-grid" aria-label="Synthèse des crises">
      <article className="stat-card stat-card--amber">
        <span className="stat-card__label stat-card__label--split">
          <span className="severity-label severity-label--green">Légère</span>
          <span className="severity-label severity-label--yellow">Moyenne</span>
        </span>
      <strong>{yellowOrange}</strong>
      </article>
      <article className="stat-card stat-card--red">
        <span className="stat-card__label">
          <span className="severity-label severity-label--red">Grave</span>
        </span>
        <strong>{red}</strong>
      </article>
      <article className="stat-card stat-card--total">
        <span className="stat-card__label">Total</span>
        <strong>{total}</strong>
      </article>
    </div>
  );
}
