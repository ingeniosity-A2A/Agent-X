import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// www.Ava007.Ingeniosity.tech — set via NEXT_PUBLIC_SITE_URL at build time
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.Ava007.Ingeniosity.tech";

export const metadata: Metadata = {
  title: "ESA Service Cards — Extended Stay America",
  description: "ESA Green Shield inspection console, inventory management, and maintenance operations for Extended Stay America. AI-powered by Ingeniosity.",
  keywords: ["ESA", "Green Shield", "Service Cards", "Ingeniosity", "Extended Stay America", "Maintenance", "Inventory", "HD Supply"],
  authors: [{ name: "Ingeniosity" }],
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/" },
  openGraph: {
    siteName: "ESA Service Cards",
    type: "website",
    locale: "en_US",
  },
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ background: "#020208", color: "#f4f4f5" }}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
