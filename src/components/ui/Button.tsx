import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover',
  secondary: 'bg-surface text-fg border border-line hover:bg-hover',
  ghost: 'text-fg-2 hover:text-fg hover:bg-hover',
  danger: 'bg-bad-soft text-bad hover:brightness-95 border border-transparent',
};
const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 sm:h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  loading?: boolean;
}
export function Button({ variant = 'secondary', size = 'md', icon, loading, className = '', children, disabled, type = 'button', ...rest }: Props) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-lg font-medium whitespace-nowrap transition-colors duration-200 active:translate-y-px disabled:opacity-50 disabled:active:translate-y-0 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {loading ? <Loader2 size={15} className="animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

interface IconProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  tone?: 'default' | 'danger';
}
export function IconButton({ label, tone = 'default', className = '', children, type = 'button', ...rest }: IconProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-fg-3 transition-colors duration-200 ${tone === 'danger' ? 'hover:bg-bad-soft hover:text-bad' : 'hover:bg-hover hover:text-fg'} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
