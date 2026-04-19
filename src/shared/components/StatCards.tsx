type StatCardsProps = {
  yellowOrange: number;
  red: number;
  total: number;
};

export function StatCards({ yellowOrange, red, total }: StatCardsProps) {
  return (
    <div className="stat-grid" aria-label="Synthèse des crises">
      <article className="stat-card stat-card--amber">
        <span className="stat-card__label">Lég. + moy.</span>
        <strong>{yellowOrange}</strong>
      </article>
      <article className="stat-card stat-card--red">
        <span className="stat-card__label">Grave</span>
        <strong>{red}</strong>
      </article>
      <article className="stat-card stat-card--total">
        <span className="stat-card__label">Total</span>
        <strong>{total}</strong>
      </article>
    </div>
  );
}
