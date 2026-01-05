import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { AuthProvider } from "@/components/AuthProvider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#04060c",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://spotlight.co.za"),
  title: {
    default: "Spotlight | Top 3 Businesses in George, Knysna, Plett & More",
    template: "%s | Spotlight",
  },
  description:
    "Discover the top 3 best businesses in every category across the Garden Route - from George to Plettenberg Bay. Personally curated hotels, restaurants, car hire, and more.",
  keywords: [
    "Garden Route",
    "George businesses",
    "Knysna restaurants",
    "Plettenberg Bay hotels",
    "Wilderness accommodation",
    "Mossel Bay",
    "Oudtshoorn",
    "South Africa tourism",
    "Garden Route directory",
    "best restaurants George",
    "car hire Garden Route",
    "dental care George",
    "coffee shops Knysna",
    "safari Oudtshoorn",
  ],
  authors: [{ name: "Spotlight" }],
  creator: "Spotlight",
  publisher: "Spotlight",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_ZA",
    url: "https://spotlight.co.za",
    siteName: "Spotlight",
    title: "Spotlight | Top 3 Businesses in the Garden Route",
    description:
      "Discover the top 3 best businesses in every category across the Garden Route - from George to Plettenberg Bay. Personally curated recommendations.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Spotlight - Garden Route Business Guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Spotlight | Top 3 Businesses in the Garden Route",
    description:
      "Discover the top 3 best businesses in every category across the Garden Route.",
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: "https://spotlight.co.za",
  },
  category: "Business Directory",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-100`}
      >
        <AuthProvider>
          {children}
          <BottomNav />
          <Analytics />
          <SpeedInsights />
        </AuthProvider>
      </body>
    </html>
  );
}
