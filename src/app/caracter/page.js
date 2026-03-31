"use client";
import { useEffect, useState } from 'react';
import { initializeFrame } from '@/lib/frame';

export default function CaracterPage() {
  const [userFid, setUserFid] = useState(null);

  useEffect(() => {
    async function fetchUserFid() {
      await initializeFrame();
      setUserFid(window.userFid);
    }
    fetchUserFid();
  }, []);

  return (
    <div>
      <h1>Welcome to Caracter</h1>
      {userFid ? (
        <p>Your FID is: {userFid}</p>
        // Add logic here to analyze user casts and suggest a car
      ) : (
        <p>Loading user information...</p>
      )}
    </div>
  );
}