// "use client";
import Image from "next/image";
import styles from "../page.module.css";
import HoverBuy from "@/components/HoverBuy";
import VROOM from "@/components/VROOM";
import EmailSub from "@/components/EmailSub";
import GoogleChart from "../../components/GoogleCharts";
import HoverCollab from "@/components/HoverCollab";
import FinePrint from "@/components/FinePrint";

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
        fontName: "IBM Plex Mono",
      },
      text: "percentage",
    },
  };

  return (
    <>
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
          <h2>Introduction</h2>
        </div>
        <div className={styles.descriptionBlock}>
          <p>
            Welcome to the official <span className={styles.vroom}>$VROOM</span>{" "}
            tokenomics guide, brought to you by Aluminum Grounds. This manual
            will help you understand the inner workings of your $VROOM token and
            how it powers our community.
          </p>
        </div>
        <div className={styles.headingBlock}>
          <h2> Tokenomics</h2>
          <h4>(Operating Instructions for $VROOM)</h4>
        </div>
        <div className={styles.descriptionBlock}>
          <h4>Overview</h4>
          <p>
            <span className={styles.vroom}>$VROOM</span> is a community-owned
            artwork initiated by Aluminum Grounds. Upon launch, we minted ~472.9
            billion tokens ($VROOM), with over 40% available for open enrollment
            to all automotive enthusiasts.
          </p>
          <p>
            Launched in June of 2024 on Base Network with an airdrop shortly
            after.
          </p>
        </div>
        {/* <div className={styles.thirdColumn}>
          <div className={styles.descriptionBlock}>
            <p>
              Our token allocation strategy builds off of the backs of the
              giants before us. It is planned to ensure a balanced distribution
              and support for the $VROOM ecosystem.
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
              *15% of Supply is in circulation after Airdrop 1 through the
              initial LP, rewards, & the airdrop
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
              *25% of Supply is in circulation after Airdrop 1 through the
              initial LP, rewards, & the airdrop
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
              *25% of Supply is in circulation after Airdrop 1 through the
              initial LP, rewards, & the airdrop
            </div>
          </div>
        </div> */}
        <div className={styles.headingBlock}>
          <h2>Maintenance and Support</h2>
        </div>
        <div className={styles.descriptionBlock}>
          <p>
            Keep your $VROOM token in peak condition by staying engaged with our
            community.{" "}
            <a href="/vroom/contribute">
              Regular participation and contribution
            </a>{" "}
            will ensure you get the most out of your investment.
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
                <Image
                  src="/SVG/uniswap-logo.svg"
                  width={40}
                  height={40}
                ></Image>
              </a>
            </div>
          </div>
          <div className={styles.warpContainer}>
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
                    fill="currentColor"
                  />
                  <path
                    d="M128.889 253.333L157.778 351.111H182.222V746.667C169.949 746.667 160 756.616 160 768.889V795.556H155.556C143.283 795.556 133.333 805.505 133.333 817.778V844.445H382.222V817.778C382.222 805.505 372.273 795.556 360 795.556H355.556V768.889C355.556 756.616 345.606 746.667 333.333 746.667H306.667V253.333H128.889Z"
                    fill="currentColor"
                  />
                  <path
                    d="M675.556 746.667C663.282 746.667 653.333 756.616 653.333 768.889V795.556H648.889C636.616 795.556 626.667 805.505 626.667 817.778V844.445H875.556V817.778C875.556 805.505 865.606 795.556 853.333 795.556H848.889V768.889C848.889 756.616 838.94 746.667 826.667 746.667V351.111H851.111L880 253.333H702.222V746.667H675.556Z"
                    fill="currentColor"
                  />
                </svg>{" "}
                /cars
              </div>
            </a>
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
    </>
  );
}
