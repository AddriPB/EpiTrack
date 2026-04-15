type StatCardsProps = {
  yellowOrange: number;
  red: number;
  total: number;
};

export function StatCards({ yellowOrange, red, total }: StatCardsProps) {
  return (
    <div className="stat-grid">
      <article className="stat-card">
        <span className="stat-card__label">Jaune + orange</span>
        <strong>{yellowOrange}</strong>
      </article>
      <article className="stat-card">
        <span className="stat-card__label">Rouge</span>
        <strong>{red}</strong>
      </article>
      <article className="stat-card">
        <span className="stat-card__label">Total</span>
        <strong>{total}</strong>
      </article>
    </div>
  );
}
