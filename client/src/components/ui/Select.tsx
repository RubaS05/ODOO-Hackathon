import React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, containerClassName = '', children, id, ...props }, ref) => {
    return (
      <div className={`w-full flex flex-col gap-1.5 ${containerClassName}`}>
        {label && (
          <label htmlFor={id} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {label}
          </label>
        )}
        <select
          id={id}
          ref={ref}
          className={`flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all ${
            error ? 'border-destructive focus-visible:ring-destructive' : 'focus-visible:border-primary'
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        {error && (
          <span className="text-xs text-destructive font-medium animate-pulse">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
