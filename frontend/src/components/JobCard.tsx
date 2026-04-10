import React from 'react';
import { Briefcase, Building2, CheckCircle2, Zap } from 'lucide-react';
import type { Job } from '../types/models';

interface JobCardProps {
  job: Job;
  alreadyApplied: boolean;
  onApply: (jobId: number) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, alreadyApplied, onApply }) => {
  const skills = job.requiredSkills
    ? job.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="page-card p-5 flex flex-col gap-4 hover:shadow-card-hover transition-all duration-200 animate-fadeIn">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Building2 size={20} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm leading-tight">{job.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{job.company?.name}</p>
          </div>
        </div>
        {job.company?.role && (
          <span className="pill pill-indigo flex-shrink-0">{job.company.role}</span>
        )}
      </div>

      {/* Description */}
      {job.description && (
        <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">{job.description}</p>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill, i) => (
            <span key={i} className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full font-medium">
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Briefcase size={13} />
          <span>
            {job.company?.packageOffered
              ? `₹${job.company.packageOffered} LPA`
              : 'Package not disclosed'}
          </span>
        </div>
        {alreadyApplied ? (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <CheckCircle2 size={13} />
            Applied
          </span>
        ) : (
          <button
            onClick={() => onApply(job.id)}
            className="flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-full transition-colors"
            type="button"
          >
            <Zap size={13} />
            Apply Now
          </button>
        )}
      </div>
    </div>
  );
};
