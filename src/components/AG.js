import React from "react";
import IconSvg from "../../public/SVG/lettermark.svg";
import Link from "next/link";
import styles from "./AG.module.css";

const AG = ({ fill = "red" }) => (
  <Link href="/">
    <IconSvg className={styles.logo} style={{ fill: fill }} />
  </Link>
);

export default AG;
