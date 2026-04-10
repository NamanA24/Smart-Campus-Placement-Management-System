import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  variant?: 'default' | 'green' | 'red' | 'amber' | 'indigo' | 'blue';
  sublabel?: string;
}

const variants = {
  default: {
    icon: 'bg-slate-100 text-slate-600',
    value: 'text-slate-900',
    border: 'border-slate-100',
  },
  green: {
    icon: 'bg-emerald-100 text-emerald-600',
    value: 'text-emerald-700',
    border: 'border-emerald-100',
  },
  red: {
    icon: 'bg-rose-100 text-rose-600',
    value: 'text-rose-700',
    border: 'border-rose-100',
  },
  amber: {
    icon: 'bg-amber-100 text-amber-600',
    value: 'text-amber-700',
    border: 'border-amber-100',
  },
  indigo: {
    icon: 'bg-indigo-100 text-indigo-600',
    value: 'text-indigo-700',
    border: 'border-indigo-100',
  },
  blue: {
    icon: 'bg-blue-100 text-blue-600',
    value: 'text-blue-700',
    border: 'border-blue-100',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  variant = 'default',
  sublabel,
}) => {
  const v = variants[variant];
  return (
    <div className={`stat-card border ${v.border} animate-fadeIn`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`p-2 rounded-xl ${v.icon}`}>{icon}</span>
      </div>
      <div>
        <p className={`text-3xl font-bold ${v.value}`}>{value}</p>
        {sublabel && <p className="text-xs text-slate-400 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
};
