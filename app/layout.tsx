import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Secure URL Shortner",
  description: "Simple URL shortner that doesn't track any click, just shortens the given URL",
};

const RootLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => (
  <html lang="en" className="overflow-x-hidden">
    <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      {children}
    </body>
  </html>
);

export default RootLayout;
