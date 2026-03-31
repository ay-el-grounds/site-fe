import styles from "../page.module.css";
import Navigation from "@/components/Navigation";
import EmailSub from "@/components/EmailSub";
import FinePrint from "@/components/FinePrint";
import Community from "@/components/Community";

export default function Backlog() {
  return (
    <>
      <main className={styles.main}>
        <Navigation items={["email", "clutch", "caracter", "third-place"]} />
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
                  <td>Aluminum Grounds Merch (Lighters, t-shirts, etc.)</td>
                  <td>Started</td>
                </tr>
                <tr>
                  <td>2022.0.001</td>
                  <td>Third Place (Coffee Stand)</td>
                  <td>In Progress</td>
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
                    &quot;windows cranks&quot; Car roll-up window crank w/
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
                  <td>Dream</td>
                </tr>
                <tr>
                  <td>2023.0.002</td>
                  <td>Adorable Engines NFT collection</td>
                  <td>Evaluation</td>
                </tr>
                <tr>
                  <td>2024.0.007</td>
                  <td>ASAP/Tyler the Creator/AWGE collab</td>
                  <td>Dream</td>
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
