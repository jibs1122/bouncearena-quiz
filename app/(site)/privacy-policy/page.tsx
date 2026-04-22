import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Bounce Arena',
  description: 'Privacy policy for Bounce Arena.',
  alternates: { canonical: 'https://bouncearena.com.au/privacy-policy/' },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 sm:px-8 py-12">
      <h1 className="text-3xl font-bold text-black mb-8">Privacy Policy</h1>
      <div className="prose prose-neutral max-w-none prose-p:text-black/75 prose-p:leading-relaxed prose-headings:text-black prose-a:text-[#38b1ab]">
        <h2>Who we are</h2>
        <p>
          Our website address is <Link href="/">bouncearena.com.au</Link>.
        </p>
        <p>
          Bounce Arena takes your privacy seriously. This privacy policy describes what personal
          information we collect and how we use it.
        </p>

        <h2>Routine Information Collection</h2>
        <p>
          All web servers track basic information about their visitors. This information includes,
          but is not limited to, IP addresses, browser details, timestamps and referring pages. None
          of this information can personally identify specific visitors to this site. The information
          is tracked for routine administration and maintenance purposes.
        </p>

        <h2>Cookies and Web Beacons</h2>
        <p>
          Where necessary, Bounce Arena uses cookies to store information about a visitor&apos;s
          preferences and history in order to better serve the visitor and/or present the visitor
          with customised content.
        </p>
        <p>
          Advertising partners and other third parties may also use cookies, scripts and/or web
          beacons to track visitors to our site in order to display advertisements and other useful
          information. Such tracking is done directly by the third parties through their own servers
          and is subject to their own privacy policies.
        </p>

        <h2>Controlling Your Privacy</h2>
        <p>
          You can change your browser settings to disable cookies if you have privacy concerns.
          Disabling cookies for all sites is not recommended as it may interfere with your use of
          some sites. Consult your browser documentation for instructions on how to block cookies
          and other tracking mechanisms.
        </p>

        <h2>Special Note About Google Advertising</h2>
        <p>
          Any advertisements served by Google, Inc., and affiliated companies may be controlled
          using cookies. These cookies allow Google to display ads based on your visits to this site
          and other sites that use Google advertising services. Any tracking done by Google through
          cookies and other mechanisms is subject to Google&apos;s own privacy policies.
        </p>

        <h2>Collected Contact Information</h2>
        <p>
          We will not sell or share your personal information with third parties. We will use the
          information to respond to inquiries. From time to time, we may contact you about new
          content, products, services or events that are relevant to your interests.
        </p>

        <h2>Contact Information</h2>
        <p>
          Concerns or questions about this privacy policy can be directed to us via{' '}
          <Link href="/contact/">contact</Link> for further clarification.
        </p>
      </div>
    </div>
  );
}
