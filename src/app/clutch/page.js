import styles from "../page.module.css";
import Navigation from "@/components/Navigation";
import EmailSub from "@/components/EmailSub";
import FinePrint from "@/components/FinePrint";
import Community from "@/components/Community";
import DirectoryTable from "@/components/DirectoryTable";

export default function Clutch() {
  return (
    <>
      <main className={styles.main}>
        <Navigation items={["email", "backlog", "caracter", "third-place"]} />
        <div className={`${styles.block} ${styles.copy}`}>
          <p className={`${styles.hero}`}>Clutch</p>
          <p>A car culture database</p>
          <div className={styles.clutch}>
            <DirectoryTable />
          </div>
        </div>
        <Community platforms={["twitter", "instagram", "warpcast"]} />
        <EmailSub />
        <FinePrint />
      </main>
    </>
  );
}
