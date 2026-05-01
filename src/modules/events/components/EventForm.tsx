import { FormEvent } from "react";
import { EVENT_COLORS } from "../../../shared/constants/designTokens";
import { EventColor } from "../../../shared/types/event";

type EventFormProps = {
  date: string;
  color: EventColor;
  observation: string;
  saving: boolean;
  error: string | null;
  onDateChange: (value: string) => void;
  onColorChange: (value: EventColor) => void;
  onObservationChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function EventForm({
  date,
  color,
  observation,
  saving,
  error,
  onDateChange,
  onColorChange,
  onObservationChange,
  onCancel,
  onSubmit
}: EventFormProps) {
  return (
    <form className="form-card form-card--entry" onSubmit={onSubmit}>
      <label className="field field--date">
        <span>Date</span>
        <input
          type="date"
          value={date}
          onChange={(event) => onDateChange(event.target.value)}
          required
        />
      </label>

      <fieldset className="field fieldset fieldset--severity">
        <legend>Gravité</legend>
        <div className="color-picker" role="radiogroup" aria-label="Choisir une couleur">
          {EVENT_COLORS.map((item) => (
            <label
              key={item.value}
              className={`color-choice${color === item.value ? " color-choice--selected" : ""}`}
            >
              <input
                type="radio"
                name="color"
                value={item.value}
                checked={color === item.value}
                onChange={() => onColorChange(item.value)}
                className={`color-choice__input color-choice__input--${item.value}`}
              />
              <span
                className={`color-choice__label color-choice__label--${item.value}`}
                style={{ color: item.textColor }}
              >
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="field">
        <span>Observation</span>
        <textarea
          rows={2}
          value={observation}
          onChange={(event) => onObservationChange(event.target.value)}
          placeholder="Facultatif"
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="modal-actions">
        <button
          type="button"
          className="ghost-button ghost-button--compact"
          onClick={onCancel}
          disabled={saving}
        >
          Annuler
        </button>
        <button type="submit" className="primary-button primary-button--compact" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
