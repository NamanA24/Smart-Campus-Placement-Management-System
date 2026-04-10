import React from 'react';
import { CheckCircle2, XCircle, Clock, AlertTriangle, Info } from 'lucide-react';

interface StatusPillProps {
  label: string;
}

const statusMap: Record<string, { className: string; icon: React.ReactNode }> = {
  CLEAN: { className: 'pill pill-green', icon: <CheckCircle2 size={12} /> },
  SIGNED: { className: 'pill pill-green', icon: <CheckCircle2 size={12} /> },
  SHORTLISTED: { className: 'pill pill-green', icon: <CheckCircle2 size={12} /> },
  SELECTED: { className: 'pill pill-green', icon: <CheckCircle2 size={12} /> },
  TAMPERED: { className: 'pill pill-red', icon: <AlertTriangle size={12} /> },
  REJECTED: { className: 'pill pill-red', icon: <XCircle size={12} /> },
  'TAMPERED DATA': { className: 'pill pill-red', icon: <AlertTriangle size={12} /> },
  APPLIED: { className: 'pill pill-blue', icon: <Info size={12} /> },
  PENDING: { className: 'pill pill-amber', icon: <Clock size={12} /> },
  UNSIGNED: { className: 'pill pill-amber', icon: <Clock size={12} /> },
  CLEAN_DATA: { className: 'pill pill-green', icon: <CheckCircle2 size={12} /> },
  UNDER_REVIEW: { className: 'pill pill-amber', icon: <Clock size={12} /> },
  'VALID SIGNATURE': { className: 'pill pill-green', icon: <CheckCircle2 size={12} /> },
};

export const StatusPill: React.FC<StatusPillProps> = ({ label }) => {
  const normalized = (label || '').toUpperCase();
  const config = statusMap[normalized] ?? { className: 'pill pill-slate', icon: <Info size={12} /> };
  return (
    <span className={config.className}>
      {config.icon}
      {label}
    </span>
  );
};
