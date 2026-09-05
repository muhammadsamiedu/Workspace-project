import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, leftIcon, rightIcon, error, disabled, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            disabled={disabled}
            className={cn(
              'w-full bg-white dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500',
              'border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm transition-colors duration-150',
              'focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              leftIcon ? 'pl-9' : 'pl-3',
              rightIcon ? 'pr-9' : 'pr-3',
              'py-2',
              error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center pointer-events-none text-zinc-400 dark:text-zinc-500">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
