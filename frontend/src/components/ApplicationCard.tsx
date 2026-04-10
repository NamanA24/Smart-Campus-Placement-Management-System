import React from 'react';
import { Briefcase, User } from 'lucide-react';
import { StatusPill } from './StatusPill';

interface ApplicationCardProps {
  studentName: string;
  jobTitle: string;
  status: string;
  companyName?: string;
}

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  studentName,
  jobTitle,
  status,
  companyName,
}) => {
  return (
    <div className="page-card p-4 flex items-center gap-4 animate-fadeIn hover:shadow-card-hover transition-all duration-200">
      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
        <Briefcase size={18} className="text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-slate-900 text-sm">{jobTitle}</p>
          {companyName && (
            <span className="text-xs text-slate-500">@ {companyName}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
          <User size={11} />
          <span>{studentName}</span>
        </div>
      </div>
      <StatusPill label={status || 'APPLIED'} />
    </div>
  );
};
