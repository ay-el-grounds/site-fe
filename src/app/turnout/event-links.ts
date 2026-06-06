import type { TurnoutEvent } from "./TurnoutEvents";

const defaultEventDurationMs = 2 * 60 * 60 * 1000;

function compactDate(value: Date) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\r?\n/g, "\\n");
}

function getEndDate(event: Pick<TurnoutEvent, "date" | "endTime">) {
  if (event.endTime) {
    return new Date(event.endTime);
  }

  return new Date(new Date(event.date).getTime() + defaultEventDurationMs);
}

export function getEventLocation(
  event: Pick<TurnoutEvent, "venue" | "address" | "city" | "state">
) {
  return [event.venue, event.address, `${event.city}, ${event.state}`]
    .filter(Boolean)
    .join(", ");
}

export function getGoogleMapsUrl(
  event: Pick<TurnoutEvent, "venue" | "address" | "city" | "state">
) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    getEventLocation(event)
  )}`;
}

export function getGoogleCalendarUrl(
  event: Pick<
    TurnoutEvent,
    | "title"
    | "description"
    | "date"
    | "endTime"
    | "venue"
    | "address"
    | "city"
    | "state"
  >
) {
  const start = compactDate(new Date(event.date));
  const end = compactDate(getEndDate(event));
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${start}/${end}`,
    location: getEventLocation(event),
  });

  if (event.description) {
    params.set("details", event.description);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function getIcsContent(
  event: Pick<
    TurnoutEvent,
    | "id"
    | "title"
    | "description"
    | "date"
    | "endTime"
    | "venue"
    | "address"
    | "city"
    | "state"
    | "ticketUrl"
    | "instagramPostUrl"
  >,
  siteUrl: string
) {
  const start = compactDate(new Date(event.date));
  const end = compactDate(getEndDate(event));
  const details = [
    event.description,
    event.ticketUrl ? `Tickets: ${event.ticketUrl}` : null,
    event.instagramPostUrl ? `Source: ${event.instagramPostUrl}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Aluminum Grounds//Turnout//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@aluminumgrounds.com`,
    `DTSTAMP:${compactDate(new Date())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `LOCATION:${escapeIcsText(getEventLocation(event))}`,
    details ? `DESCRIPTION:${escapeIcsText(details)}` : null,
    `URL:${siteUrl}/turnout/${event.id}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}
