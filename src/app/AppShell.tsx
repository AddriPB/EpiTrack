import { PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";
import { FloatingActionButton } from "../shared/components/FloatingActionButton";
import { useAuth } from "../services/auth/AuthContext";

type AppShellProps = PropsWithChildren<{
  showFab: boolean;
}>;

const navItems = [
  { to: "/calendar", label: "Calendrier" },
  { to: "/add", label: "Ajouter" }
];

export function AppShell({ children, showFab }: AppShellProps) {
  const { signOutUser, user } = useAuth();
  const pseudo = user?.displayName || user?.email?.split("@")[0] || null;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__row">
          <div>
            <p className="eyebrow">Suivi des crises</p>
            <h1>EpiTrack</h1>
            {pseudo ? <p className="app-header__meta">{pseudo}</p> : null}
          </div>

          <button
            type="button"
            className="icon-button"
            onClick={() => {
              void signOutUser();
            }}
            aria-label="Se déconnecter"
            title="Se déconnecter"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M15.75 3H8.25A2.25 2.25 0 0 0 6 5.25v13.5A2.25 2.25 0 0 0 8.25 21h7.5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
              />
              <path
                d="M12 12h9m0 0-3-3m3 3-3 3"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.7"
              />
            </svg>
          </button>
        </div>
      </header>

      <main className="app-main">{children}</main>

      <nav className="primary-nav" aria-label="Navigation principale">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `primary-nav__link${isActive ? " primary-nav__link--active" : ""}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {showFab ? <FloatingActionButton to="/add" label="Ajouter une crise" /> : null}
    </div>
  );
}
