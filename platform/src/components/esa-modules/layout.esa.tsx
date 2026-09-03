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

// ESA.ingeniosity.tech — set via NEXT_PUBLIC_SITE_URL at build time
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://esa.ingeniosity.tech";

export const metadata: Metadata = {
  title: "ESA Exoskeleton — Extended Stay America",
  description: "ESA Green Shield inspection console, inventory management, and maintenance operations for Extended Stay America. AI-powered by Ingeniosity.",
  keywords: ["ESA", "Green Shield", "Exoskeleton", "Ingeniosity", "Extended Stay America", "Maintenance", "Inventory", "HD Supply"],
  authors: [{ name: "Ingeniosity" }],
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/" },
  openGraph: {
    siteName: "ESA Exoskeleton",
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
