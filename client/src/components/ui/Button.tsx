import React from 'react';
import { cn } from '../../lib/utils';
import { Spinner } from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

    const variants = {
      primary: 'bg-accent text-accent-contrast hover:bg-accent-hover active:bg-accent-hover',
      secondary: 'bg-surface text-text hover:bg-surface-hover border border-border',
      outline: 'bg-transparent text-text border border-border hover:bg-surface',
      danger: 'bg-[#DC2626] text-white hover:bg-[#B91C1C]',
      ghost: 'bg-transparent text-text hover:bg-surface',
    };

    const sizes = {
      sm: 'px-2.5 py-1.5 text-xs rounded-sm gap-1.5',
      md: 'px-4 py-2 text-sm rounded-md gap-2',
      lg: 'px-5 py-2.5 text-base rounded-lg gap-2.5',
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && <Spinner size="sm" className="text-current" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
