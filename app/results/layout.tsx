import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Trampoline Quiz Results',
  description: 'Personalised trampoline recommendations based on your Bounce Arena quiz answers.',
  robots: {
    index: false,
    follow: true,
    googleBot: { index: false, follow: true },
  },
};

export default function ResultsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
