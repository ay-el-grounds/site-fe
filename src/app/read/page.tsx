import EditorialIndex from "@/components/EditorialIndex";
import Community from "@/components/Community";
import EmailSub from "@/components/EmailSub";
import FinePrint from "@/components/FinePrint";
import styles from "./page.module.css";

export default function ReadPage() {
  return (
    <main className={styles.page}>
      <div className={styles.contentStack}>
        <section className={styles.sectionFull}>
          <EditorialIndex
            title="Read"
            eyebrow="Editorial"
            intro="Published writing, photo pieces, and interviews."
            showTypeLabel
            includeNavigation
          />
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
