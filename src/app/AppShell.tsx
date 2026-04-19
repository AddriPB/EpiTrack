import { PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";
import { FloatingActionButton } from "../shared/components/FloatingActionButton";
import { useAuth } from "../services/auth/AuthContext";

type AppShellProps = PropsWithChildren<{
  showFab: boolean;
  fabTo: string;
  fabLabel: string;
}>;

const navItems = [
  { to: "/calendar", label: "Calendrier", icon: CalendarIcon },
  { to: "/stats", label: "Statistiques", icon: StatsIcon },
  { to: "/treatment", label: "Traitement", icon: TreatmentIcon }
];

export function AppShell({ children, showFab, fabTo, fabLabel }: AppShellProps) {
  const { signOutUser } = useAuth();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__row">
          <div>
            <h1 className="app-brand" aria-label="EpiTrack">
              <span className="app-brand__epi">Epi</span>
              <span className="app-brand__track">Track</span>
            </h1>
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
        <div className="primary-nav__rail">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                aria-label={item.label}
                title={item.label}
                className={({ isActive }) =>
                  `primary-nav__link${isActive ? " primary-nav__link--active" : ""}`
                }
              >
                <Icon />
                <span className="sr-only">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {showFab ? <FloatingActionButton to={fabTo} label={fabLabel} /> : null}
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M7.5 3v3m9-3v3M4.5 9h15M6.75 5.25h10.5A2.25 2.25 0 0 1 19.5 7.5v9.75a2.25 2.25 0 0 1-2.25 2.25H6.75a2.25 2.25 0 0 1-2.25-2.25V7.5a2.25 2.25 0 0 1 2.25-2.25Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function StatsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4.5 19.5h15M7.5 16.5v-4.5m4.5 4.5v-9m4.5 9V9"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="m6.75 8.25 3.75-2.25 3 2.25 3.75-3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function TreatmentIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9 4.5h6m-5.25 0v2.25m4.5-2.25v2.25M8.25 6.75h7.5a1.5 1.5 0 0 1 1.5 1.5v9A3.75 3.75 0 0 1 13.5 21h-3A3.75 3.75 0 0 1 6.75 17.25v-9a1.5 1.5 0 0 1 1.5-1.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.85"
      />
      <path
        d="M12 11.25v4.5M9.75 13.5h4.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.85"
      />
    </svg>
  );
}
