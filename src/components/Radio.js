'use client'
import { useState, useEffect } from "react";
import axios from "axios";
import styles from "../app/page.module.css";

export default function Radio() {
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState("");

  useEffect(() => {
    async function fetchSongs() {
      try {
        const response = await axios.get("/api/songs");
        setSongs(response.data);
      } catch (error) {
        console.error("Error fetching songs:", error);
      }
    }

    fetchSongs();
  }, []);

  return (
    <div className={styles.radio}>
      <audio controls src={currentSong}>
        Your browser does not support the audio element.
      </audio>
      <ul className={styles.jukebox}>
        {songs.map((song) => (
          <li key={song} className={styles.jukebox}>
            <div className={styles.jukeboxSongs}>
              <button className={styles.jukeboxSongs} onClick={() => {
                console.log('Setting current song to:', `/songs/${song}`);
                setCurrentSong(`/songs/${song}`);
              }}>
                <div className={styles.indSong}>
                <img className={styles.indSong} src={`/songs/${song.replace('.mp3', '.png')}`} alt={song} />
                  <div>{song.replace('.mp3', '')}</div>
                </div>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
