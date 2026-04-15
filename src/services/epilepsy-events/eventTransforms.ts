import { DocumentData, Timestamp } from "firebase/firestore";
import { CreateEpilepsyEventInput, EpilepsyEvent, EventColor } from "../../shared/types/event";

export function toFirestorePayload(input: CreateEpilepsyEventInput) {
  const date = new Date(`${input.date}T12:00:00`);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  const dateKey = `${monthKey}-${String(day).padStart(2, "0")}`;

  return {
    dateKey,
    monthKey,
    year,
    month,
    day,
    color: input.color,
    observation: input.observation ?? ""
  };
}

export function toUiEvent(id: string, data: DocumentData): EpilepsyEvent {
  return {
    id,
    dateKey: String(data.dateKey),
    monthKey: String(data.monthKey),
    year: Number(data.year),
    month: Number(data.month),
    day: Number(data.day),
    color: normalizeColor(data.color),
    observation: data.observation ? String(data.observation) : undefined,
    createdAt: serializeTimestamp(data.createdAt)
  };
}

function normalizeColor(color: unknown): EventColor {
  if (color === "yellow" || color === "orange" || color === "red") {
    return color;
  }

  return "yellow";
}

function serializeTimestamp(timestamp: unknown) {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }

  return null;
}
