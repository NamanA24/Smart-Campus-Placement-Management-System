import type { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
}

export const SectionCard = ({ title, subtitle, right, children }: SectionCardProps) => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="font-sora text-lg font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        {right ? <div>{right}</div> : null}
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
};
