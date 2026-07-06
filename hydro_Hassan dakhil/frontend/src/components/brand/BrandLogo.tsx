import { cn } from '@/lib/utils';

export const BRAND_LOGO_PRIMARY = '/logo.png';
export const BRAND_LOGO_SECONDARY = '/logo2.png';

type BrandLogoProps = {
  variant: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const logoSrc: Record<BrandLogoProps['variant'], string> = {
  primary: BRAND_LOGO_PRIMARY,
  secondary: BRAND_LOGO_SECONDARY,
};

const logoAlt: Record<BrandLogoProps['variant'], string> = {
  primary: 'Hydro-Data Intelligence — Barrage Hassan Addakhil',
  secondary: 'Armoiries du Royaume du Maroc',
};

const sizeClasses: Record<NonNullable<BrandLogoProps['size']>, string> = {
  sm: 'h-9 w-9',
  md: 'h-14 w-14',
  lg: 'h-20 w-auto max-w-[5rem]',
};

export function BrandLogo({ variant, size = 'sm', className }: BrandLogoProps) {
  return (
    <img
      src={logoSrc[variant]}
      alt={logoAlt[variant]}
      className={cn('object-contain shrink-0', sizeClasses[size], className)}
    />
  );
}
