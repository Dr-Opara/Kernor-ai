import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kernor — Your next move, handled.",
  description: "Discover, tailor, apply, track, and interview with one calm career workspace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
