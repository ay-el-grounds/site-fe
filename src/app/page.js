import Image from "next/image";
import styles from "./page.module.css";
import Link from "next/link";

export default function Home() {
  return (
    <main className={styles.main}>
      <nav className={styles.header}>
        <div className={styles.logo}>
          <h1>Aluminum Grounds</h1>
        </div>
        {/* <div className={styles.filterContainer}>
          <div className={styles.filterOption}>All</div>
          <div className={styles.filterOption}>Community</div>
          <div className={styles.filterOption}>Drops</div>
        </div> */}
        <div className={styles.collabContainer}><a href="mailto:aluminumgrounds@gmail.com">Collaboration</a></div>
      </nav>
      <div className={styles.descriptionBlock}>
        <p>
          We operate at the intersection of car culture and the art industry. In
          build mode now, but stay tuned for drops of well-crafted automotive
          tools, merch, art objects, and printed matter.
        </p>
      </div>
      <div className={styles.communityGrid}>
        <div className={styles.twitterContainer}>
          <a href="https://x.com/aluminumgrounds" target="_blank">
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 432 384"
              >
                <path
                  fill="white"
                  d="M383 105v11q0 45-16.5 88.5t-47 79.5t-79 58.5T134 365q-73 0-134-39q10 1 21 1q61 0 109-37q-29-1-51.5-18T48 229q8 2 16 2q12 0 23-4q-30-6-50-30t-20-55v-1q19 10 40 11q-39-27-39-73q0-24 12-44q33 40 79.5 64T210 126q-2-10-2-20q0-36 25.5-61.5T295 19q38 0 64 27q30-6 56-21q-10 31-39 48q27-3 51-13q-18 26-44 45z"
                />
              </svg>
            </div>
          </a>
        </div>
        <div className={styles.instaContainer}>
          <a href="https://www.instagram.com/aluminumgrounds/" target="_blank">
            <div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 16 16"
              >
                <path
                  fill="white"
                  d="M8 5.67C6.71 5.67 5.67 6.72 5.67 8S6.72 10.33 8 10.33S10.33 9.28 10.33 8S9.28 5.67 8 5.67ZM15 8c0-.97 0-1.92-.05-2.89c-.05-1.12-.31-2.12-1.13-2.93c-.82-.82-1.81-1.08-2.93-1.13C9.92 1 8.97 1 8 1s-1.92 0-2.89.05c-1.12.05-2.12.31-2.93 1.13C1.36 3 1.1 3.99 1.05 5.11C1 6.08 1 7.03 1 8s0 1.92.05 2.89c.05 1.12.31 2.12 1.13 2.93c.82.82 1.81 1.08 2.93 1.13C6.08 15 7.03 15 8 15s1.92 0 2.89-.05c1.12-.05 2.12-.31 2.93-1.13c.82-.82 1.08-1.81 1.13-2.93c.06-.96.05-1.92.05-2.89Zm-7 3.59c-1.99 0-3.59-1.6-3.59-3.59S6.01 4.41 8 4.41s3.59 1.6 3.59 3.59s-1.6 3.59-3.59 3.59Zm3.74-6.49c-.46 0-.84-.37-.84-.84s.37-.84.84-.84s.84.37.84.84a.8.8 0 0 1-.24.59a.8.8 0 0 1-.59.24Z"
                />
              </svg>
            </div>
          </a>
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
        <div className={styles.zoraContainer}>
          <div>
            <a href="" target="_blank">
              <Image
                src="/SVG/zora-wordmark-white.svg"
                width={40}
                height={40}
              ></Image>
            </a>
          </div>
        </div>
        <div className={styles.vroomContainer}>
          <div>
            <Link href="/vroom">
              <Image
                src="/SVG/vroom-logo-wht.svg"
                width={100}
                height={25}
              ></Image>
            </Link>
          </div>
        </div>
      </div>
      <div className={styles.newsletterContainer}>
        <div className={styles.newsletterCopy}>
          <h2>Shall we keep you in the loop?</h2>
          <p>We'll only email you when we drop something.</p>
        </div>
        <input className={styles.news} placeholder="Email Address"></input>
        <div className={styles.newsletterFooter}>
          <button className={styles.subButton}>Subscribe</button>
        </div>
      </div>
    </main>
  );
}
