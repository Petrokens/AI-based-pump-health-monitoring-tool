// This file contains common theme replacement patterns
// Used as reference for updating components to use CSS variables

export const themeReplacements = {
  // Background colors
  'bg-slate-800': 'bg-[var(--bg-card)]',
  'bg-slate-900': 'bg-[var(--bg-primary)]',
  'bg-slate-700': 'bg-[var(--bg-secondary)]',
  'bg-slate-800/80': 'bg-[var(--bg-card)]/80',
  'bg-slate-800/70': 'bg-[var(--bg-card)]/70',
  'bg-slate-900/60': 'bg-[var(--bg-secondary)]/60',
  'bg-slate-900/40': 'bg-[var(--bg-secondary)]/40',
  'bg-slate-700/50': 'bg-[var(--bg-secondary)]/50',
  'bg-slate-700/30': 'bg-[var(--bg-secondary)]/30',
  
  // Text colors
  'text-white': 'text-[var(--text-primary)]',
  'text-slate-100': 'text-[var(--text-primary)]',
  'text-slate-200': 'text-[var(--text-primary)]',
  'text-slate-300': 'text-[var(--text-secondary)]',
  'text-slate-400': 'text-[var(--text-secondary)]',
  'text-slate-500': 'text-[var(--text-tertiary)]',
  
  // Border colors
  'border-slate-700': 'border-[var(--border-color)]',
  'border-slate-800': 'border-[var(--border-dark)]',
  'border-slate-600': 'border-[var(--border-light)]',
};
