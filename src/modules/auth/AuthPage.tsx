import { FirebaseError } from "firebase/app";
import { updateProfile } from "firebase/auth";
import { FormEvent, useState } from "react";
import { ErrorState } from "../../shared/components/ErrorState";
import { useAuth } from "../../services/auth/AuthContext";
import { getFirebaseAuth } from "../../services/firebase/config";

type AuthMode = "signin" | "signup";

const MIN_PASSWORD_LENGTH = 6;

export function AuthPage() {
  const { firebaseReady, signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [pseudo, setPseudo] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!firebaseReady) {
      setError("Configuration Firebase manquante.");
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    const normalizedPseudo = normalizePseudo(pseudo);

    if (!normalizedPseudo) {
      setError("Pseudo invalide.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (mode === "signin") {
        await signInWithEmail(buildPseudoEmail(normalizedPseudo), password);
      } else {
        await signUpWithEmail(buildPseudoEmail(normalizedPseudo), password);
        const currentUser = getFirebaseAuth().currentUser;
        if (currentUser) {
          await updateProfile(currentUser, { displayName: pseudo.trim() });
        }
      }
    } catch (submissionError) {
      setError(getAuthErrorMessage(submissionError));
    } finally {
      setSubmitting(false);
    }
  }

  if (!firebaseReady) {
    return (
      <section className="page-section page-section--narrow auth-page">
        <ErrorState
          title="Configuration Firebase manquante"
          description="Ajoutez les paramètres Firebase pour activer la connexion."
        />
      </section>
    );
  }

  return (
    <section className="page-section page-section--narrow auth-page">
      <div className="auth-hero">
        <h1>EpiTrack</h1>
        <p className="auth-hero__text">Connexion rapide à votre espace.</p>
      </div>

      <div className="auth-card">
        <div className="segmented-control" role="tablist" aria-label="Connexion ou création">
          <button
            type="button"
            className={mode === "signin" ? "is-active" : ""}
            onClick={() => {
              setMode("signin");
              setError(null);
            }}
          >
            Connexion
          </button>
          <button
            type="button"
            className={mode === "signup" ? "is-active" : ""}
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
          >
            Créer un compte
          </button>
        </div>

        <form className="form-card" onSubmit={handleSubmit}>
          <label className="field">
            <span>Pseudo</span>
            <input
              type="text"
              value={pseudo}
              onChange={(event) => setPseudo(event.target.value)}
              placeholder="Votre pseudo"
              autoCapitalize="none"
              autoCorrect="off"
              autoComplete="username"
              required
            />
          </label>

          <label className="field">
            <span>Mot de passe</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="6 caractères minimum"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting
              ? "Validation…"
              : mode === "signin"
                ? "Se connecter"
                : "Créer mon compte"}
          </button>
        </form>
      </div>
    </section>
  );
}

function getAuthErrorMessage(error: unknown) {
  if (!(error instanceof FirebaseError)) {
    return "Action impossible pour le moment.";
  }

  switch (error.code) {
    case "auth/email-already-in-use":
      return "Ce pseudo est déjà utilisé.";
    case "auth/invalid-email":
      return "Pseudo invalide.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Pseudo ou mot de passe incorrect.";
    case "auth/weak-password":
      return "Le mot de passe est trop faible.";
    case "auth/too-many-requests":
      return "Trop de tentatives. Réessayez un peu plus tard.";
    default:
      return "Action impossible pour le moment.";
  }
}

function normalizePseudo(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");
}

function buildPseudoEmail(pseudo: string) {
  return `${pseudo}@epitrack.local`;
}
