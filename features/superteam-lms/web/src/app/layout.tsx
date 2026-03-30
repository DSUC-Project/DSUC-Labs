import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SolanaProviders } from "./providers";
import { Layout } from "@/components/layout/Layout";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DSUC - Academy",
  description: "DSUC - Academy — Solana learning platform (Genin → Chunin → Jonin).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${mono.variable} antialiased`}>
        <SolanaProviders>
          <Layout>{children}</Layout>
        </SolanaProviders>
      </body>
    </html>
  );
}
