import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About Us | Bounce Arena',
  description: "Australia's go-to resource for unbiased, in-depth trampoline reviews and comparisons.",
  alternates: { canonical: 'https://bouncearena.com.au/about/' },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 sm:px-8 py-12">
      <h1 className="text-3xl font-bold text-black mb-8">About Us</h1>
      <div className="prose prose-neutral max-w-none prose-p:text-black/75 prose-p:leading-relaxed prose-a:text-[#38b1ab] prose-headings:text-black">
        <p>
          Welcome to Bounce Arena, Australia&apos;s go-to resource for unbiased, in-depth trampoline
          reviews. We&apos;re dedicated to helping Australian families find the perfect trampoline that
          balances fun, safety, and quality.
        </p>
        <p>
          With countless options on the market, we understand how challenging it can be to make the
          right choice for your backyard entertainment. That&apos;s why our mission is to provide
          clear, in-depth reviews and comparisons of the most popular trampolines available in
          Australia.
        </p>
        <p>
          From the latest springless trampolines to traditional spring-based models, we rigorously
          test and evaluate each trampoline to give you the most accurate and helpful information
          possible. Our reviews cover everything from safety features and durability to bounce quality
          and value for money.
        </p>
        <p>
          Whether you&apos;re a parent looking for the safest option for young children, or a family
          wanting the most fun and versatile trampoline, we&apos;ve got you covered. Our team is
          passionate about outdoor play and committed to helping you make an informed decision.
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
