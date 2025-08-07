import type { Metadata } from "next";
<<<<<<< HEAD
=======
<<<<<<< HEAD
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Z.ai Code Scaffold - AI-Powered Development",
  description: "Modern Next.js scaffold optimized for AI-powered development with Z.ai. Built with TypeScript, Tailwind CSS, and shadcn/ui.",
  keywords: ["Z.ai", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "AI development", "React"],
  authors: [{ name: "Z.ai Team" }],
  openGraph: {
    title: "Z.ai Code Scaffold",
    description: "AI-powered development with modern React stack",
    url: "https://chat.z.ai",
    siteName: "Z.ai",
=======
>>>>>>> 28f03b7b7ee59195afe2e07f647ca52fd48e24fb
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
<<<<<<< HEAD
  title: "Z.ai Code Scaffold - AI-Powered Development",
  description: "Modern Next.js scaffold optimized for AI-powered development with Z.ai. Built with TypeScript, Tailwind CSS, and shadcn/ui.",
  keywords: ["Z.ai", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "AI development", "React"],
  authors: [{ name: "Z.ai Team" }],
  openGraph: {
    title: "Z.ai Code Scaffold",
    description: "AI-powered development with modern React stack",
    url: "https://chat.z.ai",
    siteName: "Z.ai",
=======
  title: "KALDRIX - Quantum-Proof DAG Blockchain",
  description: "The world's first quantum-resistant blockchain combining DAG-based consensus with post-quantum cryptography. Built for the future of decentralized finance and enterprise applications.",
  keywords: ["KALDRIX", "Quantum-Resistant", "DAG Blockchain", "Post-Quantum Cryptography", "Blockchain", "DeFi", "Enterprise Blockchain"],
  authors: [{ name: "KALDRIX Team" }],
  openGraph: {
    title: "KALDRIX - Quantum-Proof DAG Blockchain",
    description: "Quantum-resistant blockchain technology for the future of decentralized applications",
    url: "https://kaldrix.com",
    siteName: "KALDRIX",
>>>>>>> 825fb317ac2b476898191ee36891ce92b0ff27ca
>>>>>>> 28f03b7b7ee59195afe2e07f647ca52fd48e24fb
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
<<<<<<< HEAD
    title: "Z.ai Code Scaffold",
    description: "AI-powered development with modern React stack",
=======
<<<<<<< HEAD
    title: "Z.ai Code Scaffold",
    description: "AI-powered development with modern React stack",
=======
    title: "KALDRIX - Quantum-Proof DAG Blockchain",
    description: "Quantum-resistant blockchain technology for the future of decentralized applications",
>>>>>>> 825fb317ac2b476898191ee36891ce92b0ff27ca
>>>>>>> 28f03b7b7ee59195afe2e07f647ca52fd48e24fb
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
<<<<<<< HEAD
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
=======
<<<<<<< HEAD
        className="antialiased bg-background text-foreground"
=======
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
>>>>>>> 825fb317ac2b476898191ee36891ce92b0ff27ca
>>>>>>> 28f03b7b7ee59195afe2e07f647ca52fd48e24fb
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
