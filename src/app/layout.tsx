import type { Metadata } from "next";
import "./globals.css";
import "react-easy-crop/react-easy-crop.css";

export const metadata: Metadata = {
  title: "Video Studio — Reels & more",
  description: "Create reel videos, match previews, and more — rendered in your browser",
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
