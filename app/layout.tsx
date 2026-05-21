import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeBoot } from "@/components/ThemeBoot";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "SkinGraph Radar | CS2 Buyer Network Intelligence",
  description:
    "Market intelligence para skins de CS2: relaciones entre compradores, trader paths, spreads, ciclos sospechosos y grafos Neo4j.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" data-theme="dark" suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable}`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('skin-command-theme')==='light'?'light':'dark';document.documentElement.dataset.theme=t;document.documentElement.classList.add(t==='light'?'theme-light':'theme-dark');document.addEventListener('DOMContentLoaded',function(){document.body.dataset.theme=t;document.body.classList.add(t==='light'?'light-mode':'dark-mode')})}catch(e){document.documentElement.dataset.theme='dark';document.documentElement.classList.add('theme-dark')}`,
          }}
        />
        <ThemeBoot />
        {children}
      </body>
    </html>
  );
}
