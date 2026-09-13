import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "CineBook | Premium Cinema Ticket Booking Platform",
  description:
    "Book movie tickets with real-time seat availability, instant digital QR passes, and verified cinema schedules.",
};

import MockApiProvider from "@/components/MockApiProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} antialiased min-h-screen flex flex-col bg-cine-950 text-slate-100`}>
        <MockApiProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </MockApiProvider>
      </body>
    </html>
  );
}
