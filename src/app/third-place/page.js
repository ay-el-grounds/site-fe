import Navigation from "@/components/Navigation";
import FinePrint from "@/components/FinePrint";
import ThirdPlaceActions from "./ThirdPlaceActions";
import { thirdPlaceContent } from "./content";
import styles from "./page.module.css";

export const metadata = {
  title: "Third Place",
  description:
    "Friends and family investor overview for the Third Place coffee truck.",
  openGraph: {
    title: "Third Place | $20K Friends & Family Round",
    description:
      "A mobile specialty coffee truck designed for community, events, and fast path-to-revenue operations.",
    images: [
      {
        url: "/third-place/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Third Place investor overview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Third Place | $20K Friends & Family Round",
    description:
      "A mobile specialty coffee truck designed for community, events, and fast path-to-revenue operations.",
    images: ["/third-place/opengraph-image"],
  },
};

const normalizeLanguage = (lang) => (lang === "es" ? "es" : "en");

function renderParagraphWithEmphasis(text, emphasis = []) {
  if (!emphasis.length) {
    return text;
  }

  const matches = emphasis.filter((item) => text.includes(item));

  if (!matches.length) {
    return text;
  }

  const sortedMatches = [...matches].sort((a, b) => b.length - a.length);
  const pattern = new RegExp(
    `(${sortedMatches.map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "g"
  );

  return text.split(pattern).map((part, index) =>
    sortedMatches.includes(part) ? <strong key={`${part}-${index}`}>{part}</strong> : part
  );
}

export default async function ThirdPlacePage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const lang = normalizeLanguage(resolvedSearchParams?.lang);
  const content = thirdPlaceContent[lang];

  return (
    <main className={styles.page}>
      <div className={styles.noPrint}>
        <Navigation items={["email", "read", "backlog", "clutch", "caracter"]} />
      </div>

      <ThirdPlaceActions
        currentLang={lang}
        toggleLabel={content.controls.toggle}
        downloadLabel={content.controls.download}
      />

      <div className={styles.printSurface}>
        <section className={styles.hero}>
          <div className={styles.heroIntro}>
            <p className={styles.kicker}>{content.hero.kicker}</p>
            <h1>{content.hero.title}</h1>
            <p className={styles.subtitle}>{content.hero.subtitle}</p>
            <p>{content.hero.body}</p>
          </div>
          <div className={styles.raiseCard}>
            <p className={styles.raiseLabel}>{content.hero.raiseLabel}</p>
            <p className={styles.raiseAmount}>{content.hero.raiseAmount}</p>
            <p className={styles.raiseSub}>{content.hero.raiseSub}</p>
          </div>
        </section>

        <section className={styles.storyGrid}>
          <article className={styles.panel}>
            <p className={styles.sectionLabel}>{content.concept.label}</p>
            <h2>{content.concept.title}</h2>
            {content.concept.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </article>

          <article className={`${styles.panel} ${styles.panelAccent}`}>
            <p className={styles.sectionLabel}>{content.opportunity.label}</p>
            <h2>{content.opportunity.title}</h2>
            {content.opportunity.paragraphs.map((paragraph) => (
              <p key={paragraph}>
                {renderParagraphWithEmphasis(
                  paragraph,
                  content.opportunity.emphasis
                )}
              </p>
            ))}
          </article>
        </section>

        <section className={styles.stats}>
          {content.stats.map((stat) => (
            <div className={styles.statCard} key={stat.label}>
              <p className={styles.statValue}>{stat.value}</p>
              <p className={styles.statLabel}>{stat.label}</p>
            </div>
          ))}
        </section>

        <section className={styles.dealBox}>
          <div className={styles.dealHeading}>
            <p className={styles.sectionLabel}>{content.investment.label}</p>
            <h2>{content.investment.title}</h2>
          </div>
          <div className={styles.dealGrid}>
            {content.investment.terms.map((term) => (
              <div key={term.label} className={styles.dealItem}>
                <p className={styles.dealValue}>{term.value}</p>
                <p className={styles.dealLabel}>{term.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.fundsSection}>
          <div className={styles.sectionHeading}>
            <p className={styles.sectionLabel}>{content.funds.label}</p>
            <h2>{content.funds.title}</h2>
          </div>
          <div className={styles.fundsGrid}>
            {content.funds.items.map((fund) => (
              <article className={styles.fundCard} key={fund.label}>
                <p className={styles.fundAmount}>{fund.amount}</p>
                <p className={styles.fundLabel}>{fund.label}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.storyGrid}>
          <article className={styles.panel}>
            <p className={styles.sectionLabel}>{content.traction.label}</p>
            <h2>{content.traction.title}</h2>
            {content.traction.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </article>
        </section>

        <section className={styles.storyGrid}>
          <article className={styles.panel}>
            <p className={styles.sectionLabel}>{content.models.label}</p>
            <h2>{content.models.title}</h2>
            {content.models.paragraphs.map((paragraph) => (
              <p key={paragraph}>
                {renderParagraphWithEmphasis(paragraph, content.models.emphasis)}
              </p>
            ))}
          </article>

          <article className={`${styles.panel} ${styles.panelAccent}`}>
            <p className={styles.sectionLabel}>{content.approach.label}</p>
            <h2>{content.approach.title}</h2>
            {content.approach.paragraphs.map((paragraph) => (
              <p key={paragraph}>
                {renderParagraphWithEmphasis(
                  paragraph,
                  content.approach.emphasis
                )}
              </p>
            ))}
          </article>
        </section>

        <section className={styles.roadmapSection}>
          <div className={styles.sectionHeading}>
            <p className={styles.sectionLabel}>{content.roadmap.label}</p>
            <h2>{content.roadmap.title}</h2>
          </div>
          <div className={styles.roadmap}>
            {content.roadmap.items.map((item) => (
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
            <p className={styles.sectionLabel}>{content.returns.label}</p>
            <h2>{content.returns.title}</h2>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {content.returns.headers.map((header) => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {content.returns.rows.map((row) => (
                  <tr key={`${row.tier}-${row.investment}`}>
                    <td>{row.tier}</td>
                    <td>{row.investment}</td>
                    <td>{row.return}</td>
                    <td>{row.multiplier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className={styles.tableNote}>{content.returns.note}</p>
        </section>

        <section className={styles.footerCard}>
          <div>
            <p className={styles.sectionLabel}>{content.footer.label}</p>
            <p className={styles.contactName}>{content.footer.name}</p>
            <p>{content.footer.location}</p>
            <p className={styles.footerInvitation}>{content.footer.invitation}</p>
          </div>
          <div className={styles.footerNote}>
            <p>{content.footer.disclaimer}</p>
          </div>
        </section>
      </div>

      <div className={styles.noPrint}>
        <FinePrint />
      </div>
    </main>
  );
}
