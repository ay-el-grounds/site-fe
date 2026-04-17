import EditorialIndex from "@/components/EditorialIndex";
import Community from "@/components/Community";
import EmailSub from "@/components/EmailSub";
import FinePrint from "@/components/FinePrint";
import Navigation from "@/components/Navigation";
import styles from "@/app/(editorial)/section-page.module.css";

export default function InterviewsIndexPage() {
  return (
    <main className={styles.page}>
      <div className={styles.contentStack}>
        <section className={`${styles.section} ${styles.navSection}`}>
          <Navigation />
        </section>

        <section className={styles.sectionFull}>
          <EditorialIndex type="interviews" includeNavigation={false} />
        </section>

        <section className={styles.section}>
          <Community
            platforms={["twitter", "instagram", "warpcast", "zora", "vroom"]}
          />
        </section>

        <section className={styles.section}>
          <EmailSub />
        </section>

        <section className={styles.section}>
          <FinePrint />
        </section>
      </div>
    </main>
  );
}
