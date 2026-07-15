import type { Metadata } from "next";
import { Abril_Fatface, Cormorant_Garamond, Open_Sans } from "next/font/google";
import "./globals.css";

const abril = Abril_Fatface({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-abril",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["italic", "normal"],
  variable: "--font-cormorant",
  display: "swap",
});

const openSans = Open_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-opensans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Pattern Spotter",
  description:
    "Answer four questions and find out which people pleasing pattern is actually running underneath it, where it started, and where it is still running today.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${abril.variable} ${cormorant.variable} ${openSans.variable} font-body bg-cream text-dark`}
      >
        {children}
      </body>
    </html>
  );
}
