import localFont from "next/font/local";
import type { Metadata } from "next";
import { Analytics } from "@/components/layout/Analytics";
import "./globals.css";

// Шрифт лежит в репозитории: сборка не зависит от доступности Google Fonts.
const montserrat = localFont({
  src: "./fonts/Montserrat-Variable.ttf",
  variable: "--font-montserrat",
  weight: "100 900",
  display: "swap",
  fallback: ["system-ui", "Arial", "sans-serif"],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Nega — женское бельё",
    template: "%s | Nega",
  },
  description:
    "Интернет-магазин женского белья Nega: коллекции, доставка по России, примерка по меркам.",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    siteName: "Nega",
    title: "Nega — женское бельё",
    description:
      "Интернет-магазин женского белья Nega: коллекции, доставка по России.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Nega — женское бельё",
    description:
      "Интернет-магазин женского белья Nega: коллекции, доставка по России.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${montserrat.variable} h-full`}>
      <body className="min-h-full bg-white font-sans text-[#260402] antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
