import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Community from "@/components/Community";
import EmailSub from "@/components/EmailSub";
import FinePrint from "@/components/FinePrint";
import Navigation from "@/components/Navigation";
import prisma from "@/lib/prisma";
import {
  getEventLocation,
  getGoogleCalendarUrl,
  getGoogleMapsUrl,
} from "../event-links";
import styles from "../page.module.css";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

async function getEvent(id: string) {
  return prisma.event.findFirst({
    where: {
      id,
      status: "approved",
    },
  });
}

function serializeEvent(event: NonNullable<Awaited<ReturnType<typeof getEvent>>>) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.date.toISOString(),
    endTime: event.endTime?.toISOString() ?? null,
    venue: event.venue,
    address: event.address,
    city: event.city,
    state: event.state,
    categories: event.categories,
    ticketUrl: event.ticketUrl,
    instagramPostUrl: event.instagramPostUrl,
    sourceAccount: event.sourceAccount,
    isUserSubmitted: event.isUserSubmitted,
  };
}

function formatTimeRange(event: ReturnType<typeof serializeEvent>) {
  const start = timeFormatter.format(new Date(event.date));

  if (!event.endTime) {
    return start;
  }

  return `${start} to ${timeFormatter.format(new Date(event.endTime))}`;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) {
    return {};
  }

  return {
    title: `${event.title} — Turnout`,
    description:
      event.description ??
      `${event.title} at ${event.venue} in ${event.city}, ${event.state}.`,
  };
}

export default async function TurnoutEventPage({ params }: PageProps) {
  const { id } = await params;
  const dbEvent = await getEvent(id);

  if (!dbEvent) {
    notFound();
  }

  const event = serializeEvent(dbEvent);
  const mapsUrl = getGoogleMapsUrl(event);
  const googleCalendarUrl = getGoogleCalendarUrl(event);
  const location = getEventLocation(event);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Navigation
          items={[
            "email",
            "read",
            "backlog",
            "clutch",
            "turnout",
            "caracter",
            "third-place",
          ]}
        />

        <article className={styles.detailLayout}>
          <header className={styles.detailHero}>
            <p className={styles.eyebrow}>Turnout event</p>
            <h1>{event.title}</h1>
            <div className={styles.detailMeta}>
              <time dateTime={event.date}>
                {dateFormatter.format(new Date(event.date))}
              </time>
              <span>{formatTimeRange(event)}</span>
              <span>{event.city}, {event.state}</span>
            </div>
          </header>

          <aside className={styles.detailPanel}>
            <div>
              <p className={styles.panelLabel}>Location</p>
              <h2>{event.venue}</h2>
              <p>{location}</p>
            </div>

            <div className={styles.detailActions}>
              <a href={mapsUrl} target="_blank" rel="noreferrer">
                Take me there
              </a>
              <a href={googleCalendarUrl} target="_blank" rel="noreferrer">
                Google Calendar
              </a>
              <a href={`/turnout/${event.id}/event.ics`}>Download .ics</a>
            </div>
          </aside>

          <section className={styles.detailContent}>
            <div>
              <p className={styles.panelLabel}>Description</p>
              {event.description ? (
                <p>{event.description}</p>
              ) : (
                <p>Details are limited for this event.</p>
              )}
            </div>

            <div className={styles.categoryRow}>
              {event.categories.map((category) => (
                <span key={category}>{category}</span>
              ))}
            </div>

            <div className={styles.linkRow}>
              <Link href="/turnout">Back to Turnout</Link>
              {event.ticketUrl ? (
                <a href={event.ticketUrl} target="_blank" rel="noreferrer">
                  Tickets
                </a>
              ) : null}
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
          </section>
        </article>

        <Community
          platforms={["twitter", "instagram", "warpcast", "zora", "vroom"]}
        />
        <EmailSub />
        <FinePrint />
      </div>
    </main>
  );
}
