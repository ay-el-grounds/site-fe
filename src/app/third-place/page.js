import Navigation from "@/components/Navigation";
import FinePrint from "@/components/FinePrint";
import styles from "./page.module.css";

export const metadata = {
  title: "Third Place",
  description:
    "Friends and family investor overview for the Third Place coffee truck.",
};

const stats = [
  { value: "$244k", label: "Projected Year 2 revenue" },
  { value: "75%", label: "Target gross margin at scale" },
  { value: "$81k", label: "Projected Year 2 net profit" },
  { value: "70/day", label: "Drinks needed per operating day (5–6 days/week)" },
];

const dealTerms = [
  {
    value: "1.35x",
    label:
      "Structured return via promissory note targeting a 35% total return.",
  },
  {
    value: "18 mo.",
    label:
      "Target repayment window, beginning in month 3, paid from operating revenue.",
  },
  {
    value: "$1k min.",
    label:
      "$5k+ qualifies for a 1.4x founding investor return. Round capped at $20k.",
  },
];

const funds = [
  {
    amount: "$17,000",
    label: "Truck secured (fully equipped, ready-to-operate unit).",
  },
  {
    amount: "$3,000",
    label:
      "Inventory loaded (coffee, matcha, chai, supplies) + initial operating buffer.",
  },
];

const roadmap = [
  {
    step: "01",
    title: "Raise closes",
    detail: "Truck is secured immediately after funds are collected.",
  },
  {
    step: "02",
    title: "Setup",
    detail: "Permits, certifications, and final brand prep completed quickly.",
  },
  {
    step: "03",
    title: "Launch",
    detail: "First events booked and operating within weeks.",
  },
  {
    step: "04",
    title: "Revenue + repayment",
    detail: "Revenue begins immediately. Repayment starts by month 3.",
  },
];

export default function ThirdPlacePage() {
  return (
    <main className={styles.page}>
      <Navigation items={["email", "backlog", "clutch", "character"]} />

      <section className={styles.hero}>
        <div className={styles.heroIntro}>
          <p className={styles.kicker}>Friends and Family Round</p>
          <h1>Third Place</h1>
          <p className={styles.subtitle}>Not a café. A moving third place.</p>
          <p>
            A coffee truck designed to plug directly into car meets, street
            corners, and community events — wherever people already gather.
          </p>
        </div>
        <div className={styles.raiseCard}>
          <p className={styles.raiseLabel}>Currently raising</p>
          <p className={styles.raiseAmount}>$20,000</p>
          <p className={styles.raiseSub}>
            Small, private round to get from zero to fully operating.
          </p>
        </div>
      </section>

      <section className={styles.storyGrid}>
        <article className={styles.panel}>
          <p className={styles.sectionLabel}>The Concept</p>
          <h2>The third place, brought to you.</h2>
          <p>
            Coffee shops have always been where people gather. Third Place takes
            that idea and makes it mobile.
          </p>
          <p>
            Instead of waiting for foot traffic, the truck shows up where
            attention already exists — markets, car events, neighborhoods, and
            private gatherings.
          </p>
          <p>
            The unit is fully equipped and ready to operate. This raise gets it
            on the road and into revenue immediately.
          </p>
        </article>

        <article className={`${styles.panel} ${styles.panelAccent}`}>
          <p className={styles.sectionLabel}>The Opportunity</p>
          <h2>Built on existing communities, not guesswork.</h2>
          <p>
            This isn’t dependent on random foot traffic. It’s designed around
            recurring events, built-in audiences, and repeatable locations.
          </p>
          <p>
            This isn’t event-dependent. The truck is designed to operate
            <strong> 5–6 days per week</strong> — events when booked, and
            otherwise stationed in high-traffic areas like neighborhood streets
            and business locations.
          </p>
          <p>
            Mobile units operate with lower overhead while unlocking multiple
            revenue streams: events, private bookings, and consistent daily
            service.
          </p>
          <p>
            Break even sits at roughly <strong>70 drinks per day</strong>, a
            realistic target for a focused, quality-first operation.
          </p>
        </article>
      </section>

      <section className={styles.stats}>
        {stats.map((stat) => (
          <div className={styles.statCard} key={stat.label}>
            <p className={styles.statValue}>{stat.value}</p>
            <p className={styles.statLabel}>{stat.label}</p>
          </div>
        ))}
      </section>

      <section className={styles.dealBox}>
        <div className={styles.dealHeading}>
          <p className={styles.sectionLabel}>Your Investment</p>
          <h2>Simple terms, fast turnaround.</h2>
        </div>
        <div className={styles.dealGrid}>
          {dealTerms.map((term) => (
            <div key={term.label} className={styles.dealItem}>
              <p className={styles.dealValue}>{term.value}</p>
              <p className={styles.dealLabel}>{term.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.fundsSection}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionLabel}>Use of Funds</p>
          <h2>How the first $20k gets deployed.</h2>
        </div>
        <div className={styles.fundsGrid}>
          {funds.map((fund) => (
            <article className={styles.fundCard} key={fund.label}>
              <p className={styles.fundAmount}>{fund.amount}</p>
              <p className={styles.fundLabel}>{fund.label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.storyGrid}>
        <article className={styles.panel}>
          <p className={styles.sectionLabel}>Why this works</p>
          <h2>Not starting from zero.</h2>
          <p>
            Built by someone already operating across events, media, and
            community-driven projects.
          </p>
          <p>
            This plugs into existing networks — automotive culture, creative
            communities, and live experiences — instead of relying on cold
            discovery.
          </p>
          <p>
            The same systems used for content and production translate directly
            into distribution and demand.
          </p>
        </article>
      </section>

      <section className={styles.roadmapSection}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionLabel}>The Plan</p>
          <h2>Fast path to revenue.</h2>
        </div>
        <div className={styles.roadmap}>
          {roadmap.map((item) => (
            <article className={styles.roadmapItem} key={item.step}>
              <div className={styles.roadmapStep}>{item.step}</div>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.dealBox}>
        <div className={styles.dealHeading}>
          <p className={styles.sectionLabel}>What you actually get back</p>
          <h2>How returns actually play out.</h2>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tier</th>
                <th>Investment</th>
                <th>Return</th>
                <th>Multiplier</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Founding</td>
                <td>$5,000+</td>
                <td>$7,000 on $5k</td>
                <td>1.4x</td>
              </tr>
              <tr>
                <td>Supporter</td>
                <td>$2,000–$4,999</td>
                <td>$3,375 on $2.5k</td>
                <td>1.35x</td>
              </tr>
              <tr>
                <td>Backer</td>
                <td>$1,000–$1,999</td>
                <td>$1,250 on $1k</td>
                <td>1.25x</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className={styles.tableNote}>
          Example: A $2,500 investment returns $3,375 over ~18–20 months
          (~20–22% annualized), paid monthly from operating revenue.
        </p>
      </section>

      <section className={styles.footerCard}>
        <div>
          <p className={styles.sectionLabel}>Contact</p>
          <p className={styles.contactName}>Brian Felix</p>
          <p>Third Place Coffee Truck · Brooklyn, NY</p>
          <p style={{ marginTop: "10px" }}>
            Closing this round with a small group. Reach out if you want in or
            want to talk it through.
          </p>
        </div>
        <div className={styles.footerNote}>
          <p>
            This document is for informational purposes only and constitutes a
            private offering to known individuals. It is not a public
            solicitation.
          </p>
        </div>
      </section>

      <FinePrint />
    </main>
  );
}
