import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const songsDirectory = path.join(process.cwd(), 'public', 'songs');
  fs.readdir(songsDirectory, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to read songs directory' });
    }
    const mp3Files = files.filter(file => file.endsWith('.mp3'));
    res.status(200).json(mp3Files);
  });
}
