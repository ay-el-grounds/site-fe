"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "./page.module.css";

export type TurnoutEvent = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  endTime: string | null;
  venue: string;
  address: string | null;
  city: string;
  state: string;
  categories: string[];
  ticketUrl: string | null;
  instagramPostUrl: string | null;
  sourceAccount: string | null;
  isUserSubmitted: boolean;
};

const allValue = "all";
const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

type ViewMode = "list" | "calendar";

function getMonthKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getDayKey(value: string) {
  const date = new Date(value);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getMonthLabel(key: string) {
  const [year, monthIndex] = key.split("-").map(Number);
  return monthFormatter.format(new Date(year, monthIndex - 1, 1));
}

function getCalendarDays(monthKey: string) {
  const [year, monthIndex] = monthKey.split("-").map(Number);
  const firstDay = new Date(year, monthIndex - 1, 1);
  const daysInMonth = new Date(year, monthIndex, 0).getDate();
  const leadingDays = firstDay.getDay();
  const cells: Array<{ day: number | null; key: string }> = [];

  for (let index = 0; index < leadingDays; index += 1) {
    cells.push({ day: null, key: `empty-start-${monthKey}-${index}` });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      day,
      key: [
        year,
        String(monthIndex).padStart(2, "0"),
        String(day).padStart(2, "0"),
      ].join("-"),
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ day: null, key: `empty-end-${monthKey}-${cells.length}` });
  }

  return cells;
}

function formatTimeRange(event: TurnoutEvent) {
  const start = timeFormatter.format(new Date(event.date));

  if (!event.endTime) {
    return start;
  }

  return `${start} to ${timeFormatter.format(new Date(event.endTime))}`;
}

function getSourceLabel(event: TurnoutEvent) {
  if (event.isUserSubmitted) {
    return "Submitted";
  }

  if (event.sourceAccount) {
    return `@${event.sourceAccount}`;
  }

  return "Turnout";
}

export default function TurnoutEvents({ events }: { events: TurnoutEvent[] }) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [month, setMonth] = useState(allValue);
  const [state, setState] = useState(allValue);
  const [category, setCategory] = useState(allValue);

  const months = useMemo(() => {
    const keys = Array.from(new Set(events.map((event) => getMonthKey(event.date))));
    return keys.map((key) => {
      return {
        key,
        label: getMonthLabel(key),
      };
    });
  }, [events]);

  const states = useMemo(
    () => Array.from(new Set(events.map((event) => event.state))).sort(),
    [events]
  );

  const categories = useMemo(
    () =>
      Array.from(new Set(events.flatMap((event) => event.categories))).sort(),
    [events]
  );

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        const matchesMonth = month === allValue || getMonthKey(event.date) === month;
        const matchesState = state === allValue || event.state === state;
        const matchesCategory =
          category === allValue || event.categories.includes(category);

        return matchesMonth && matchesState && matchesCategory;
      }),
    [category, events, month, state]
  );

  const calendarMonths = useMemo(() => {
    const keys = Array.from(
      new Set(filteredEvents.map((event) => getMonthKey(event.date)))
    );

    return keys.map((key) => ({
      key,
      label: getMonthLabel(key),
      days: getCalendarDays(key),
    }));
  }, [filteredEvents]);

  const eventsByDay = useMemo(() => {
    return filteredEvents.reduce<Record<string, TurnoutEvent[]>>((acc, event) => {
      const key = getDayKey(event.date);
      acc[key] = [...(acc[key] ?? []), event];
      return acc;
    }, {});
  }, [filteredEvents]);

  return (
    <section className={styles.eventSurface}>
      <div className={styles.filters}>
        <label>
          <span>Month</span>
          <select
            aria-label="Month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          >
            <option value={allValue}>All months</option>
            {months.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>State</span>
          <select
            aria-label="State"
            value={state}
            onChange={(event) => setState(event.target.value)}
          >
            <option value={allValue}>All states</option>
            {states.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Category</span>
          <select
            aria-label="Category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value={allValue}>All categories</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.resultBar}>
        <p>{filteredEvents.length} events</p>
        <div className={styles.viewToggle} aria-label="Event view">
          <button
            aria-pressed={viewMode === "list"}
            type="button"
            onClick={() => setViewMode("list")}
          >
            List
          </button>
          <button
            aria-pressed={viewMode === "calendar"}
            type="button"
            onClick={() => setViewMode("calendar")}
          >
            Calendar
          </button>
        </div>
      </div>

      {filteredEvents.length > 0 && viewMode === "list" ? (
        <div className={styles.eventGrid}>
          {filteredEvents.map((event) => (
            <article className={styles.eventCard} key={event.id}>
              <div className={styles.dateBlock}>
                <span>{dateFormatter.format(new Date(event.date))}</span>
                <strong>{formatTimeRange(event)}</strong>
              </div>

              <div className={styles.eventBody}>
                <div className={styles.metaRow}>
                  <span>{event.city}, {event.state}</span>
                  <span>{getSourceLabel(event)}</span>
                </div>

                <h2>
                  <Link href={`/turnout/${event.id}`}>{event.title}</Link>
                </h2>
                <p className={styles.venue}>{event.venue}</p>

                {event.description ? (
                  <p className={styles.description}>{event.description}</p>
                ) : null}

                <div className={styles.categoryRow}>
                  {event.categories.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>

                <div className={styles.linkRow}>
                  {event.ticketUrl ? (
                    <a href={event.ticketUrl} target="_blank" rel="noreferrer">
                      Tickets
                    </a>
                  ) : null}
                  <Link href={`/turnout/${event.id}`}>Details</Link>
                  {event.instagramPostUrl ? (
                    <a
                      href={event.instagramPostUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Source
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {filteredEvents.length > 0 && viewMode === "calendar" ? (
        <div className={styles.calendarStack}>
          {calendarMonths.map((calendarMonth) => (
            <section className={styles.calendarMonth} key={calendarMonth.key}>
              <div className={styles.calendarHeader}>
                <h2>{calendarMonth.label}</h2>
              </div>
              <div className={styles.calendarViewport}>
                <div className={styles.calendarGrid}>
                  {weekDays.map((day) => (
                    <div className={styles.weekday} key={day}>
                      {day}
                    </div>
                  ))}
                  {calendarMonth.days.map((day) => {
                    const dayEvents = day.day ? eventsByDay[day.key] ?? [] : [];

                    return (
                      <div
                        className={`${styles.calendarDay} ${
                          day.day ? "" : styles.calendarDayMuted
                        } ${dayEvents.length > 0 ? styles.calendarDayActive : ""}`}
                        key={day.key}
                      >
                        {day.day ? <span className={styles.dayNumber}>{day.day}</span> : null}
                        <div className={styles.calendarEvents}>
                          {dayEvents.slice(0, 3).map((event) => {
                            const calendarEvent = (
                              <>
                                <span>{timeFormatter.format(new Date(event.date))}</span>
                                {event.title}
                              </>
                            );

                            return (
                              <Link href={`/turnout/${event.id}`} key={event.id}>
                                {calendarEvent}
                              </Link>
                            );
                          })}
                          {dayEvents.length > 3 ? (
                            <span className={styles.moreEvents}>
                              +{dayEvents.length - 3} more
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          ))}
        </div>
      ) : (
        filteredEvents.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No events match the current filters.</p>
        </div>
        ) : null
      )}
    </section>
  );
}
