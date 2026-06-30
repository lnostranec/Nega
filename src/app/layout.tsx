import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  variable: "--font-montserrat",
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: {
    default: "Nega — женское бельё",
    template: "%s | Nega",
  },
  description: "Интернет-магазин женского белья премиум-класса",
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
      </body>
    </html>
  );
}
