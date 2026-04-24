//Stalbek Ulanbek uulu 261102435
import { useEffect, useMemo, useState } from 'react';
import OutlineButton from './OutlineButton';
import { formatLongDate, formatMonthLabel, getDayKey, parseDayKey } from '../utils/date';
import { allBookingTypeIds, getBookingTypeMeta } from '../utils/bookings';

const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMonthGrid(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingEmptyCells = (firstDay.getDay() + 6) % 7;
  const totalCells = Math.ceil((leadingEmptyCells + daysInMonth) / 7) * 7;
  const cells = [];

  for (let index = 0; index < totalCells; index += 1) {
    const dayNumber = index - leadingEmptyCells + 1;

    if (dayNumber < 1 || dayNumber > daysInMonth) {
      cells.push(null);
      continue;
    }

    cells.push(new Date(year, month, dayNumber));
  }

  return cells;
}

function ScheduleCalendar({ items, onDaySelect, selectedDayKey, title }) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    if (selectedDayKey) {
      return parseDayKey(selectedDayKey);
    }

    if (items[0]) {
      return new Date(items[0].startAt);
    }

    return new Date();
  });

  useEffect(() => {
    if (selectedDayKey) {
      setVisibleMonth(parseDayKey(selectedDayKey));
    }
  }, [selectedDayKey]);

  const itemCountsByDay = useMemo(() => {
    const countsByDay = new Map();

    items.forEach((item) => {
      const dayKey = getDayKey(item.startAt);
      const bookingType = item.bookingType || 'type-1';

      if (!countsByDay.has(dayKey)) {
        countsByDay.set(dayKey, new Map());
      }

      const countsForDay = countsByDay.get(dayKey);
      countsForDay.set(bookingType, (countsForDay.get(bookingType) || 0) + 1);
    });

    return countsByDay;
  }, [items]);

  const monthGrid = getMonthGrid(visibleMonth);
  const todayKey = getDayKey(new Date());

  const showPreviousMonth = () => {
    setVisibleMonth((currentMonth) => new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const showNextMonth = () => {
    setVisibleMonth((currentMonth) => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <section className="dashboard-card calendar-card">
      <div className="dashboard-card-head">
        <div>
          <p className="eyebrow">Calendar</p>
          <h2>{title || formatMonthLabel(visibleMonth)}</h2>
        </div>

        <div className="calendar-controls">
          <OutlineButton className="calendar-control" onClick={showPreviousMonth}>
            Prev
          </OutlineButton>
          <OutlineButton className="calendar-control" onClick={showNextMonth}>
            Next
          </OutlineButton>
        </div>
      </div>

      <div className="calendar-weekday-row" aria-hidden="true">
        {weekdayLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="calendar-month-grid">
        {monthGrid.map((day, index) => {
          if (!day) {
            return <div className="calendar-month-spacer" key={`empty-${index}`}></div>;
          }

          const dayKey = getDayKey(day);
          const dayTypeCounts = Array.from(itemCountsByDay.get(dayKey) || [])
            .sort((firstEntry, secondEntry) => (
              allBookingTypeIds.indexOf(firstEntry[0]) - allBookingTypeIds.indexOf(secondEntry[0])
            ))
            .map(([typeId, count]) => ({
              count,
              meta: getBookingTypeMeta(typeId),
              typeId
            }));
          const dayTypeLabels = dayTypeCounts.map(({ count, meta }) => (
            `${count} ${meta.label} booking ${count === 1 ? 'item' : 'items'}`
          ));
          const hasItems = Boolean(dayTypeCounts.length);
          const isSelected = dayKey === selectedDayKey;
          const isToday = dayKey === todayKey;

          return (
            <button
              aria-label={`${formatLongDate(day)}${dayTypeLabels.length ? `, ${dayTypeLabels.join(', ')} booking items` : ', no booking items'}`}
              className={`calendar-month-day${hasItems ? ' calendar-month-day-has-items' : ''}${isSelected ? ' calendar-month-day-selected' : ''}${isToday ? ' calendar-month-day-today' : ''}`}
              key={dayKey}
              onClick={() => onDaySelect(dayKey)}
              type="button"
            >
              <span className="calendar-day-number">{day.getDate()}</span>
              <span className="calendar-day-dots" aria-hidden="true">
                {dayTypeCounts.map(({ count, meta, typeId }) => (
                  <span
                    className={`booking-type-count ${meta.colorClass}`}
                    key={`${dayKey}-${typeId}`}
                    title={`${count} ${meta.label}`}
                  >
                    {count}
                  </span>
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default ScheduleCalendar;
