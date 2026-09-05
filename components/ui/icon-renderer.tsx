import React from 'react';
import {
  Zap,
  Palette,
  Rocket,
  Diamond,
  TrendingUp,
  Bug,
  Compass,
  Target,
  Layers,
  Sparkles,
  Folder,
  Briefcase,
  FlaskConical,
  Flame,
  CheckCircle2,
  ListTodo,
  Boxes,
  Cpu,
  Globe,
  Layout,
  LucideProps,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  zap: Zap,
  palette: Palette,
  rocket: Rocket,
  gem: Diamond,
  diamond: Diamond,
  'trending-up': TrendingUp,
  trending: TrendingUp,
  bug: Bug,
  compass: Compass,
  target: Target,
  layers: Layers,
  sparkles: Sparkles,
  folder: Folder,
  briefcase: Briefcase,
  flask: FlaskConical,
  flame: Flame,
  'check-circle': CheckCircle2,
  'list-todo': ListTodo,
  boxes: Boxes,
  cpu: Cpu,
  globe: Globe,
  layout: Layout,
};

// Fallback mapping for emoji strings so existing data automatically converts to clean SVGs
const EMOJI_FALLBACK_MAP: Record<string, React.ComponentType<LucideProps>> = {
  '⚡': Zap,
  '🎨': Palette,
  '🚀': Rocket,
  '💎': Diamond,
  '📈': TrendingUp,
  '🐛': Bug,
  '💼': Briefcase,
  '🧪': FlaskConical,
  '🔥': Flame,
  '🌟': Sparkles,
  '🎯': Target,
  '🗺️': Compass,
  '💡': Sparkles,
  '📁': Folder,
  '🏃‍♂️': ListTodo,
};

export interface IconRendererProps extends Omit<LucideProps, 'ref'> {
  icon?: string;
  defaultIcon?: React.ComponentType<LucideProps>;
}

export function IconRenderer({
  icon,
  defaultIcon: DefaultIcon = Folder,
  className,
  ...props
}: IconRendererProps) {
  if (!icon) {
    return <DefaultIcon className={cn('w-4 h-4', className)} {...props} />;
  }

  // 1. Direct name lookup
  const cleanKey = icon.toLowerCase().trim();
  if (ICON_MAP[cleanKey]) {
    const Component = ICON_MAP[cleanKey];
    return <Component className={cn('w-4 h-4', className)} {...props} />;
  }

  // 2. Emoji fallback lookup
  if (EMOJI_FALLBACK_MAP[icon]) {
    const Component = EMOJI_FALLBACK_MAP[icon];
    return <Component className={cn('w-4 h-4', className)} {...props} />;
  }

  // 3. If it's a short text/emoji, render fallback
  return <DefaultIcon className={cn('w-4 h-4', className)} {...props} />;
}

export const AVAILABLE_SVG_ICONS = [
  { key: 'zap', label: 'Lightning', Icon: Zap },
  { key: 'palette', label: 'Palette', Icon: Palette },
  { key: 'rocket', label: 'Rocket', Icon: Rocket },
  { key: 'gem', label: 'Diamond', Icon: Diamond },
  { key: 'trending-up', label: 'Growth', Icon: TrendingUp },
  { key: 'bug', label: 'Bug Tracker', Icon: Bug },
  { key: 'compass', label: 'Roadmap', Icon: Compass },
  { key: 'target', label: 'Goals', Icon: Target },
  { key: 'briefcase', label: 'Work', Icon: Briefcase },
  { key: 'flask', label: 'Lab / R&D', Icon: FlaskConical },
  { key: 'flame', label: 'Urgent', Icon: Flame },
  { key: 'layers', label: 'Platform', Icon: Layers },
];
