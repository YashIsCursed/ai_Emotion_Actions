import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mind Council — 5 Personality Chat",
  description: "Ask a question and get responses from 5 unique AI personalities, synthesized by The Advisor.",
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
