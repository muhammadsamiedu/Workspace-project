import React, { useState } from 'react';
import { cn, getInitials } from '@/lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showOnlineStatus?: boolean;
  isOnline?: boolean;
}

export function Avatar({
  name,
  src,
  size = 'md',
  showOnlineStatus = false,
  isOnline = true,
  className,
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const sizes = {
    xs: 'w-5 h-5 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm font-medium',
    xl: 'w-14 h-14 text-base font-semibold',
  };

  const statusSizes = {
    xs: 'w-1.5 h-1.5 ring-1',
    sm: 'w-2 h-2 ring-1.5',
    md: 'w-2.5 h-2.5 ring-2',
    lg: 'w-3 h-3 ring-2',
    xl: 'w-3.5 h-3.5 ring-2',
  };

  const initials = getInitials(name);

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full shrink-0 select-none font-medium',
        'bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-xs',
        sizes[size],
        className
      )}
      title={name}
      {...props}
    >
      {src && !imageError ? (
        <img
          src={src}
          alt={name}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <span>{initials}</span>
      )}

      {showOnlineStatus && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-white dark:ring-zinc-900',
            isOnline ? 'bg-emerald-500' : 'bg-zinc-400',
            statusSizes[size]
          )}
        />
      )}
    </div>
  );
}

export function AvatarGroup({
  children,
  limit = 4,
  className,
}: {
  children: React.ReactNode;
  limit?: number;
  className?: string;
}) {
  const items = React.Children.toArray(children);
  const visible = items.slice(0, limit);
  const remaining = items.length - limit;

  return (
    <div className={cn('flex items-center -space-x-2 overflow-hidden', className)}>
      {visible.map((child, i) => (
        <div key={i} className="ring-2 ring-white dark:ring-zinc-900 rounded-full">
          {child}
        </div>
      ))}
      {remaining > 0 && (
        <div className="relative inline-flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 ring-2 ring-white dark:ring-zinc-900 select-none">
          +{remaining}
        </div>
      )}
    </div>
  );
}
