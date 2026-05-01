import { useRef } from "react";
import { getCalendarDays, getMonthLabelShort, getWeekdayLabels } from "../utils/date";
import { groupEventsByDay } from "../utils/aggregations";
import { EpilepsyEvent } from "../../../shared/types/event";
import { Treatment } from "../../../shared/types/treatment";

type MonthCalendarProps = {
  year: number;
  monthIndex: number;
  events: EpilepsyEvent[];
  treatmentMarkers: Treatment[];
  onDaySelect: (day: { dateKey: string; label: string; events: EpilepsyEvent[] }) => void;
  onDayLongPress: (day: { dateKey: string; label: string; events: EpilepsyEvent[] }) => void;
};

export function MonthCalendar({
  year,
  monthIndex,
  events,
  treatmentMarkers,
  onDaySelect,
  onDayLongPress
}: MonthCalendarProps) {
  const days = getCalendarDays(year, monthIndex);
  const weekdayLabels = getWeekdayLabels();
  const eventsByDay = groupEventsByDay(events);
  const treatmentsByDate = groupTreatmentsByDate(treatmentMarkers);
  const longPressedDaysRef = useRef(new Set<string>());

  return (
    <div className="calendar-card">
      <div className="calendar-grid calendar-grid--labels" aria-hidden="true">
        {weekdayLabels.map((label) => (
          <div key={label} className="calendar-label">
            {label}
          </div>
        ))}
      </div>

      <div className="calendar-grid" role="grid" aria-label={getMonthLabelShort(year, monthIndex)}>
        {days.map((day) => {
          const dayEvents = day.isCurrentMonth ? eventsByDay.get(day.day) ?? [] : [];
          const dayTreatments = day.isCurrentMonth ? treatmentsByDate.get(day.dateKey) ?? [] : [];
          const dayPayload = {
            dateKey: day.dateKey,
            label: `${day.day} ${getMonthLabelShort(day.year, day.monthIndex)}`,
            events: dayEvents
          };

          return (
            <article
              key={day.dateKey}
              className={`calendar-day${day.isCurrentMonth ? "" : " calendar-day--muted"}${
                day.isToday ? " calendar-day--today" : ""
              }`}
              role="gridcell"
              aria-label={`${day.day} ${getMonthLabelShort(day.year, day.monthIndex)}${
                dayEvents.length ? `, ${dayEvents.length} crise(s)` : ""
              }${dayTreatments.length ? `, ${dayTreatments.length} traitement(s)` : ""
              }`}
              onPointerDown={(event) => {
                if (!day.isCurrentMonth || dayEvents.length === 0) {
                  return;
                }

                const article = event.currentTarget;

                const timeoutId = window.setTimeout(() => {
                  longPressedDaysRef.current.add(day.dateKey);
                  onDayLongPress(dayPayload);
                }, 420);

                const clearPress = () => {
                  window.clearTimeout(timeoutId);
                  article.removeEventListener("pointerup", clearPress);
                  article.removeEventListener("pointerleave", clearPress);
                  article.removeEventListener("pointercancel", clearPress);
                };
                article.addEventListener("pointerup", clearPress, { once: true });
                article.addEventListener("pointerleave", clearPress, { once: true });
                article.addEventListener("pointercancel", clearPress, { once: true });
              }}
              onClick={() => {
                if (!day.isCurrentMonth) {
                  return;
                }

                if (longPressedDaysRef.current.has(day.dateKey)) {
                  longPressedDaysRef.current.delete(day.dateKey);
                  return;
                }

                onDaySelect(dayPayload);
              }}
            >
              <span className="calendar-day__number">{day.day}</span>

              <div className="calendar-day__dots" aria-hidden="true">
                {dayEvents.map((event) => (
                  <span
                    key={event.id}
                    className={`event-dot event-dot--${event.color}`}
                  />
                ))}
                {dayTreatments.map((treatment) => (
                  <span
                    key={treatment.id}
                    className="treatment-marker"
                    title={`Début ou changement: ${treatment.name}`}
                  />
                ))}
              </div>
            </article>
          );
        })}
      </div>

    </div>
  );
}

function groupTreatmentsByDate(treatments: Treatment[]) {
  return treatments.reduce((map, treatment) => {
    if (!treatment.startDate) {
      return map;
    }

    const items = map.get(treatment.startDate) ?? [];
    items.push(treatment);
    map.set(treatment.startDate, items);

    return map;
  }, new Map<string, Treatment[]>());
}
