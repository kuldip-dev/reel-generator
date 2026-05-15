import type { Metadata } from "next";
import "./globals.css";
import "react-easy-crop/react-easy-crop.css";

export const metadata: Metadata = {
  title: "Reel Generator — Image to Video",
  description: "Generate 9:16 reel videos from your images using Remotion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
