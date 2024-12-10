import Image from "next/image";
import styles from "./page.module.css";
import Link from "next/link";
import AG from "@/components/AG";
import EmailSub from "@/components/EmailSub";
import FinePrint from "@/components/FinePrint";
import Community from "@/components/Community";

export default function Home() {
  return (
    <>
      <main className={styles.main}>
        <nav className={styles.header}>
          <div className={styles.logoAG}>
            <AG fill={"red"} />
          </div>
          {/* <div className={styles.filterContainer}>
          <div className={styles.filterOption}>All</div>
          <div className={styles.filterOption}>Community</div>
          <div className={styles.filterOption}>Drops</div>
        </div> */}
          <div className={styles.navBar}>
            <div className={styles.collabContainer}>
              <a href="mailto:aluminumgrounds@gmail.com" target="_blank">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="100%"
                  height="100%"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="currentColor"
                    d="M1 18V2h20v7h-2V6l-8 5l-8-5v10h10v2H1Zm10-9l8-5H3l8 5Zm8 13q-1.65 0-2.825-1.175T15 18v-4.5q0-1.05.725-1.775T17.5 11q1.05 0 1.775.725T20 13.5V18h-2v-4.5q0-.2-.15-.35T17.5 13q-.2 0-.35.15t-.15.35V18q0 .825.588 1.413T19 20q.825 0 1.413-.588T21 18v-4h2v4q0 1.65-1.175 2.825T19 22ZM3 4v12V4Z"
                  />
                </svg>
              </a>
            </div>
            <div className={styles.collabContainer}>
              <Link href="/backlog">
                <Image src="/SVG/backlog-icon.svg" width={15} height={15} />
              </Link>
            </div>
          </div>
        </nav>
        <div className={`${styles.block} ${styles.copy}`}>
          <p>
            We operate at the intersection of car culture and the art industry.
            In build mode now, but stay tuned for drops of well-crafted
            automotive tools, merch, art objects, and printed matter.
          </p>
        </div>
        <Community platforms={['twitter', 'instagram', 'warpcast', 'zora', 'vroom']} />
        <EmailSub />
        <FinePrint />
      </main>
    </>
  );
}
