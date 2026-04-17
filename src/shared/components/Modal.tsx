import { ReactNode, useEffect } from "react";

type ModalProps = {
  title: string;
  children: ReactNode;
  onClose: () => void;
  showCloseButton?: boolean;
};

export function Modal({ title, children, onClose, showCloseButton = true }: ModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-card__header">
          <h3>{title}</h3>
          {showCloseButton ? (
            <button
              type="button"
              className="icon-button"
              onClick={onClose}
              aria-label="Fermer"
              title="Fermer"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6 6 18"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
            </button>
          ) : null}
        </div>

        <div className="modal-card__body">{children}</div>
      </div>
    </div>
  );
}
