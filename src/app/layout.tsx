import type { Metadata, Viewport } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  verification: {
    google: 'nao0eWOy0-ngoJN13HzCTpBwepvexuUf4VB_RJ1R4gE',
  },
  title: {
    default: 'Planner Nuntă — Wedding Planner din România',
    template: '%s — Planner Nuntă',
  },
  description: 'Organizează nunta perfect: invitați, mese, plan de mese drag & drop, RSVP online și colaborare în timp real cu partenerul.',
  keywords: ['organizator nunta', 'plan mese nunta', 'rsvp nunta', 'lista invitati nunta', 'wedding planner romania'],
  authors: [{ name: 'Nexora Digital' }],
  openGraph: {
    type: 'website',
    locale: 'ro_RO',
    siteName: 'Planner Nuntă',
    title: 'Planner Nuntă — Wedding Planner din România',
    description: 'Invitați, mese, RSVP și colaborare în timp real — totul într-un singur loc. Gratuit pentru nunți cu până la 50 de invitați.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Planner Nuntă — Organizator de nuntă',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planner Nuntă — Wedding Planner din România',
    description: 'Invitați, mese, RSVP și colaborare în timp real — totul într-un singur loc.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" className={`${geistSans.variable} ${playfair.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
