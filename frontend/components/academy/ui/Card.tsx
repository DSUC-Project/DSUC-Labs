import * as React from 'react';

type CardProps = {
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  hoverEffect?: boolean;
};

export const Card: React.FC<React.PropsWithChildren<CardProps>> = ({
  children,
  className = '',
  onClick,
  hoverEffect = true,
}) => {
  const base =
    'rounded-2xl border border-white/10 bg-surface/70 backdrop-blur-xl p-5 sm:p-6';

  const hover = hoverEffect
    ? 'transition-all duration-300 hover:border-white/20 hover:-translate-y-0.5'
    : '';

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} ${hover} text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-yellow/80 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${className}`}
      >
        {children}
      </button>
    );
  }

  return (
    <div className={`${base} ${hover} ${className}`}>
      {children}
    </div>
  );
};
