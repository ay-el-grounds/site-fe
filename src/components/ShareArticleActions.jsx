"use client";

import { useMemo, useState } from "react";
import styles from "./ShareArticleActions.module.css";

export default function ShareArticleActions({ title }) {
  const [status, setStatus] = useState("");

  const pageUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return window.location.href;
  }, []);

  const shareText = `${title} — Aluminum Grounds`;

  const updateStatus = (message) => {
    setStatus(message);
    window.setTimeout(() => {
      setStatus((current) => (current === message ? "" : current));
    }, 2400);
  };

  const copyLink = async (message = "Link copied.") => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      updateStatus(message);
    } catch {
      updateStatus("Could not copy the link.");
    }
  };

  const openShareWindow = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareX = () => {
    const params = new URLSearchParams({
      text: shareText,
      url: pageUrl,
    });

    openShareWindow(`https://twitter.com/intent/tweet?${params.toString()}`);
  };

  const handleShareFarcaster = () => {
    const params = new URLSearchParams({
      text: shareText,
    });

    params.append("embeds[]", pageUrl);
    openShareWindow(`https://warpcast.com/~/compose?${params.toString()}`);
  };

  return (
    <aside className={styles.shareCard}>
      <p className={styles.eyebrow}>Share</p>
      <p className={styles.title}>Pass this one along.</p>
      <p className={styles.description}>
        Copy the link or post it straight to the places your people actually hang out.
      </p>

      <div className={styles.actionRow}>
        <button className={styles.actionButton} type="button" onClick={() => copyLink()}>
          Copy Link
        </button>
        <button className={styles.actionButton} type="button" onClick={handleShareX}>
          Share on X
        </button>
        <button
          className={styles.actionButton}
          type="button"
          onClick={() => copyLink("Link copied for your IG Story.")}
        >
          Copy for IG Story
        </button>
        <button className={styles.actionButton} type="button" onClick={handleShareFarcaster}>
          Share on Farcaster
        </button>
      </div>

      {status ? <p className={styles.status}>{status}</p> : null}
    </aside>
  );
}
