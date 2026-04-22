import Link from 'next/link';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

type SmartLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  href?: string;
};

function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

export default function SmartLink({ href = '', children, ...props }: SmartLinkProps) {
  if (!href) {
    return <a {...props}>{children}</a>;
  }

  if (isExternalHref(href)) {
    return (
      <a
        {...props}
        href={href}
        target="_blank"
        rel="nofollow noopener noreferrer"
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  );
}
