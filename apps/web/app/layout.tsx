import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://binit-sigma.vercel.app"),
  title: { default: "Binit — Spot It. Snap It. Solve It.", template: "%s · Binit" },
  description:
    "AI-powered civic waste intelligence for Kolkata Urban and Gram Panchayat zones. Spot waste, snap a photo, classify severity with AI, dispatch collection crews, and verify cleanups.",
  applicationName: "Binit",
  keywords: ["waste", "civic tech", "AI", "Kolkata", "recycling", "smart city", "waste management", "geospatial routing"],
  openGraph: {
    title: "Binit — Spot It. Snap It. Solve It.",
    description:
      "AI-powered civic waste intelligence for Kolkata Urban and Gram Panchayat zones. Spot waste, snap a photo, classify severity with AI, dispatch collection crews, and verify cleanups.",
    url: "https://binit-sigma.vercel.app",
    siteName: "Binit Civic Intelligence",
    images: [
      {
        url: "/social.jpg",
        width: 1280,
        height: 640,
        alt: "Binit — Spot It. Snap It. Solve It. AI-Powered Civic Waste Intelligence",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Binit — Spot It. Snap It. Solve It.",
    description:
      "AI-powered civic waste intelligence platform for automated municipal dispatch and verified clean-up loops.",
    images: ["/social.jpg"],
  },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Binit",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#040d09",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-dvh font-sans antialiased bg-[#020704] text-[#ecf8f1]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}