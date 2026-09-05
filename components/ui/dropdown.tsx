import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface DropdownItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
  width?: string;
  /** Open the menu above the trigger (for items near the bottom of the screen) */
  dropUp?: boolean;
}

export function Dropdown({
  trigger,
  items,
  align = 'right',
  className,
  width = 'w-52',
  dropUp = false,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl py-1.5 focus:outline-none glass-panel',
            align === 'right' ? 'right-0' : 'left-0',
            dropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
            width,
            className
          )}
        >
          {items.map((item, idx) => {
            if (item.divider) {
              return (
                <div
                  key={`div-${idx}`}
                  className="my-1 border-t border-zinc-100 dark:border-zinc-800"
                />
              );
            }
            return (
              <button
                key={item.id || idx}
                disabled={item.disabled}
                onClick={() => {
                  if (!item.disabled && item.onClick) {
                    item.onClick();
                    setIsOpen(false);
                  }
                }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-left transition-colors cursor-pointer',
                  item.danger
                    ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:text-rose-400'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/80',
                  item.disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent'
                )}
              >
                {item.icon && <span className="w-4 h-4 shrink-0">{item.icon}</span>}
                <span className="flex-1 truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
