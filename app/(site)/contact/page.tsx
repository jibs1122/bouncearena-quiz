import type { Metadata } from 'next';
import ProtectedEmail from '@/components/ProtectedEmail';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the Bounce Arena team.',
  alternates: { canonical: 'https://bouncearena.com.au/contact/' },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 sm:px-8 py-12">
      <h1 className="text-3xl font-bold text-black mb-4">Contact</h1>
      <p className="text-black/70 leading-relaxed mb-4">
        Questions or comments? We&apos;d love to hear from you.
      </p>
      <p className="text-black/70">
        Email us: <ProtectedEmail />
      </p>
    </div>
  );
}
