import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-text">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3 py-2 text-sm bg-background text-text border border-border rounded-md',
            'transition-colors placeholder:text-text-muted',
            'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent',
            'disabled:opacity-50 disabled:bg-surface disabled:cursor-not-allowed',
            error && 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-[#DC2626]">{error}</span>}
        {helperText && !error && <span className="text-xs text-text-muted">{helperText}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className, id, rows = 4, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-xs font-medium text-text">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={cn(
            'w-full px-3 py-2 text-sm bg-background text-text border border-border rounded-md',
            'transition-colors placeholder:text-text-muted resize-y',
            'focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent',
            'disabled:opacity-50 disabled:bg-surface disabled:cursor-not-allowed',
            error && 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-[#DC2626]">{error}</span>}
        {helperText && !error && <span className="text-xs text-text-muted">{helperText}</span>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
