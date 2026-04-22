import Link from 'next/link';

const SOCIAL = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/people/Bounce-Arena/61558451366389/',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@BounceArena',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
        <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/>
      </svg>
    ),
  },
  {
    label: 'Reddit',
    href: 'https://www.reddit.com/user/Bounce_Arena_Reviews/',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10"/>
        <path d="M16.7 12.3a1.3 1.3 0 0 0-2.2-.9 6.4 6.4 0 0 0-3.4-.9l.6-2.7 1.9.4a1 1 0 1 0 .1-.5l-2.1-.4a.3.3 0 0 0-.3.2l-.6 3a6.4 6.4 0 0 0-3.4.9 1.3 1.3 0 1 0-1.4 2.1 2.6 2.6 0 0 0 0 .4c0 2 2.3 3.6 5.1 3.6s5.1-1.6 5.1-3.6a2.6 2.6 0 0 0 0-.4 1.3 1.3 0 0 0 .6-1.2z" fill="white"/>
        <circle cx="10.1" cy="13.1" r=".7" fill="#ff4500"/>
        <circle cx="13.9" cy="13.1" r=".7" fill="#ff4500"/>
        <path d="M10.4 15a2.6 2.6 0 0 0 3.2 0" fill="none" stroke="#ff4500" strokeWidth=".6" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@bouncearena.com.au',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
      </svg>
    ),
  },
];

const FOOTER_LINKS = [
  { label: 'About Us', href: '/about/' },
  { label: 'Contact', href: '/contact/' },
  { label: 'Earnings Disclaimer', href: '/earnings-disclaimer/' },
  { label: 'Privacy Policy', href: '/privacy-policy/' },
  { label: 'Terms of Use', href: '/terms-of-use/' },
];

export default function Footer() {
  return (
    <footer className="border-t border-black/[0.08] bg-white mt-16">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Links */}
          <nav className="flex flex-wrap justify-center sm:justify-start gap-x-5 gap-y-2">
            {FOOTER_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-black/50 hover:text-black transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Social icons */}
          <div className="flex items-center gap-3">
            {SOCIAL.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="nofollow noopener noreferrer"
                aria-label={s.label}
                className="text-black/40 hover:text-black transition-colors"
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-black/30">
          © Bounce Arena 2026
        </p>
      </div>
    </footer>
  );
}
