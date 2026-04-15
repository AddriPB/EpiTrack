const monthFormatter = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric"
});

const monthShortFormatter = new Intl.DateTimeFormat("fr-FR", {
  month: "short"
});

const weekdayFormatter = new Intl.DateTimeFormat("fr-FR", {
  weekday: "short"
});

export function getMonthLabel(year: number, monthIndex: number) {
  const date = new Date(year, monthIndex, 1);
  return monthFormatter.format(date);
}

export function getMonthLabelShort(year: number, monthIndex: number) {
  const date = new Date(year, monthIndex, 1);
  const label = monthShortFormatter.format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function getWeekdayLabels() {
  const monday = new Date(2024, 0, 1);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return weekdayFormatter.format(date).slice(0, 3);
  });
}

export function getMonthRange(year: number, monthIndex: number) {
  const month = monthIndex + 1;
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;

  return { monthKey };
}

export function shiftMonth(year: number, monthIndex: number, delta: number) {
  const date = new Date(year, monthIndex + delta, 1);
  return buildYearSummary(date);
}

export function buildYearSummary(date: Date) {
  return {
    year: date.getFullYear(),
    monthIndex: date.getMonth()
  };
}

export function getCalendarDays(year: number, monthIndex: number) {
  const firstDay = new Date(year, monthIndex, 1);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const startDate = new Date(year, monthIndex, 1 - firstWeekday);
  const today = new Date();

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return {
      dateKey: date.toISOString(),
      year: date.getFullYear(),
      monthIndex: date.getMonth(),
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === monthIndex,
      isToday:
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
    };
  });
}
