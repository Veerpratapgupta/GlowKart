import type { Metadata, Viewport } from "next";
import "@fontsource-variable/archivo";
import "@fontsource-variable/fraunces";
import "./globals.css";

export const metadata: Metadata = {
  // Set NEXT_PUBLIC_SITE_URL to the deployed URL so OG/Twitter image URLs are absolute.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "GlowKart — skin-aware lipstick matching",
    template: "%s · GlowKart",
  },
  description:
    "Analyze your skin, discover explainable product matches, and preview shades before you buy.",
  openGraph: {
    title: "GlowKart — skin-aware lipstick matching",
    description:
      "Upload a selfie, see plain-language skin observations, get explainable lipstick matches, and try the shade before you buy.",
    url: "/",
    siteName: "GlowKart",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "GlowKart brand card with three lipstick swatches" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GlowKart — skin-aware lipstick matching",
    description:
      "Analyze, get an explainable match, preview the shade, then add to cart.",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f2eee5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
