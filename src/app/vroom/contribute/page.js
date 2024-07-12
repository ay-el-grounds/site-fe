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
      <div className={styles.mediaBlock}>
        <img src="/tokyo-highway-roll.gif"></img>
      </div>

      <div className={styles.descriptionBlock}>
      <div className={styles.heading}>
        <h2>Contribute</h2>
      </div>
        <p>
          This guide outlines how to live and breathe{" "}
          <span className={styles.vroomWord}>$VROOM</span>.
        </p>
      </div>
      <div className={styles.communityGrid}>
        <div className={styles.genContainer}>
          <div>
            <a href="">
              Emblem<br></br>(soon)
            </a>
          </div>
        </div>
        <div className={styles.genContainer}>
          <div>
            <a href="">
              Imagery<br></br>(soon)
            </a>
          </div>
        </div>
        <div className={styles.genContainer}>
          <div>
            <a href="">
              Typography<br></br>(soon)
            </a>
          </div>
        </div>
      </div>

      <div className={styles.descriptionBlock}>
      <div className={styles.heading}>
        <h2>Branding Tenets</h2>
      </div>
        <h3>Be Authentic</h3>
        <p>
          <span className={styles.vroomWord}>$VROOM</span> thrives on genuine
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
          <span className={styles.vroomWord}>$VROOM</span> is about pushing the
          limits. Burn rubber and reflect this in every aspect of your
          contribution.
        </p>
        <h3>Detail Obsession</h3>
        <p>
          Precision wins races. From visuals to messaging, ensure everything
          aligns with the <span className={styles.vroomWord}>$VROOM</span> brand.
        </p>
        <h3>Collaborate Hard</h3>
        <p>
          Racing is a team sport. Work with others who share the{" "}
          <span className={styles.vroomWord}>$VROOM</span> vision to draft ahead and
          achieve more together.
        </p>
      </div>
      <div className={styles.mediaBlock}>
      <div className={styles.heading}>
        <h2>Joining the Inner Donut</h2>
      </div>
        <div className={styles.diagrams}>
          <img src="/race-track.png"></img>
        </div>
        <div className={styles.caption}>
          Fig 1. Guide for acquiring a Race Bib
        </div>
        <div className={styles.paragraph}>
          <ol>
            <li>
              Utilize <span className={styles.vroomWord}>$VROOM</span> brand assets
              to contribute to the meme economy while adhereing to our
              guidelines.
            </li>
            <li>Share your creations through our Race Bib Form.</li>
            <li>
              Selected works will be featured across our social channels,
              amplifying your reach within the{" "}
              <span className={styles.vroomWord}>$VROOM</span> community. If your
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
      <div className={styles.descriptionBlock}>
      <div className={styles.heading}>
        <h2>$VROOM on the Assembly Line</h2>
      </div>
        <p>
          As the world embraces electric vehicles,{" "}
          <span className={styles.vroomWord}>$VROOM</span> captures and immortalizes
          the beautiful sounds in a deeply abstracted way on a digital medium.
        </p>
        <p>
          <span className={styles.vroomWord}>$VROOM</span> dropped on June 25th. In
          a month packed with automotive history (and also PRIDE).{" "}
          <span className={styles.vroomWord}>$VROOM</span> celebrates milestones
          like the first auto race, the premiere of The Fast and the Furious
          franchise, the release of{" "}
          <a href="https://www.imdb.com/title/tt0187078/" target="_blank">
            Gone in Sixty Seconds
          </a>
          , and{" "}
          <a href="https://www.imdb.com/title/tt0187078/" target="_blank">
            Cars
          </a>{" "}
          (the Pixar film) — so as it turns out, cars are gay.
        </p>
        <p>
          In our universe, <span className={styles.vroomWord}>$VROOM</span>{" "}
          transcends mere tokenization—it’s a cultural statement. It playfully
          critiques traditional industries while fostering a community-driven
          approach to redefining gasoline-powered love in the digital age.
        </p>
      </div>
      <div className={styles.communityGrid}>
        <div className={`${styles.communityGridItem} ${styles.uniswap}`}>
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
        <div className={`${styles.communityGridItem} ${styles.warpcast}`}>
          <a
            href="https://warpcast.com/~/channel/cars"
            target="_blank
          "
          >
            <div className={styles.carsChannel}>
              <svg
                width="35px"
                height="35px"
                viewBox="0 0 1000 1000"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M257.778 155.556H742.222V844.445H671.111V528.889H670.414C662.554 441.677 589.258 373.333 500 373.333C410.742 373.333 337.446 441.677 329.586 528.889H328.889V844.445H257.778V155.556Z"
                  fill="white"
                />
                <path
                  d="M128.889 253.333L157.778 351.111H182.222V746.667C169.949 746.667 160 756.616 160 768.889V795.556H155.556C143.283 795.556 133.333 805.505 133.333 817.778V844.445H382.222V817.778C382.222 805.505 372.273 795.556 360 795.556H355.556V768.889C355.556 756.616 345.606 746.667 333.333 746.667H306.667V253.333H128.889Z"
                  fill="white"
                />
                <path
                  d="M675.556 746.667C663.282 746.667 653.333 756.616 653.333 768.889V795.556H648.889C636.616 795.556 626.667 805.505 626.667 817.778V844.445H875.556V817.778C875.556 805.505 865.606 795.556 853.333 795.556H848.889V768.889C848.889 756.616 838.94 746.667 826.667 746.667V351.111H851.111L880 253.333H702.222V746.667H675.556Z"
                  fill="white"
                />
              </svg>{" "}
              /cars
            </div>
          </a>
        </div>
        <div className={`${styles.communityGridItem} ${styles.basescan}`}>
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
        <div className={`${styles.communityGridItem} ${styles.zora}`}>
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
        <div className={`${styles.communityGridItem} ${styles.arena}`}>
          <div>
            <a
              href="https://www.are.na/brian-felix/vroom-e5x4pc22x14"
              target="_blank"
            >
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
