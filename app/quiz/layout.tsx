import type { Metadata } from 'next';
import GeoBannerSlot from '@/components/GeoBannerSlot';

export const metadata: Metadata = {
  title: 'Trampoline Quiz: Find the Right Trampoline for Your Family',
  description:
    'Answer six questions about your yard, who will use it, shape, budget, spring type and safety standard to see the trampolines that suit your family.',
  alternates: { canonical: 'https://bouncearena.com.au/quiz/' },
  openGraph: {
    title: 'Trampoline Quiz: Find the Right Trampoline for Your Family',
    description:
      'Answer six questions about your yard, who will use it, shape, budget, spring type and safety standard to see the trampolines that suit your family.',
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
