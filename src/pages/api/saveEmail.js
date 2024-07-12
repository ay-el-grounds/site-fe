// pages/api/saveEmail.js
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    const filePath = path.resolve('emails.json');
    let emails = [];

    if (fs.existsSync(filePath)) {
      emails = JSON.parse(fs.readFileSync(filePath));
    }

    if (emails.includes(email)) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    emails.push(email);
    fs.writeFileSync(filePath, JSON.stringify(emails, null, 2));

    return res.status(200).json({ message: 'Email saved' });
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
