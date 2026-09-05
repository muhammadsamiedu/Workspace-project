import React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, disabled, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full bg-white dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500',
            'border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm transition-colors duration-150 p-3',
            'focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20',
            'disabled:opacity-50 disabled:cursor-not-allowed resize-y min-h-[90px]',
            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
