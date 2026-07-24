import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Shell } from "@/app/components/Shell";
import { BottomNav } from "@/app/components/BottomNav";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MilGaya — Community Lost & Found Platform",
    template: "%s | MilGaya",
  },
  description:
    "Report, search, and reclaim lost items in your local community. Privacy-first, zero cost, instant WhatsApp verification connection.",
  keywords: [
    "lost and found",
    "lost items",
    "found items",
    "community lost and found",
    "reclaim lost wallet",
    "lost phone finder",
    "privacy-first lost and found",
    "MilGaya",
  ],
  authors: [{ name: "MilGaya Team" }],
  creator: "MilGaya",
  publisher: "MilGaya",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://milgaya.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "MilGaya — Community Lost & Found Platform",
    description:
      "Browse reported lost & found items locally or post a found item securely without exposing private contact info.",
    siteName: "MilGaya",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MilGaya Community Lost & Found",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MilGaya — Community Lost & Found Platform",
    description:
      "Browse reported lost & found items locally or post a found item securely without exposing private contact info.",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MilGaya",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "MilGaya",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://milgaya.vercel.app",
    description: "Privacy-first community lost and found platform.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${process.env.NEXT_PUBLIC_APP_URL || "https://milgaya.vercel.app"}/?city={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" className={`h-full ${jakarta.variable}`}>
      <body className="min-h-full flex flex-col bg-bg text-ink font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Shell>{children}</Shell>
        <BottomNav />
      </body>
    </html>
  );
}