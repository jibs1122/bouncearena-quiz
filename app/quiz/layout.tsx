import type { Metadata } from 'next';
import GeoBannerSlot from '@/components/GeoBannerSlot';

export const metadata: Metadata = {
  title: 'Trampoline Quiz: Find the Right Trampoline for Your Family',
  description:
    'Answer seven quick questions about your yard, budget and priorities to find trampoline options suited to your Australian family.',
  alternates: { canonical: 'https://bouncearena.com.au/quiz/' },
  openGraph: {
    title: 'Trampoline Quiz: Find the Right Trampoline for Your Family',
    description:
      'Answer seven quick questions about your yard, budget and priorities to find trampoline options suited to your family.',
    url: 'https://bouncearena.com.au/quiz/',
    siteName: 'Bounce Arena',
    type: 'website',
    images: [
      {
        url: 'https://bouncearena.com.au/images/posts/kids-bouncing-on-trampoline.jpg',
        width: 1200,
        height: 800,
        alt: 'Children enjoying a backyard trampoline',
      },
    ],
  },
};

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GeoBannerSlot />
      {children}
    </>
  );
}
