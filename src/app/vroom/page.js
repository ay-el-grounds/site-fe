// "use client";
import Image from "next/image";
import styles from "../page.module.css";
import Head from "next/head";

import GoogleChart from "../../components/GoogleCharts";

export const metadata = {
  title: "$VROOM tokenomics",
  description:
    "$VROOM is a memecoin launched by Aluminum Grounds that demonstrates ... This is not financial advice, always do your own research.",
  image: "/api/og/route",
};

export default function Vroom() {
  const chartData = [
    ["Desc.", "Supply"],
    ["Initial LP", 10],
    ["Airdrop 1", 15],
    ["Airdrop 2", 20],
    ["Airdrop 3", 25],
    ["Ecosystem", 20],
    ["LP Rewards", 10],
  ];

  const chartOptions = {
    is3D: true,
    slices: {
      0: { color: "#ECEA5F" },
      1: { color: "#D9261F" },
      2: { color: "#D9261F" },
      3: { color: "#D9261F" },
      4: { color: "#ECEA5F" },
      5: { color: "#2E3432" },
    },
    backgroundColor: "none",
    legend: "none",
    pieSliceText: "label",
    pieSliceTextStyle: {
      color: "#fffff1",
    },
    chartArea: {
      height: "1000",
    },
    tooltip: {
      textStyle: {
        color: "#2E3432",
        fontSize: "25",
        fontName: "Rubik Mono One",
      },
      text: "percentage",
    },
  };

  return (
    <>
      <Head>
        <meta
          property="og:image"
          content="https://localhost:3000/api/og-image?name=testing"
        />
      </Head>
      <main className={styles.main}>
        <nav className={styles.header}>
          <div className={styles.logo}>
            <h1>$VROOM</h1>
          </div>
        </nav>
        <div className={styles.headingBlock}>
          <h2>Introduction</h2>
        </div>
        <div className={styles.descriptionBlock}>
          <p>
            Welcome to the official <strong>$VROOM</strong> tokenomics guide,
            brought to you by Aluminum Grounds. This manual will help you
            understand the inner workings of your $VROOM token and how it powers
            our community.
          </p>
        </div>
        <div className={styles.headingBlock}>
          <h2>Operating Instructions for $VROOM</h2>
        </div>
        <div className={styles.descriptionBlock}>
          <p>Overview:</p>
          <p>
            <strong>$VROOM</strong> is a community-owned artwork initiated by
            Aluminum Grounds. Upon launch, we minted ~472.9 billion tokens
            ($VROOM), with over 40% available for open enrollment to all
            automotive enthusiasts.
          </p>
        </div>
        <div className={styles.subHeadingBlock}>
          <h3>Step 1: Set a Positive Baseline</h3>
        </div>
        <div className={styles.descriptionBlock}>
          <p>
            <strong>$VROOM</strong> is designed to take your passions to new
            heights. Just as a car needs to be in neutral, take a few deep
            breaths and center yourself.
          </p>
        </div>
        <div className={styles.subHeadingBlock}>
          <h3>Step 2: Start Your Engine</h3>
        </div>
        <div className={styles.descriptionBlock}>
          <p>
            Before you press the accelerator, it&apos;s crucial to mentally
            prepare for the task ahead. By swapping <strong>$VROOM</strong>, you
            gain a stake in our community. Your participation is rewarded
            through contribution and collaboration.
          </p>
        </div>
        <div className={styles.subHeadingBlock}>
          <h3>Step 3: Floor it!</h3>
        </div>
        <div className={styles.descriptionBlock}>
          <p>
            Early community members were rewarded with <strong>$VROOM</strong>{" "}
            as recognition for their commitment. With no fixed team, the road
            ahead is yours to navigate—create.<strong> $VROOM</strong> is about
            pushing boundaries and making your mark. Now, floor the accelerator.
          </p>
        </div>
        {/* <div className={styles.headingBlock}>
        <h2>Tokenomics</h2>
      </div>
      <div className={styles.thirdColumn}>
        <div className={styles.descriptionBlock}>
          <p>
            Our token allocation strategy builds off of the backs of the giants
            before us. It is planned to ensure a balanced distribution and
            robust support for the $VROOM ecosystem.
          </p>
          <p>
            Our launch process retains 5% of the supply as a fee for deploying
            $VROOM. Additionally, there is a 1% inflation rate set to begin in
            2028.
          </p>
          <dl>
            <dt>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="30"
                height="30"
                viewBox="0 0 24 24"
              >
                <g
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4m0 4h.01" />
                </g>
              </svg>
            </dt>
            <dd>
              $VROOM is a memecoin. Our tokenomics provide clarity on
              distribution, but always conduct your own research. This is not
              financial advice!
            </dd>
          </dl>
        </div>
        <div className={styles.descriptionBlock}>
          <h3>Breakdown</h3>
          <GoogleChart
            data={chartData}
            options={chartOptions}
            width="100%"
            height="300px"
          />
          <div className={styles.note}>
            *25% of Supply is in circulation after Airdrop 1 through the initial
            LP, rewards, & the airdrop
          </div> 
        </div>
      </div>
      <div className={styles.descriptionBlock}>
        <h2>Airdrop</h2>
        <p>0% of allocated funds have been distributed</p>
        <div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Status</th>
                <th>Supply %</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Open Enrollment</td>
                <td>Circulating</td>
                <td>40%</td>
              </tr>
              <tr>
                <td>Liquidity Pool, Mining, and Airdrops</td>
                <td>Circulating</td>
                <td>25%</td>
              </tr>
              <tr>
                <td>Team and Investors (Pit Crew)</td>
                <td>Circulating</td>
                <td>20%</td>
              </tr>
              <tr>
                <td>Ecosystem Support</td>
                <td>Circulating</td>
                <td>10%</td>
              </tr>
              <tr>
                <td>Incentivized Rewards (LP, IRL Activations, etc.)</td>
                <td>Circulating</td>
                <td>5%</td>
              </tr>
            </tbody>
          </table>
          <div className={styles.note}>
            *25% of Supply is in circulation after Airdrop 1 through the initial
            LP, rewards, & the airdrop
          </div>
        </div>
      </div>
      <div className={styles.descriptionBlock}>
        <h2>Liquidity Mining</h2>
        <p>0% of allocated funds have been distributed</p>
        <div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Status</th>
                <th>Supply %</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Liquidity minining (S01)</td>
                <td>Coming soon</td>
                <td>40%</td>
              </tr>
              <tr>
                <td>Liquidity minining (S02)</td>
                <td>Coming soon</td>
                <td>25%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className={styles.descriptionBlock}>
        <h2>Liquidity Pool</h2>
        <p>0% of allocated funds have been distributed</p>
        <div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Status</th>
                <th>Supply %</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Uniswap</td>
                <td>Circulating</td>
                <td>15%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className={styles.descriptionBlock}>
        <h2>Ecosystem</h2>
        <div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Status</th>
                <th>Supply %</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Open Enrollment</td>
                <td>Circulating</td>
                <td>40%</td>
              </tr>
              <tr>
                <td>Liquidity Pool, Mining, and Airdrops</td>
                <td>Circulating</td>
                <td>25%</td>
              </tr>
              <tr>
                <td>Team and Investors (Pit Crew)</td>
                <td>Circulating</td>
                <td>20%</td>
              </tr>
              <tr>
                <td>Ecosystem Support</td>
                <td>Circulating</td>
                <td>10%</td>
              </tr>
              <tr>
                <td>Incentivized Rewards (LP, IRL Activations, etc.)</td>
                <td>Circulating</td>
                <td>5%</td>
              </tr>
            </tbody>
          </table>
          <div className={styles.note}>
            *25% of Supply is in circulation after Airdrop 1 through the initial
            LP, rewards, & the airdrop
          </div>
        </div>
      </div>
      <div className={styles.headingBlock}>
        <h2>Maintenance and Support</h2>
      </div>
      <div className={styles.descriptionBlock}>
        <p>
          Keep your $VROOM token in peak condition by staying engaged with our
          community. Regular participation and contribution will ensure you get
          the most out of your investment.
        </p>
      </div> */}
        <div className={styles.communityGrid}>
          <div className={styles.uniswapContainer}>
            <div>
              <a
                href="https://warpcast.com/~/channel/cars"
                target="_blank
          "
              >
                <Image
                  src="/SVG/uniswap-logo.svg"
                  width={40}
                  height={40}
                ></Image>
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
                href="https://basescan.org/"
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
        <div className={styles.newsletterContainer}>
          <div className={styles.newsletterCopy}>
            <h2>Shall we keep you in the loop?</h2>
            <p>We&apos;ll only email you when we drop something.</p>
          </div>
          <input className={styles.news} placeholder="Email Address"></input>
          <div className={styles.newsletterFooter}>
            <button className={styles.subButton}>Subscribe</button>
          </div>
        </div>
      </main>
    </>
  );
}
