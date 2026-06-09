import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
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
  title: {
    default: "Convertit — Ücretsiz Online Dosya Dönüştürücü | PDF, Word, Excel, Resim",
    template: "%s | Convertit",
  },
  description:
    "PDF, Word (DOCX), Excel (XLSX), CSV, Markdown, HTML, JPG, PNG ve WEBP dosyalarınızı ücretsiz dönüştürün. PDF birleştirme ve bölme araçları. Dosyalarınız hiçbir sunucuya yüklenmez — %100 tarayıcıda, %100 gizli.",
  keywords: [
    "dosya dönüştürücü",
    "pdf dönüştürücü",
    "word to pdf",
    "pdf to word",
    "pdf birleştirme",
    "pdf bölme",
    "excel to csv",
    "resim dönüştürücü",
    "jpg to png",
    "ücretsiz dönüştürücü",
    "online converter",
    "file converter",
  ],
  openGraph: {
    title: "Convertit — Ücretsiz Online Dosya Dönüştürücü",
    description:
      "PDF, Word, Excel, resim ve daha fazlasını tarayıcınızda dönüştürün. Dosyalarınız asla sunucuya yüklenmez.",
    type: "website",
    locale: "tr_TR",
    siteName: "Convertit",
  },
  twitter: {
    card: "summary",
    title: "Convertit — Ücretsiz Online Dosya Dönüştürücü",
    description:
      "PDF, Word, Excel, resim ve daha fazlasını tarayıcınızda dönüştürün. %100 gizli.",
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
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5294678879618903"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
        </ClerkProvider>
      </body>
    </html>
  );
}
