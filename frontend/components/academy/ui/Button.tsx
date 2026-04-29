import * as React from 'react';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

export function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  fullWidth,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}) {
  const base =
    'inline-flex items-center justify-center border-4 border-brutal-black font-black uppercase tracking-widest transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-brutal-blue disabled:cursor-not-allowed disabled:opacity-50';

  const sizes: Record<Size, string> = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variants: Record<Variant, string> = {
    primary:
      'bg-brutal-yellow text-brutal-black shadow-neo-sm hover:-translate-x-1 hover:-translate-y-1 hover:bg-brutal-blue hover:text-white hover:shadow-neo',
    secondary:
      'bg-brutal-blue text-white shadow-neo-sm hover:-translate-x-1 hover:-translate-y-1 hover:bg-brutal-pink hover:text-brutal-black hover:shadow-neo',
    outline:
      'bg-white text-brutal-black shadow-neo-sm hover:-translate-x-1 hover:-translate-y-1 hover:bg-brutal-yellow hover:shadow-neo',
    ghost: 'border-transparent bg-transparent text-brutal-black hover:border-brutal-black hover:bg-brutal-yellow',
  };

  return (
    <button
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
