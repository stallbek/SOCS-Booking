//Stalbek Ulanbek uulu 261102435
import { useEffect, useState } from 'react';

const calendarWeekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const calendarPages = [
  { month: 'September', note: 'Office hours', daysInMonth: 30 },
  { month: 'October', note: 'Project review', daysInMonth: 31 },
  { month: 'November', note: 'Midterm help', daysInMonth: 30 },
  { month: 'December', note: 'Final prep', daysInMonth: 31 },
  { month: 'January', note: 'Term planning', daysInMonth: 31 },
  { month: 'February', note: 'Demo prep', daysInMonth: 28 },
  { month: 'March', note: 'Progress check', daysInMonth: 31 },
  { month: 'April', note: 'Presentation week', daysInMonth: 30 },
];

const CROSS_START_MS = 900;
const CROSS_INTERVAL_MS = 320;
const PAGE_END_PAUSE_MS = 900;
const PAGE_ENTER_MS = 420;
const PAGE_EXIT_MS = 420;

const calendarPageDurations = calendarPages.map(
  (page) => CROSS_START_MS + page.daysInMonth * CROSS_INTERVAL_MS + PAGE_END_PAUSE_MS
);
const totalCalendarCycleMs = calendarPageDurations.reduce((sum, duration) => sum + duration, 0);

function HeroCalendar() {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReduceMotion(media.matches);

    updatePreference();
    media.addEventListener('change', updatePreference);

    return () => media.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      setElapsedMs(0);
      return undefined;
    }

    const start = performance.now();
    let frameId = 0;

    const tick = () => {
      setElapsedMs(performance.now() - start);
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frameId);
  }, [reduceMotion]);

  const cycleTime = reduceMotion ? 0 : elapsedMs % totalCalendarCycleMs;
  let currentPageIndex = 0;
  let pageTime = cycleTime;

  if (!reduceMotion) {
    let accumulated = 0;

    for (let index = 0; index < calendarPageDurations.length; index += 1) {
      const duration = calendarPageDurations[index];

      if (cycleTime < accumulated + duration) {
        currentPageIndex = index;
        pageTime = cycleTime - accumulated;
        break;
      }

      accumulated += duration;
    }
  }

  const currentPage = calendarPages[currentPageIndex];
  const currentCalendarDays = Array.from({ length: currentPage.daysInMonth }, (_, index) =>
    String(index + 1).padStart(2, '0')
  );

  const crossedCount = reduceMotion
    ? 0
    : Math.max(
      0,
      Math.min(currentCalendarDays.length, Math.floor((pageTime - CROSS_START_MS) / CROSS_INTERVAL_MS) + 1)
    );

  const currentPageDuration = calendarPageDurations[currentPageIndex];
  let sheetOpacity = 1;
  let sheetTranslateY = 0;
  let sheetScale = 1;

  if (!reduceMotion) {
    if (pageTime < PAGE_ENTER_MS) {
      const progress = pageTime / PAGE_ENTER_MS;
      sheetOpacity = 0.35 + progress * 0.65;
      sheetTranslateY = 16 - progress * 16;
      sheetScale = 0.985 + progress * 0.015;
    } else if (pageTime > currentPageDuration - PAGE_EXIT_MS) {
      const progress = (pageTime - (currentPageDuration - PAGE_EXIT_MS)) / PAGE_EXIT_MS;
      sheetOpacity = 1 - progress * 0.7;
      sheetTranslateY = progress * 12;
      sheetScale = 1 - progress * 0.015;
    }
  }

  return (
    <div className="hero-side" aria-label="Animated calendar preview">
      <div className="calendar-scene">
        <div
          className="calendar-sheet calendar-sheet-single"
          key={currentPage.month}
          style={{
            '--sheet-opacity': sheetOpacity,
            '--sheet-translate-y': `${sheetTranslateY}px`,
            '--sheet-scale': sheetScale,
          }}
        >
          <div className="calendar-rings" aria-hidden="true">
            <span></span>
            <span></span>
          </div>

          <div className="calendar-header">
            <div>
              <p className="calendar-kicker">McGill schedule</p>
              <h2 className="calendar-month">{currentPage.month}</h2>
            </div>
            <span className="calendar-status">Open</span>
          </div>

          <div className="calendar-weekdays" aria-hidden="true">
            {calendarWeekdays.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="calendar-grid">
            {currentCalendarDays.map((day, index) => (
              <div
                className={`calendar-day${index < crossedCount ? ' calendar-day-is-crossed' : ''}`}
                key={`${currentPage.month}-${day}`}
              >
                <span>{day}</span>
              </div>
            ))}
          </div>

          <div className="calendar-note">
            <span className="calendar-note-label">Note</span>
            <div className="calendar-note-line">
              <span className="calendar-note-writing">{currentPage.note}</span>
            </div>
          </div>
        </div>

        <div className="calendar-shadow" aria-hidden="true"></div>
      </div>
    </div>
  );
}

export default HeroCalendar;
