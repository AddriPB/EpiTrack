export type EventColor = "yellow" | "orange" | "red";

export type EpilepsyEvent = {
  id: string;
  dateKey: string;
  monthKey: string;
  year: number;
  month: number;
  day: number;
  color: EventColor;
  observation?: string;
  createdAt: string | null;
};

export type CreateEpilepsyEventInput = {
  date: string;
  color: EventColor;
  observation?: string;
};

export type SummaryTotals = {
  yellowOrange: number;
  red: number;
  total: number;
};

export type MonthSummary = {
  monthKey: string;
  label: string;
  total: number;
};
