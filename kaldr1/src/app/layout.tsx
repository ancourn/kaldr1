import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KALDRIX Blockchain Dashboard",
  description: "Advanced blockchain management and development platform for KALDRIX network",
  keywords: ["KALDRIX", "blockchain", "dashboard", "smart contracts", "development", "cryptocurrency"],
  authors: [{ name: "KALDRIX Team" }],
  openGraph: {
    title: "KALDRIX Blockchain Dashboard",
    description: "Advanced blockchain management and development platform",
    url: "https://kaldrix.example.com",
    siteName: "KALDRIX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KALDRIX Blockchain Dashboard",
    description: "Advanced blockchain management and development platform",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
