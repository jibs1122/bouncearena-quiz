'use client';

import Image from 'next/image';
import { useState } from 'react';
import { brandInitials, getBrandLogo } from '@/lib/brandLogos';

type BrandLogoAvatarProps = {
  name: string;
  width?: number;
  height?: number;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  fluid?: boolean;
};

export default function BrandLogoAvatar({
  name,
  width = 88,
  height = 64,
  className = '',
  imageClassName = '',
  priority = false,
  fluid = false,
}: BrandLogoAvatarProps) {
  const logo = getBrandLogo(name);
  const [failed, setFailed] = useState(false);
  const showLogo = Boolean(logo && !failed);
  const initials = brandInitials(name);

  return (
    <span
      className={[
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border',
        logo?.fullBleed && showLogo
          ? 'border-transparent'
          : logo?.darkBackground && showLogo
            ? 'border-transparent bg-[#062b3d]'
            : 'border-black/[0.08] bg-white',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ width: fluid ? '100%' : width, maxWidth: fluid ? width : undefined, height }}
    >
      {showLogo && logo ? (
        <Image
          src={logo.src}
          alt={`${name} logo`}
          width={width * 2}
          height={height * 2}
          className={[
            'h-full w-full',
            logo.fullBleed ? 'object-cover' : 'object-contain',
            logo.fullBleed ? '' : imageClassName || 'p-3',
          ]
            .filter(Boolean)
            .join(' ')}
          style={logo.scale ? { transform: `scale(${logo.scale})` } : undefined}
          onError={() => setFailed(true)}
          priority={priority}
          unoptimized={logo.src.endsWith('.svg')}
        />
      ) : (
        <span className="font-bold text-[#38b1ab]" style={{ fontSize: Math.max(18, height * 0.38) }}>
          {initials}
        </span>
      )}
    </span>
  );
}
