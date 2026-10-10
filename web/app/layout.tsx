import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import InstallPrompt from "./install-prompt";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Blues Brothers · Guild Command",
  description: "The guild operations hub for the Blues Brothers SWGOH guild.",
  applicationName: "BB Guild",
  appleWebApp: { capable: true, title: "BB Guild", statusBarStyle: "black" },
};

export const viewport: Viewport = {
  themeColor: "#05070a",
};

const themeScript = `
  try {
    const savedTheme = localStorage.getItem("bb-theme");
    document.documentElement.dataset.theme = savedTheme || "dark";
  } catch {
    document.documentElement.dataset.theme = "dark";
  }
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
