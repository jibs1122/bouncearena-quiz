import Image from 'next/image';
import BrandLogoAvatar from '@/components/BrandLogoAvatar';
import { modelImage } from '@/lib/brands';

type ModelImageProps = {
  brand: string;
  model: string;
  priority?: boolean;
  sizes: string;
  className?: string;
};

export default function ModelImage({
  brand,
  model,
  priority = false,
  sizes,
  className = 'object-contain p-4',
}: ModelImageProps) {
  const image = modelImage(brand, model);

  if (image) {
    return (
      <Image
        src={image}
        alt={`${brand} ${model}`}
        fill
        priority={priority}
        className={className}
        sizes={sizes}
      />
    );
  }

  return (
    <BrandLogoAvatar
      name={brand}
      width={220}
      height={112}
      fluid
      className="mx-5 shadow-sm"
      imageClassName="p-4"
    />
  );
}
