import { MonthSummary, SummaryTotals, EpilepsyEvent } from "../../../shared/types/event";
import { getMonthLabelShort } from "./date";

export function groupEventsByDay(events: EpilepsyEvent[]) {
  return events.reduce((map, event) => {
    const items = map.get(event.day) ?? [];
    items.push(event);
    map.set(event.day, items);
    return map;
  }, new Map<number, EpilepsyEvent[]>());
}

export function getMonthlySummary(events: EpilepsyEvent[], monthKey: string) {
  const monthEvents = events.filter((event) => event.monthKey === monthKey);
  const totals = getTotals(monthEvents);

  return {
    ...totals,
    events: monthEvents
  };
}

export function getYearlySummary(events: EpilepsyEvent[], year: number) {
  const totals = getTotals(events);
  const months: MonthSummary[] = Array.from({ length: 12 }, (_, monthIndex) => {
    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
    const monthEvents = events.filter((event) => event.monthKey === monthKey);

    return {
      monthKey,
      label: getMonthLabelShort(year, monthIndex),
      total: monthEvents.length
    };
  });

  return {
    ...totals,
    months
  };
}

function getTotals(events: EpilepsyEvent[]): SummaryTotals {
  const yellowOrange = events.filter((event) => event.color !== "red").length;
  const red = events.filter((event) => event.color === "red").length;

  return {
    yellowOrange,
    red,
    total: events.length
  };
}
