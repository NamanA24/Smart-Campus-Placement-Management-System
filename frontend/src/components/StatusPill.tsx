interface StatusPillProps {
  label: string;
}

const getClasses = (label: string): string => {
  const normalized = label.toUpperCase();

  if (normalized.includes('TAMPERED') || normalized.includes('REJECTED')) {
    return 'bg-rose-100 text-rose-700 border-rose-200';
  }
  if (normalized.includes('CLEAN') || normalized.includes('VALID') || normalized.includes('SHORTLISTED')) {
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  }
  if (normalized.includes('UNSIGNED') || normalized.includes('APPLIED')) {
    return 'bg-amber-100 text-amber-700 border-amber-200';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200';
};

export const StatusPill = ({ label }: StatusPillProps) => {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide ${getClasses(label)}`}>
      {label}
    </span>
  );
};
