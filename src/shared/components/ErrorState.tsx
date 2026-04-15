type ErrorStateProps = {
  title: string;
  description: string;
};

export function ErrorState({ title, description }: ErrorStateProps) {
  return (
    <div className="state-card state-card--error" role="alert">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
