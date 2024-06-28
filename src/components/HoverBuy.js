import styles from "../app/page.module.css";
import VROOM from "./VROOM";

export default function HoverBuy() {
  return (
    <div className={styles.buyButton}>
      <a href="" target="_blank">
        <p>Buy</p>
        <VROOM width={'100%'} />
        <p>{" { soon } "}</p></a>
    </div>
  );
}
