import Link from 'next/link';

interface ArticleQuizCtaProps {
  className?: string;
}

export default function ArticleQuizCta({ className = '' }: ArticleQuizCtaProps) {
  return (
    <section className={`not-prose my-6 ${className}`.trim()}>
      <div className="rounded-2xl border border-[#38b1ab]/20 bg-[#38b1ab]/8 p-5 sm:p-6">
        <h2 className="mb-2 text-2xl font-bold text-black">Take the Quiz</h2>
        <p className="mb-4 max-w-2xl leading-7 text-black/60">
          Our trampoline quiz helps you narrow the right option for your family, yard, and budget.
        </p>
        <Link
          href="/quiz/"
          className="inline-flex items-center justify-center rounded-xl bg-[#38b1ab] px-7 py-3 font-semibold text-white no-underline transition-colors hover:bg-[#2e9a94] hover:text-white"
        >
          Take the Quiz
        </Link>
      </div>
    </section>
  );
}
