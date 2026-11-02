import type { Metadata } from "next";
import "./globals.css";
import "./editorial-theme.css";
import "./motion.css";
import "./cursor.css";
import "./typography.css";
import "./experience-design.css";
import "./national-standards.css";
import "./castilian-court.css";
import "./zoom-layout.css";
import "./royal-theme.css";
import "./interface-polish.css";
import './update201.css';
import {DiscoveryProvider} from './components/DiscoveryProgress';
import RoyalTheme from "./components/RoyalTheme";
import ContentProtection from "./components/ContentProtection";
import {ReaderAccountProvider} from "./components/ReaderAccount";
import BackgroundMusic from "./components/BackgroundMusic";
import ImmersiveViewport from './components/ImmersiveViewport';
import KineticSurfaces from "./components/KineticSurfaces";

export const viewport={width:'device-width',initialScale:1,viewportFit:'cover'};

export const metadata: Metadata = {
  title: "Through Frost and Myth | Atlas",
  description: "Explore the atlas, chronicles and characters of Through Frost and Myth.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased tfam-editorial tfam-royal"><ReaderAccountProvider><DiscoveryProvider><RoyalTheme/>{children}<ImmersiveViewport/><ContentProtection/><BackgroundMusic/><KineticSurfaces/></DiscoveryProvider></ReaderAccountProvider></body>
    </html>
  );
}
