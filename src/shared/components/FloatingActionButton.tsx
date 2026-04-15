import { Link } from "react-router-dom";

type FloatingActionButtonProps = {
  to: string;
  label: string;
};

export function FloatingActionButton({ to, label }: FloatingActionButtonProps) {
  return (
    <Link to={to} className="fab" aria-label={label}>
      +
    </Link>
  );
}
