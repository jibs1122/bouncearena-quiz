import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Us',
  description: "How Bounce Arena compares the trampoline brands sold in Australia: safety design, warranties, build quality and price.",
  alternates: { canonical: 'https://bouncearena.com.au/about/' },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-8 py-12">
      <h1 className="text-3xl font-bold text-black mb-8">About Us</h1>
      <div className="prose prose-neutral max-w-none prose-p:text-black/75 prose-p:leading-relaxed prose-a:text-[#38b1ab] prose-headings:text-black">
        <p>
          Bounce Arena helps Australian families pick a trampoline they won&apos;t regret. We compare
          the main brands sold in Australia (Vuly, Springfree, Jumpflex and more) on safety design,
          frame and mat warranties, build quality, replacement part availability, and whether the
          price holds up against alternatives.
        </p>
        <p>
          Our buying guides and tools cover springless and spring-based models, and lean on what owners
          report after a year or two rather than how a trampoline looks when new.
        </p>
        <p>
          Not sure where to start?{' '}
          <Link href="/quiz/">Take our free trampoline quiz</Link>{' '}
          and we&apos;ll match you with the
          right trampoline for your family.
        </p>
      </div>
    </div>
  );
}
