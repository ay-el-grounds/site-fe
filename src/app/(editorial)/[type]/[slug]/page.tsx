import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "@/app/(editorial)/editorial.module.css";
import pageStyles from "@/app/(editorial)/section-page.module.css";
import {
  EditorialSection,
  getEditorialEntry,
  getEditorialIndex,
  getEditorialModule,
  isEditorialType,
} from "@/lib/mdx";
import Community from "@/components/Community";
import EmailSub from "@/components/EmailSub";
import FinePrint from "@/components/FinePrint";
import Navigation from "@/components/Navigation";
import ShareArticleActions from "@/components/ShareArticleActions";

type PageProps = {
  params: Promise<{
    type: string;
    slug: string;
  }>;
};

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

export function generateStaticParams() {
  return getEditorialIndex().map((entry) => ({
    type: entry.section,
    slug: entry.slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { type, slug } = await params;
  const entry = getEditorialEntry(type, slug, {
    includeDrafts: process.env.NODE_ENV !== "production",
  });

  if (!entry) {
    return {};
  }

  return {
    title: entry.title,
    description: entry.description || entry.excerpt,
    other: {
      "article:published_time": entry.publishedAt,
    },
    openGraph: {
      title: entry.title,
      description: entry.description || entry.excerpt,
      type: "article",
      publishedTime: entry.publishedAt,
      url: entry.url,
    },
  };
}

export default async function EditorialEntryPage({ params }: PageProps) {
  const { type, slug } = await params;

  if (!isEditorialType(type)) {
    notFound();
  }

  const entry = getEditorialEntry(type, slug, {
    includeDrafts: process.env.NODE_ENV !== "production",
  });

  if (!entry) {
    notFound();
  }

  const mdxModule = await getEditorialModule(type, slug);

  if (!mdxModule) {
    notFound();
  }

  const Content = mdxModule.default;

  return (
    <main className={pageStyles.page}>
      <div className={pageStyles.contentStack}>
        <section className={`${pageStyles.section} ${pageStyles.navSection}`}>
          <Navigation />
        </section>

        <section className={pageStyles.sectionFull}>
          <div className={styles.shell}>
            <article className={styles.entry}>
              <header className={styles.entryHeader}>
                {process.env.NODE_ENV !== "production" && entry.status !== "published" ? (
                  <p className={styles.draftBadge}>Draft</p>
                ) : null}
                <p className={styles.eyebrow}>{sectionLabels[type]}</p>
                <h1 className={styles.entryTitle}>{entry.title}</h1>
                {entry.description ? (
                  <p className={styles.entryDek}>{entry.description}</p>
                ) : null}
                <div className={styles.entryMeta}>
                  <Link href={`/${entry.section}`} className={styles.entryMetaLink}>
                    Back to {sectionLabels[type]}
                  </Link>
                  <span className={styles.dot}>•</span>
                  <time dateTime={entry.publishedAt}>{formatDate(entry.publishedAt)}</time>
                </div>
              </header>

              <div className={styles.prose}>
                <Content />
              </div>

              <ShareArticleActions title={entry.title} />
            </article>
          </div>
        </section>

        <section className={pageStyles.section}>
          <Community
            platforms={["twitter", "instagram", "warpcast", "zora", "vroom"]}
          />
        </section>

        <section className={pageStyles.section}>
          <EmailSub />
        </section>

        <section className={pageStyles.section}>
          <FinePrint />
        </section>
      </div>
    </main>
  );
}
