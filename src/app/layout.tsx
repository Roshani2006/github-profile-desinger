import type { Metadata } from "next";
import { Providers } from "@/app/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Profile Atelier | Your GitHub, reimagined",
  description: "Design an expressive GitHub profile, build a README and SVG suite, then publish it in one thoughtful flow.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><Providers>{children}</Providers></body></html>;
}