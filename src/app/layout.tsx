import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
<<<<<<< HEAD
import { Toaster } from "@/components/ui/toaster";
=======
import { Providers } from "@/components/providers";
>>>>>>> 80450c96b3265079818c8907794a182e51f9e247

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
  title: "KALDRIX Blockchain Dashboard",
  description: "Advanced blockchain management and development platform for KALDRIX network",
  keywords: ["KALDRIX", "blockchain", "dashboard", "smart contracts", "development", "cryptocurrency"],
  authors: [{ name: "KALDRIX Team" }],
  openGraph: {
    title: "KALDRIX Blockchain Dashboard",
    description: "Advanced blockchain management and development platform",
    url: "https://kaldrix.example.com",
    siteName: "KALDRIX",
>>>>>>> 80450c96b3265079818c8907794a182e51f9e247
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
<<<<<<< HEAD
    title: "Z.ai Code Scaffold",
    description: "AI-powered development with modern React stack",
=======
    title: "KALDRIX Blockchain Dashboard",
    description: "Advanced blockchain management and development platform",
>>>>>>> 80450c96b3265079818c8907794a182e51f9e247
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
<<<<<<< HEAD
        {children}
        <Toaster />
=======
        <Providers>
          {children}
        </Providers>
>>>>>>> 80450c96b3265079818c8907794a182e51f9e247
      </body>
    </html>
  );
}
