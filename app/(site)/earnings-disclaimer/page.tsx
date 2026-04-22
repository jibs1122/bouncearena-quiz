import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Earnings Disclaimer | Bounce Arena',
  description: 'Bounce Arena earnings and affiliate disclosure.',
  alternates: { canonical: 'https://bouncearena.com.au/earnings-disclaimer/' },
};

export default function EarningsDisclaimerPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 sm:px-8 py-12">
      <h1 className="text-3xl font-bold text-black mb-8">Earnings Disclaimer</h1>
      <div className="prose prose-neutral max-w-none prose-p:text-black/75 prose-p:leading-relaxed prose-headings:text-black">
        <p>
          Bounce Arena is a member of several affiliate sales networks. This means that many of the
          companies whose products you see listed on this site pay us referral fees for sending them
          customers for certain products of theirs.
        </p>
        <p>
          When you click and buy products using the links on this site, we may receive compensation
          from the company that sells the product. Being a part of these networks makes it possible
          to support our content team.
        </p>
        <p>
          Opinions presented on the site are those of Bounce Arena or our team members. Any product
          claim, statistic, quote or other representation about a product or service should be
          verified with the manufacturer, provider or party in question.
        </p>
        <p>
          Bounce Arena is independently owned and the opinions expressed here are our own. All
          editorial content is written without prejudice or bias, regardless of sponsor or affiliate
          associations.
        </p>
      </div>
    </div>
  );
}
