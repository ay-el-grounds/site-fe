import "./globals.css";
// import { FrameInit } from "@/components/FrameInit";

export const metadata = {
  title: {
    default: "Aluminum Grounds",
    template: "%s — Aluminum Grounds",
  },
  description:
    "We operate at the intersection of car culture and the art industry.",
  url: "https://aluminumgrounds.co",
  metadataBase: new URL("https://aluminumgrounds.co"),
  site_name: "Aluminum Grounds",
  image: {
    url: "/opengraph-image.png",
    type: "image/png",
    width: 1200,
    height: 630,
  },
  twitter: {
    card: "summary_large_image",
    title: "%s — Aluminum Grounds",
    description:
      "We operate at the intersection of car culture and the art industry.",
    siteId: "",
    creator: "@__chamaquito",
    creatorId: "",
  },
  category: "automotive",
  other: {
    'fc:frame': JSON.stringify({
      version: "next",
      imageUrl: "link-to-a-3:2-preview-image",
      button: {
        title: "Try now!",
        action: {
          type: "launch_frame",
          name: "caracter",
          url: "https://aluminumgrounds.co/caracter", // Updated URL
          splashImageUrl: "link-to-your-splash-image",
          splashBackgroundColor: "#FFFFF1"
        }
      }
    })
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div>
          {children}
          {/* <FrameInit /> */}
        </div>
      </body>
    </html>
  );
}
