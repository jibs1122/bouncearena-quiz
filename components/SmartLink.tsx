import Link from 'next/link';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import {
  getGoLinkSlug,
  isAffiliateLink,
  isRawVulyAffiliateHref,
  resolveRawVulyAffiliateHref,
} from '@/lib/links';
import { getSupersededSlugs } from '@/lib/supersededPosts';

type SmartLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  href?: string;
};

const SUPERSEDED_SLUGS = new Set(getSupersededSlugs());

function canonicalInternalHref(href: string): string {
  const rootArticle = href.match(/^\/([^/?#]+)\/?([?#].*)?$/);
  if (rootArticle && SUPERSEDED_SLUGS.has(rootArticle[1])) {
    return `/compare/${rootArticle[1]}/${rootArticle[2] ?? ''}`;
  }

  const [pathname, suffix = ''] = href.split(/(?=[?#])/u, 2);
  if (pathname.startsWith('/go/') && !pathname.endsWith('/')) {
    return `${pathname}/${suffix}`;
  }

  return href;
}

function opensOffSite(href: string): boolean {
  return /^https?:\/\//i.test(href) || href === '/go' || href.startsWith('/go/');
}

export default function SmartLink({ href = '', children, ...props }: SmartLinkProps) {
  if (!href) {
    return <a {...props}>{children}</a>;
  }

  const resolvedHref = canonicalInternalHref(resolveRawVulyAffiliateHref(href));

  if (opensOffSite(resolvedHref)) {
    const slug = getGoLinkSlug(href);
    const sponsored = Boolean(slug && isAffiliateLink(slug)) || isRawVulyAffiliateHref(resolvedHref);
    const trackedRedirect = resolvedHref === '/go' || resolvedHref.startsWith('/go/');
    const defaultRel = sponsored
      ? 'nofollow noopener noreferrer sponsored'
      : trackedRedirect
        ? 'nofollow noopener noreferrer'
        : 'noopener noreferrer';

    return (
      <a
        {...props}
        href={resolvedHref}
        target="_blank"
        rel={props.rel ?? defaultRel}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={resolvedHref} {...props}>
      {children}
    </Link>
  );
}
