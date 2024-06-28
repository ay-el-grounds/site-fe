import styles from "../app/page.module.css";

export default function EmailSub() {
  return (
    <>
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
    </>
  );
}
