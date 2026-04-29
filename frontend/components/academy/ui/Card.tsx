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
    'border-4 border-brutal-black bg-white p-5 shadow-neo-sm sm:p-6';

  const hover = hoverEffect
    ? 'transition-all duration-300 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-neo'
    : '';

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} ${hover} text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brutal-blue ${className}`}
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
