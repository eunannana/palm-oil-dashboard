import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PalmGrade AI | Automated FFB Grading System",
  description:
    "AI-powered dashboard for Fresh Fruit Bunch ripeness detection and grading.",
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