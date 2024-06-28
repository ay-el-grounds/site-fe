import Image from "next/image";
import styles from "../../page.module.css";
import EmailSub from "@/components/EmailSub";
import HoverBuy from "@/components/HoverBuy";
import VROOM from "@/components/VROOM";
import FinePrint from "@/components/FinePrint";

export const metadata = {
  title: "$VROOM contributions",
  description:
    "$VROOM is a memecoin launched by Aluminum Grounds that demonstrates... This is not financial advice, always do your own research.",
};

export default function VroomContribution() {
  return (
    <main className={styles.main}>
      <nav className={styles.header}>
        <div className={styles.logoVROOM}>
          <VROOM />
        </div>
        <a
          href="/
          "
        >
          <div className={styles.homeButton}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
              height="100%"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M19 20h-2v-9H7v9H5V9l7-4l7 4v11M8 12h8v2H8v-2m0 3h8v2H8v-2m8 3v2H8v-2h8Z"
              />
            </svg>
          </div>
        </a>
      </nav>
      <HoverBuy />
      <div className={styles.headingBlock}>
        <h2>Contribute</h2>
      </div>
      <div className={styles.descriptionBlock}>
        <p>
          This guide outlines how to live and breathe{" "}
          <span className={styles.vroom}>$VROOM</span>.
        </p>
      </div>
      <div className={styles.communityGrid}>
        <div className={styles.genContainer}>
          <div>
            <a href="">
            Emblem<br>
              </br>(soon)
            </a>
          </div>
        </div>
        <div className={styles.genContainer}>
          <div>
            <a href="">
            Imagery<br>
              </br>(soon)
            </a>
          </div>
        </div>
        <div className={styles.genContainer}>
          <div>
            <a href="">
              Typography<br>
              </br>(soon)
            </a>
          </div>
        </div>
      </div>
      <div className={styles.headingBlock}>
        <h2>$VROOM Tenets</h2>
      </div>
      <div className={styles.descriptionBlock}>
        <h3>Be Authentic</h3>
        <p>
          <span className={styles.vroom}>$VROOM</span> thrives on genuine
          passion for automotive excellence. Let this authenticity fuel your
          contributions.
        </p>

        <h3>Stick to Protocols</h3>
        <p>
          Think of these standards as your race regulations. Adhere to them
          meticulously to stay on track.
        </p>
        <h3>Innovate Always</h3>
        <p>
          <span className={styles.vroom}>$VROOM</span> is about pushing the
          limits. Burn rubber and reflect this in every aspect of your
          contribution.
        </p>
        <h3>Detail Obsession</h3>
        <p>
          Precision wins races. From visuals to messaging, ensure everything
          aligns with the <span className={styles.vroom}>$VROOM</span> brand.
        </p>
        <h3>Collaborate Hard</h3>
        <p>
          Racing is a team sport. Work with others who share the{" "}
          <span className={styles.vroom}>$VROOM</span> vision to draft ahead and
          achieve more together.
        </p>
      </div>
      <div className={styles.headingBlock}>
        <h2>Joining the Inner Donut</h2>
      </div>
      <div className={styles.mediaBlock}>
        <div className={styles.diagrams}>
          <img src="/race-track.png"></img>
        </div>
        <div className={styles.caption}>
          Fig 1. Guide for acquiring a Race Bib
        </div>
        <div className={styles.paragraph}>
          <ol>
            <li>
              Utilize $VROOM brand assets to contribute to the meme economy
              while adhereing to our guidelines.
            </li>
            <li>Share your creations through our Race Bib Form.</li>
            <li>
              Selected works will be featured across our social channels,
              amplifying your reach within the $VROOM community. If your
              creation is selected for minting, you&apos;ll be invited to ...
            </li>
            <li>
              Contributors with a Race Bib NFT become esteemed members of the
              $VROOM Inner Donut. As a member, you&apos;ll share in our token
              rewards, including access to a 250M $VROOM pool.
            </li>
            <li>
              Racing is a team sport. Work with others who share the vision to
              draft ahead.
            </li>
          </ol>
          <p>
            As our memes gain traction among fans and spectators alike, this
            refueling process becomes more frequent and impactful, driving us
            forward with every lap.
          </p>
        </div>
      </div>
      <div className={styles.headingBlock}>
        <h2>$VROOM on the Assembly Line</h2>
      </div>
      <div className={styles.descriptionBlock}>
        <p>
          As the world embraces electric vehicles, <span className={styles.vroom}>$VROOM</span> captures and
          immortalizes the beautiful sounds in a deeply abstracted way on a
          digital medium.
        </p>
        <p>
        <span className={styles.vroom}>$VROOM</span> dropped on June 25th. In a month packed with automotive history
          (and also PRIDE). <span className={styles.vroom}>$VROOM</span> celebrates milestones like the first auto
          race, the premiere of The Fast and the Furious franchise, the release
          of{" "}
          <a href="https://www.imdb.com/title/tt0187078/" target="_blank">
            Gone in Sixty Seconds
          </a>
          , and{" "}
          <a href="https://www.imdb.com/title/tt0187078/" target="_blank">
          Cars</a> (the Pixar film) — so as it turns out, cars are gay.
        </p>
        <p>
          In our universe, <span className={styles.vroom}>$VROOM</span> transcends mere tokenization—it’s a cultural
          statement. It playfully critiques traditional industries while
          fostering a community-driven approach to redefining automotive
          engagement in the digital age.
        </p>
      </div>
      <div className={styles.communityGrid}>
        <div className={styles.uniswapContainer}>
          <div>
            <a
              href=""
              target="_blank
          "
            >
              <Image src="/SVG/uniswap-logo.svg" width={40} height={40}></Image>
            </a>
          </div>
        </div>
        <div className={styles.warpContainer}>
          <p>
            <a
              href="https://warpcast.com/~/channel/cars"
              target="_blank
          "
            >
              /cars
            </a>
          </p>
        </div>
        <div className={styles.basescanContainer}>
          <div>
            <a
              href="https://basescan.org/address/0x1E6bA8BC42Bbd8C68Ca7E891bAc191F0e07B1d6F"
              target="_blank
          "
            >
              <Image
                src="/SVG/logo-ether-basescan.svg"
                width={30}
                height={30}
              ></Image>
            </a>
          </div>
        </div>
        <div className={styles.zoraContainer}>
          <div>
            <a
              href="https://zora.co"
              target="_blank
          "
            >
              <Image
                src="/SVG/zora-wordmark-white.svg"
                width={40}
                height={40}
              ></Image>
            </a>
          </div>
        </div>
        <div className={styles.arenaContainer}>
          <div>
            <a href="" target="_blank">
              <Image src="/SVG/arena-logo.svg" width={80} height={25}></Image>
            </a>
          </div>
        </div>
        {/* <div className={styles.zoraContainer}>
          <div>
          <a
              href="https://zora.co"
              target="_blank
          "
            >
            Dexscreener
            </a>
          </div>
        </div> */}
      </div>
      <EmailSub />
      <FinePrint />
    </main>
  );
}
