"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "./page.module.css";

export default function ThirdPlaceActions({
  currentLang,
  toggleLabel,
  downloadLabel,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleToggleLanguage = () => {
    const params = new URLSearchParams(searchParams.toString());
    const nextLang = currentLang === "es" ? "en" : "es";

    params.set("lang", nextLang);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`${styles.actionBar} ${styles.noPrint}`}>
      <button
        className={styles.actionButtonSecondary}
        type="button"
        onClick={handleToggleLanguage}
      >
        {toggleLabel}
      </button>
      <button
        className={styles.actionButtonPrimary}
        type="button"
        onClick={handlePrint}
      >
        {downloadLabel}
      </button>
    </div>
  );
}
