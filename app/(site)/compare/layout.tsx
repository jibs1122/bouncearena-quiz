import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compare Trampolines Australia 2025',
  description: 'Side-by-side comparison of all top Australian trampolines by price, size, weight rating, warranty and safety certification.',
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
