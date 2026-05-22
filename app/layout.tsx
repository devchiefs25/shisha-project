import type { Metadata } from "next";
import { Cormorant_Garamond, Great_Vibes, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const greatVibes = Great_Vibes({
  variable: "--font-great-vibes",
  subsets: ["latin"],
  weight: ["400"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Al Sahra Shisha Delivery — Premium Shisha to Your Door · Melbourne",
  description:
    "Build your perfect shisha online — fresh fruit heads, premium flavours, delivered hot across Melbourne. Customise base, flavour, head and add-ons in three steps.",
  applicationName: "Al Sahra Shisha",
  authors: [{ name: "Al Sahra" }],
  keywords: [
    "shisha delivery Melbourne",
    "hookah delivery",
    "premium shisha",
    "fruit head shisha",
    "Al Sahra",
    "shisha online order",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Al Sahra Shisha Delivery — Melbourne",
    description: "Premium shisha delivered. Fresh heads, premium flavours, all Melbourne.",
    url: "/",
    siteName: "Al Sahra Shisha",
    locale: "en_AU",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1206,
        height: 1215,
        alt: "Al Sahra Shisha Delivery logo",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@alsahra.shisha",
    creator: "@alsahra.shisha",
    title: "Al Sahra Shisha Delivery — Melbourne",
    description: "Premium shisha delivered. Fresh heads, premium flavours, all Melbournetest.",
    images: [
      {
        url: "/og-image.png",
        alt: "Al Sahra Shisha Delivery logo",
      },
    ],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${cormorant.variable} ${greatVibes.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
