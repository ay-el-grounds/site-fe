import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: {
    default: "Aluminum Grounds",
    template: "%s — Aluminum Grounds"
  },
  description: "We operate at the intersection of car culture and the art industry.",
  url: "https://aluminumgrounds.co", 
  metadataBase: new URL('https://aluminumgrounds.co'),
  site_name: "Aluminum Grounds", 
  image: {
    url: "/opengraph-image.png",
    type: "image/png", 
    width: 1200, 
    height: 630
  },
  twitter: {
    card: 'summary_large_image',
    title: '%s — Aluminum Grounds',
    description: 'We operate at the intersection of car culture and the art industry.',
    siteId: '',
    creator: '@__chamaquito',
    creatorId: '',
  },
  category: 'automotive',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
