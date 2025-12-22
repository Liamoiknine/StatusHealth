import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import { TestProvider } from "@/contexts/TestContext";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StatusHealth",
  description: "Health status monitoring application",
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[#F7F7F7]">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#F7F7F7] min-h-screen`}
      >
        <TestProvider>
          <Suspense fallback={<div className="w-60 bg-white min-h-screen border-r border-gray-200" />}>
            <Sidebar />
          </Suspense>
          <div className="flex flex-col min-h-screen">
            <main className="ml-60 flex-1">
              {children}
            </main>
            <div className="ml-60">
              <Footer />
            </div>
          </div>
        </TestProvider>
      </body>
    </html>
  );
}
