import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { TestProvider } from "@/contexts/TestContext";

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
    <html lang="en" className="bg-[#0f1729]">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#0f1729] min-h-screen`}
      >
        <TestProvider>
          <Navbar />
          <div className="flex pt-20">
            <Sidebar />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </TestProvider>
      </body>
    </html>
  );
}
