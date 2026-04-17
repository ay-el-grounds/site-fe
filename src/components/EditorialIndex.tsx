import Link from "next/link";
import Navigation from "@/components/Navigation";
import {
  EditorialEntry,
  EditorialSection,
  getEditorialIndex,
} from "@/lib/mdx";
import styles from "@/app/(editorial)/editorial.module.css";

const sectionLabels: Record<EditorialSection, string> = {
  essays: "Essays",
  interviews: "Interviews",
  photo: "Photo",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

const typeLabels: Record<EditorialEntry["type"], string> = {
  essay: "Essay",
  interview: "Interview",
  photo: "Photo",
};

type EditorialIndexProps = {
  type?: EditorialSection;
  title?: string;
  eyebrow?: string;
  intro?: string;
  showTypeLabel?: boolean;
  includeNavigation?: boolean;
};

export default function EditorialIndex({
  type,
  title,
  eyebrow,
  intro,
  showTypeLabel = false,
  includeNavigation = true,
}: EditorialIndexProps) {
  const entries = getEditorialIndex(type);
  const label = type ? sectionLabels[type] : "Read";
  const heading = title || label;
  const kicker = eyebrow || label;
  const [featuredEntry, ...remainingEntries] =
    showTypeLabel && entries.length > 0 ? entries : [];
  const description =
    intro ||
    (type
      ? "Editorial pieces from Aluminum Grounds."
      : "A unified reading surface for published photo pieces, essays, and interviews.");

  return (
    <div className={styles.shell}>
      <section className={styles.indexWrap}>
        {includeNavigation ? <Navigation /> : null}

        <section className={styles.bentoHero}>
          <header className={`${styles.heroCard} ${styles.copyCard}`}>
            <p className={styles.eyebrow}>{kicker}</p>
            <h1 className={styles.indexTitle}>{heading}</h1>
            <p className={styles.indexIntro}>{description}</p>
          </header>

          {featuredEntry ? (
            <article className={`${styles.featureCard} ${styles.editorialCard}`}>
              <div className={styles.indexMetaRow}>
                <span>{formatDate(featuredEntry.publishedAt)}</span>
                <span className={styles.typePill}>
                  {typeLabels[featuredEntry.type].toUpperCase()}
                </span>
              </div>
              <h2 className={styles.featureCardTitle}>
                <Link href={featuredEntry.url}>{featuredEntry.title}</Link>
              </h2>
              <p className={styles.featureCardDescription}>
                {featuredEntry.description ||
                  featuredEntry.excerpt ||
                  "Untitled editorial entry."}
              </p>
            </article>
          ) : null}
        </section>

        <div className={styles.bentoGrid}>
          {(featuredEntry ? remainingEntries : entries).map((entry) => (
            <article key={entry.url} className={`${styles.indexCard} ${styles.editorialCard}`}>
              <div className={styles.indexMetaRow}>
                <span>{formatDate(entry.publishedAt)}</span>
                {showTypeLabel ? (
                  <span className={styles.typePill}>
                    {typeLabels[entry.type].toUpperCase()}
                  </span>
                ) : null}
              </div>
              <h2 className={styles.indexCardTitle}>
                <Link href={entry.url}>{entry.title}</Link>
              </h2>
              <p className={styles.indexCardDescription}>
                {entry.description || entry.excerpt || "Untitled editorial entry."}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
