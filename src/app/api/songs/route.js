import { readdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export async function GET() {
  const songsDirectory = path.join(process.cwd(), "public", "songs");

  try {
    const files = await readdir(songsDirectory);
    const mp3Files = files.filter((file) => file.endsWith(".mp3"));

    return NextResponse.json(mp3Files);
  } catch (error) {
    console.error("Failed to read songs directory:", error);
    return NextResponse.json(
      { error: "Failed to read songs directory" },
      { status: 500 }
    );
  }
}
