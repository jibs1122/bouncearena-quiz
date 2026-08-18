import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://bouncearena.com.au'),
  applicationName: 'Bounce Arena',
  title: {
    default: "Bounce Arena – Australia's Trampoline Guide",
    template: '%s | Bounce Arena',
  },
  description:
    'Unbiased trampoline reviews, comparisons, and buying advice for Australian families.',
  icons: { icon: '/favicon.png' },
  openGraph: {
    title: "Bounce Arena – Australia's Trampoline Guide",
    description:
      'Unbiased trampoline reviews, comparisons, and buying advice for Australian families.',
    url: '/',
    siteName: 'Bounce Arena',
    locale: 'en_AU',
    type: 'website',
    images: [
      {
        url: '/images/posts/kids-bouncing-on-trampoline.jpg',
        width: 1200,
        height: 800,
        alt: 'Children enjoying a backyard trampoline',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Bounce Arena – Australia's Trampoline Guide",
    description:
      'Unbiased trampoline reviews, comparisons, and buying advice for Australian families.',
    images: ['/images/posts/kids-bouncing-on-trampoline.jpg'],
  },
};

const GOOGLE_TAG_ID = 'G-KQSGY08M2W';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GOOGLE_TAG_ID}');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
