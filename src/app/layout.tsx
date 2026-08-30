import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chess Learn",
  description: "Un outil pour construire et réviser vos répertoires d'ouvertures avec l'analyse Stockfish.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://yukhyshell5.github.io/theme.css" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div className="ys-topbar">
          <a href="https://yukhyshell5.github.io/" className="ys-topbar-brand">
            ❯ yukhyShell5
          </a>
          <span className="ys-topbar-sep">/</span>
          <span className="ys-topbar-tool">chess-learn</span>
          <a href="https://yukhyshell5.github.io/" className="ys-topbar-home">
            portfolio ↗
          </a>
        </div>
        {children}
      </body>
    </html>
  );
}
