import Link from 'next/link';

export type RelatedLink = {
  href: string;
  label: string;
};

export default function RelatedComparisons({
  heading = 'Related reading',
  links,
}: {
  heading?: string;
  links: RelatedLink[];
}) {
  if (links.length === 0) return null;

  return (
    <section className="not-prose mt-14">
      <h2 className="mb-5 text-xl font-bold text-black">{heading}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-2xl border border-black/[0.08] px-4 py-3 transition-colors hover:border-[#38b1ab]/50"
          >
            <span className="block text-sm font-medium text-black">{link.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
