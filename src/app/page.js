import styles from "./page.module.css";
import Navigation from "@/components/Navigation";
import EmailSub from "@/components/EmailSub";
import FinePrint from "@/components/FinePrint";
import Community from "@/components/Community";

export default function Home() {
  return (
    <>
      <main className={styles.main}>
        <Navigation />
        <div className={`${styles.block} ${styles.copy}`}>
          <p>
            We operate at the intersection of car culture and the art industry.
            In build mode now, but stay tuned for drops of well-crafted
            automotive tools, merch, art objects, and printed matter.
          </p>
        </div>
        <Community
          platforms={["twitter", "instagram", "warpcast", "zora", "vroom"]}
        />
        <EmailSub />
        <FinePrint />
      </main>
    </>
  );
}
