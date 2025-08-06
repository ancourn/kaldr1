import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "KALDRIX Quantum DAG Blockchain",
  description: "Post-Quantum Secure Directed Acyclic Graph Network",
  keywords: ["KALDRIX", "Quantum", "DAG", "Blockchain", "Post-Quantum", "Cryptocurrency"],
  authors: [{ name: "KALDRIX Team" }],
  openGraph: {
    title: "KALDRIX Quantum DAG Blockchain",
    description: "Post-Quantum Secure Directed Acyclic Graph Network",
    url: "https://kaldrix.network",
    siteName: "KALDRIX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KALDRIX Quantum DAG Blockchain",
    description: "Post-Quantum Secure Directed Acyclic Graph Network",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}