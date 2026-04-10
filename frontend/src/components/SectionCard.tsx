import React from 'react';

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  subtitle,
  right,
  children,
  className = '',
  noPadding = false,
}) => {
  return (
    <div className={`page-card animate-fadeIn ${className}`}>
      {(title || right) && (
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-100">
          <div>
            {title && (
              <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            )}
            {subtitle && (
              <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {right && <div className="flex-shrink-0">{right}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>{children}</div>
    </div>
  );
};
