import React from 'react';
import { cn } from '../../lib/utils.js';

export function Badge({ className, variant = 'default', children, ...props }) {
  const baseStyles =
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2';

  const variants = {
    default: 'bg-cyan-100 text-cyan-800 border border-cyan-200/60',
    secondary: 'bg-slate-100 text-slate-800 border border-slate-200',
    outline: 'text-slate-800 border border-slate-300',
    destructive: 'bg-rose-100 text-rose-800 border border-rose-200',
    success: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-100 text-amber-800 border border-amber-200',
    confirmed: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    pending: 'bg-amber-100 text-amber-800 border border-amber-200',
    cancelled: 'bg-rose-100 text-rose-800 border border-rose-200',
    admin: 'bg-purple-100 text-purple-800 border border-purple-200',
    staff: 'bg-blue-100 text-blue-800 border border-blue-200',
  };

  return (
    <div className={cn(baseStyles, variants[variant] || variants.default, className)} {...props}>
      {children}
    </div>
  );
}
