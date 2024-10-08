import Image from 'next/image';
import Link from 'next/link';
import styles from './Community.module.css';

const Community = ({ platforms }) => {
  return (
    <div className={styles.communityGrid}>
      {platforms.includes('twitter') && (
        <div className={`${styles.communityGridItem} ${styles.twitter}`}>
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
      )}

      {platforms.includes('instagram') && (
        <div className={`${styles.communityGridItem} ${styles.instagram}`}>
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
      )}

      {platforms.includes('warpcast') && (
        <div className={`${styles.communityGridItem} ${styles.warpcast}`}>
          <a href="https://warpcast.com/~/channel/cars" target="_blank">
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
      )}

      {platforms.includes('zora') && (
        <div className={`${styles.communityGridItem} ${styles.zora}`}>
          <div>
            <a href="https://zora.co/@aluminum_grounds" target="_blank">
              <Image
                src="/SVG/zora-wordmark-white.svg"
                width={40}
                height={40}
              ></Image>
            </a>
          </div>
        </div>
      )}

      {platforms.includes('vroom') && (
        <div className={`${styles.communityGridItem} ${styles.vroom}`}>
          <div>
            <Link href="https://vroom.fun" target="_blank">
              <Image
                src="/SVG/vroom-logo-wht.svg"
                width={100}
                height={25}
              ></Image>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Community;
