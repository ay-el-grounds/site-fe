import styles from "../app/page.module.css";

export default function HoverCollab() {
  return (
    <div className={styles.collabButton}>
      <a href="/vroom/contribute" target="_blank">
        <p>🤝</p>
      </a>
    </div>
  );
}
