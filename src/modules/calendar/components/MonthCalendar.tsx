import { getCalendarDays, getMonthLabelShort, getWeekdayLabels } from "../utils/date";
import { groupEventsByDay } from "../utils/aggregations";
import { EpilepsyEvent } from "../../../shared/types/event";
import { EmptyState } from "../../../shared/components/EmptyState";

type MonthCalendarProps = {
  year: number;
  monthIndex: number;
  events: EpilepsyEvent[];
};

export function MonthCalendar({ year, monthIndex, events }: MonthCalendarProps) {
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
          const visibleDots = dayEvents.slice(0, 4);
          const overflow = Math.max(dayEvents.length - visibleDots.length, 0);

          return (
            <article
              key={day.dateKey}
              className={`calendar-day${day.isCurrentMonth ? "" : " calendar-day--muted"}`}
              role="gridcell"
              aria-label={`${day.day} ${getMonthLabelShort(day.year, day.monthIndex)}${
                dayEvents.length ? `, ${dayEvents.length} crise(s)` : ""
              }`}
            >
              <span className="calendar-day__number">{day.day}</span>

              <div className="calendar-day__dots" aria-hidden="true">
                {visibleDots.map((event) => (
                  <span
                    key={event.id}
                    className={`event-dot event-dot--${event.color}`}
                  />
                ))}
                {overflow > 0 ? <span className="event-overflow">+{overflow}</span> : null}
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
