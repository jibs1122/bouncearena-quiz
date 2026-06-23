import GeoBannerSlot from '@/components/GeoBannerSlot';

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GeoBannerSlot />
      {children}
    </>
  );
}
