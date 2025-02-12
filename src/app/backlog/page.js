import styles from "../page.module.css";
import Link from "next/link";
import AG from "@/components/AG";
import EmailSub from "@/components/EmailSub";
import FinePrint from "@/components/FinePrint";
import Community from "@/components/Community";

export default function Backlog() {
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
        </nav>
        <div className={`${styles.block} ${styles.copy}`}>
          <p className={`${styles.hero}`}>
            Aluminum Grounds maintains a countinuously updated list of
            questions, ideas, datasets, and half-baked thoughts for potential
            &apos;drops.&apos; For the ideas below, we&apos;d like your help.
          </p>
          <p>
            In their current form, they&apos;re shower thoughts -- we don&apos;t
            know whether they&apos;re viable drops, but something about them
            seemed like a compelling narrative may emerge after some
            exploration. We like to build in public.
          </p>
          <div className={styles.backlog}>
            <table>
              <thead>
                <tr>
                  <th>Serial</th>
                  <th>Description</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>2024.0.001</td>
                  <td>
                    Aluminum Grounds Merch (Lighters, t-shirts,
                    etc.)
                  </td>
                  <td>Started</td>
                </tr>
                <tr>
                  <td>2025.0.001</td>
                  <td>Oil Change, Etc. (Mobile App)</td>
                  <td>In Progress</td>
                </tr>
                <tr>
                  <td>2024.0.002</td>
                  <td>Tire line called $VROOM</td>
                  <td>Idea</td>
                </tr>
                <tr>
                  <td>2024.0.003</td>
                  <td>
                    &quo;windows cranks&quo; Car roll-up window crank w/
                    skateboard wheel as a knob.
                  </td>
                  <td>Backlog</td>
                </tr>
                <tr>
                  <td>2023.0.001</td>
                  <td>tooLs for builders NFT collection</td>
                  <td>Evaluation</td>
                </tr>
                <tr>
                  <td>2024.0.006</td>
                  <td>Jack Boys/Travis Scott collab</td>
                  <td>Idea</td>
                </tr>
                <tr>
                  <td>2023.0.002</td>
                  <td>Adorable Engines NFT collection</td>
                  <td>Evaluation</td>
                </tr>
                <tr>
                  <td>2024.0.007</td>
                  <td>ASAP/Tyler the Creator/AWGE collab</td>
                  <td>Idea</td>
                </tr>
                <tr>
                  <td>2023.0.003</td>
                  <td>Astrology/Horoscope collaborations</td>
                  <td>Backlog</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <Community platforms={["twitter", "instagram", "warpcast"]} />
        <EmailSub />
        <FinePrint />
      </main>
    </>
  );
}
