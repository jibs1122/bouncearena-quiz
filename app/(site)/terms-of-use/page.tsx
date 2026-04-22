import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Use | Bounce Arena',
  description: 'Terms of use for Bounce Arena.',
  alternates: { canonical: 'https://bouncearena.com.au/terms-of-use/' },
};

export default function TermsOfUsePage() {
  return (
    <div className="mx-auto max-w-2xl px-5 sm:px-8 py-12">
      <h1 className="text-3xl font-bold text-black mb-8">Terms of Use</h1>
      <div className="prose prose-neutral max-w-none prose-p:text-black/75 prose-p:leading-relaxed prose-headings:text-black prose-a:text-[#38b1ab] prose-strong:font-semibold prose-strong:text-black">
        <p>
          <strong>General Disclaimer</strong>: The information on this website is general in nature
          and should not be taken as professional advice. To the maximum extent permitted by law
          Bounce Arena disclaims all liability for any errors or omissions contained in the
          information found on this website, or any failure to update or correct this information.
          It is your responsibility to assess and verify the accuracy, completeness, and reliability
          of the information on this website and to seek professional advice where necessary. This
          website contains links to other websites operated by third parties. Bounce Arena does not
          make any representation as to the accuracy or suitability of any of the information
          contained on those other websites.
        </p>
        <p>
          <strong>1. BINDING AGREEMENT.</strong> These Terms of Use act as a binding agreement
          between you and Bounce Arena (&quot;us&quot;, &quot;we&quot;, &quot;our&quot;). By
          accessing this website, you acknowledge constructive notice of these Terms of Use and your
          agreement to be bound by the language herein.
        </p>
        <p>
          <strong>2. PRIVACY POLICY.</strong> We believe in being transparent when it comes to our
          privacy and information collection practices. Please review our{' '}
          <Link href="/privacy-policy/">Privacy Policy</Link>.
        </p>
        <p>
          <strong>3. GOVERNING LAW.</strong> These Terms shall be construed in accordance with and
          governed by the laws of Australia, without reference to rules regarding conflicts of law.
        </p>
        <p>
          <strong>4. INTELLECTUAL PROPERTY.</strong> All content on this site, including text,
          graphics, logos, and images, is the property of Bounce Arena and is protected by
          applicable intellectual property laws.
        </p>
        <p>
          <strong>5. LIMITATION OF LIABILITY.</strong> To the maximum extent permitted by law,
          Bounce Arena shall not be liable for any indirect, incidental, special, consequential, or
          punitive damages resulting from your use of, or inability to use, this website.
        </p>
        <p>
          <strong>6. CONTACT.</strong> Questions about these Terms of Use can be directed to us
          via <Link href="/contact/">our contact page</Link>.
        </p>
      </div>
    </div>
  );
}
