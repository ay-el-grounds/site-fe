import Community from "@/components/Community";
import EmailSub from "@/components/EmailSub";
import FinePrint from "@/components/FinePrint";
import Navigation from "@/components/Navigation";
import prisma from "@/lib/prisma";
import TurnoutEvents, { TurnoutEvent } from "./TurnoutEvents";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Turnout",
  description:
    "A Northeast car culture event calendar maintained by Aluminum Grounds.",
};

function serializeEvent(event: Awaited<ReturnType<typeof getEvents>>[number]): TurnoutEvent {
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

async function getEvents() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return prisma.event.findMany({
    where: {
      status: "approved",
      date: {
        gte: today,
      },
    },
    orderBy: [{ date: "asc" }, { title: "asc" }],
  });
}

export default async function TurnoutPage() {
  const events = (await getEvents()).map(serializeEvent);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <Navigation
          items={[
            "email",
            "read",
            "backlog",
            "clutch",
            "caracter",
            "third-place",
          ]}
        />

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Calendar</p>
            <h1>Turnout</h1>
            <p>
              A car culture event calendar for meets, concours weekends, track
              days, and coffee runs across the Northeast.
            </p>
          </div>
          <div className={styles.heroStat}>
            <p className={styles.statValue}>{events.length}</p>
            <p className={styles.statLabel}>Upcoming events</p>
          </div>
        </section>

        <TurnoutEvents events={events} />

        <Community
          platforms={["twitter", "instagram", "warpcast", "zora", "vroom"]}
        />
        <EmailSub />
        <FinePrint />
      </div>
    </main>
  );
}
