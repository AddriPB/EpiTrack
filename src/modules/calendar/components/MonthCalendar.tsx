import { getCalendarDays, getMonthLabelShort, getWeekdayLabels } from "../utils/date";
import { groupEventsByDay } from "../utils/aggregations";
import { EpilepsyEvent } from "../../../shared/types/event";
import { EmptyState } from "../../../shared/components/EmptyState";

type MonthCalendarProps = {
  year: number;
  monthIndex: number;
  events: EpilepsyEvent[];
  onDayLongPress: (day: { dateKey: string; label: string; events: EpilepsyEvent[] }) => void;
};

export function MonthCalendar({ year, monthIndex, events, onDayLongPress }: MonthCalendarProps) {
  const days = getCalendarDays(year, monthIndex);
  const weekdayLabels = getWeekdayLabels();
  const eventsByDay = groupEventsByDay(events);

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

          return (
            <article
              key={day.dateKey}
              className={`calendar-day${day.isCurrentMonth ? "" : " calendar-day--muted"}${
                day.isToday ? " calendar-day--today" : ""
              }`}
              role="gridcell"
              aria-label={`${day.day} ${getMonthLabelShort(day.year, day.monthIndex)}${
                dayEvents.length ? `, ${dayEvents.length} crise(s)` : ""
              }`}
              onPointerDown={(event) => {
                if (!day.isCurrentMonth || dayEvents.length === 0) {
                  return;
                }

                const article = event.currentTarget;

                const timeoutId = window.setTimeout(() => {
                  onDayLongPress({
                    dateKey: day.dateKey,
                    label: `${day.day} ${getMonthLabelShort(day.year, day.monthIndex)}`,
                    events: dayEvents
                  });
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
            >
              <span className="calendar-day__number">{day.day}</span>

              <div className="calendar-day__dots" aria-hidden="true">
                {dayEvents.map((event) => (
                  <span
                    key={event.id}
                    className={`event-dot event-dot--${event.color}`}
                  />
                ))}
              </div>
            </article>
          );
        })}
      </div>

      {events.length === 0 ? (
        <EmptyState
          title="Aucune crise ce mois-ci"
          description="Utilisez le bouton + pour ajouter une première entrée."
        />
      ) : null}
    </div>
  );
}
