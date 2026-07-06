import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Konfigurator ogrodzeń stalowych | STAL-POL",
  description:
    "Skonfiguruj ogrodzenie stalowe STAL-POL — panele 3D, palisada, bramy i furtki z wyceną netto.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      className={`${inter.variable} ${poppins.variable} h-full max-lg:overflow-hidden`}
    >
      <body
        className="min-h-screen font-sans antialiased max-lg:h-full max-lg:min-h-0 max-lg:overflow-hidden"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
