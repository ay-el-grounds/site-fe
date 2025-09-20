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
                <svg
                  version="1.1"
                  id="Layer_1"
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  x="0px"
                  y="0px"
                  viewBox="0 0 500 500"
                  enableBackground="new 0 0 500 500"
                  xmlSpace="preserve"
                  fill="currentColor"
                  width="15"
                  height="15"
                >
                  <path
                    d="M457.9,3H200.1H159H42.1H4.9H1v494h3.9h37.2H159h41.1h257.8H499v-41.1V346v-41V195v-41V44.1V3H457.9z M159,44.1
            V154H42.1V44.1H159z M159,195v110H42.1V195H159z M42.1,455.9V346H159v109.9H42.1z M457.9,455.9H200.1V346h257.8V455.9z
            M457.9,305H200.1V195h257.8V305z M457.9,154H200.1V44.1h257.8V154z"
                  />
                  <rect x="214.7" y="81.3" width="229.5" height="35.4" />
                  <rect x="214.8" y="232.3" width="229.5" height="35.4" />
                  <rect x="214.8" y="383.3" width="229.5" height="35.4" />
                  <polygon points="150.9,80.2 126.5,55.8 89.7,92.6 72.1,75.1 46.9,100.4 88.7,142.2 88.8,142.1 88.9,142.2" />
                  <polygon points="150.9,231.2 126.5,206.8 89.7,243.6 72.1,226.1 46.9,251.4 88.7,293.2 88.8,293.1 88.9,293.2" />
                  <polygon points="150.9,382.2 126.5,357.8 89.7,394.6 72.1,377.1 46.9,402.4 88.7,444.2 88.8,444.1 88.9,444.2" />
                </svg>
              </Link>
            </div>
            <div className={styles.collabContainer}>
              <Link href="/clutch">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                >
                  <rect x="0" width="20" height="20" fill="none" />
                  <path d="M1 3.17V18h18V4H8v-.83c0-.32-.12-.6-.35-.83S7.14 2 6.82 2H2.18c-.33 0-.6.11-.83.34-.24.23-.35.51-.35.83zM10 6v2H3V6h7zm7 0v10h-5V6h5zm-7 4v2H3v-2h7zm0 4v2H3v-2h7z" />
                </svg>
              </Link>
            </div>
            <div className={styles.collabContainer}>
              <Link href="/">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor" /* ✨ inherits from parent */
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M3 1L1.66667 5H0V8H1V15H3V13H13V15H15V8H16V5H14.3333L13 1H3ZM4 9C3.44772 9 3 9.44772 3 10C3 10.5523 3.44772 11 4 11C4.55228 11 5 10.5523 5 10C5 9.44772 4.55228 9 4 9ZM11.5585 3H4.44152L3.10819 7H12.8918L11.5585 3ZM12 9C11.4477 9 11 9.44772 11 10C11 10.5523 11.4477 11 12 11C12.5523 11 13 10.5523 13 10C13 9.44772 12.5523 9 12 9Z"
                  />
                </svg>
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
        <Community
          platforms={["twitter", "instagram", "warpcast", "zora", "vroom"]}
        />
        <EmailSub />
        <FinePrint />
      </main>
    </>
  );
}
