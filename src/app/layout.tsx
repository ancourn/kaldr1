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

export const metadata: Metadata = {
  title: "KALDRIX - Quantum-Proof DAG Blockchain",
  description: "The world's first quantum-resistant blockchain combining DAG-based consensus with post-quantum cryptography. Built for the future of decentralized finance and enterprise applications.",
  keywords: ["KALDRIX", "Quantum-Resistant", "DAG Blockchain", "Post-Quantum Cryptography", "Blockchain", "DeFi", "Enterprise Blockchain"],
  authors: [{ name: "KALDRIX Team" }],
  openGraph: {
    title: "KALDRIX - Quantum-Proof DAG Blockchain",
    description: "Quantum-resistant blockchain technology for the future of decentralized applications",
    url: "https://kaldrix.com",
    siteName: "KALDRIX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KALDRIX - Quantum-Proof DAG Blockchain",
    description: "Quantum-resistant blockchain technology for the future of decentralized applications",
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
        {children}
        <Toaster />
      </body>
    </html>
  );
}
