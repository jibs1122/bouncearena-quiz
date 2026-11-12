import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import PixelPageView from '@/components/PixelPageView';
import OutboundTracker from '@/components/OutboundTracker';
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
    'Trampoline reviews, brand comparisons and buying advice for Australian families.',
  icons: { icon: '/favicon.png' },
  openGraph: {
    title: "Bounce Arena – Australia's Trampoline Guide",
    description:
      'Trampoline reviews, brand comparisons and buying advice for Australian families.',
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
      'Trampoline reviews, brand comparisons and buying advice for Australian families.',
    images: ['/images/posts/kids-bouncing-on-trampoline.jpg'],
  },
};

const GOOGLE_TAG_ID = 'G-KQSGY08M2W';
const META_PIXEL_ID = '848804564109845';
// From Reddit Ads Manager > Events Manager. The pixel stays off while empty.
const REDDIT_PIXEL_ID = 'a2_k08pvtj6789w';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU" className={`${geistSans.variable} ${geistMono.variable}`}>
      {/* Extensions such as Grammarly add attributes to body before React hydrates. */}
      <body suppressHydrationWarning>
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
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init','${META_PIXEL_ID}');
            fbq('track','PageView');
          `}
        </Script>
        {REDDIT_PIXEL_ID && (
          <Script id="reddit-pixel" strategy="afterInteractive">
            {`
              !function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js",t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);
              rdt('init','${REDDIT_PIXEL_ID}');
              rdt('track','PageVisit');
            `}
          </Script>
        )}
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            alt=""
            src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          />
        </noscript>
        <PixelPageView />
        <OutboundTracker />
        {children}
      </body>
    </html>
  );
}
