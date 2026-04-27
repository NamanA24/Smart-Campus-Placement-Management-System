import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Layout } from '../components/Layout';
import { StatCard } from '../components/StatCard';
import { SectionCard } from '../components/SectionCard';
import { StatusPill } from '../components/StatusPill';
import { applicationAPI, companyAPI, jobAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { ApplicationResponseDTO, Company, Job, StatusDistribution } from '../types/models';
import {
  Briefcase, Users, ShieldAlert, CheckCircle2, Plus, BarChart3,
  Building2, TrendingUp, Star, AlertCircle,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  APPLIED:     '#6366F1',
  SHORTLISTED: '#10B981',
  REJECTED:    '#F43F5E',
};

function validateJobForm(title: string, description: string): string[] {
  const errs: string[] = [];
  if (!title.trim())       errs.push('Job title is required');
  if (!description.trim()) errs.push('Job description is required');
  return errs;
}

export const CompanyPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'overview';
  const setActiveTab = (id: string) => setSearchParams(id ? { tab: id } : {});

  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<ApplicationResponseDTO[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | ''>('');
  const [analytics, setAnalytics] = useState<{ average: number; ratio: number; distribution: StatusDistribution | null }>({
    average: 0, ratio: 0, distribution: null,
  });
  const [jobTitle, setJobTitle]       = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobSkills, setJobSkills]     = useState('');
  const [message, setMessage]         = useState('');
  const [formErrors, setFormErrors]   = useState<string[]>([]);
  const [posting, setPosting]         = useState(false);

  const myCompany = useMemo(
    () => allCompanies.find((c) => c.name === user?.username) || null,
    [allCompanies, user?.username],
  );
  const myJobs = useMemo(
    () => jobs.filter((j) => j.company?.name === user?.username),
    [jobs, user?.username],
  );

  const loadData = async () => {
    const [companiesRes, jobsRes, appsRes] = await Promise.all([
      companyAPI.getAll(),
      jobAPI.getAll(),
      applicationAPI.getByCompany(),
    ]);
    setAllCompanies(companiesRes.data);
    setJobs(jobsRes.data);
    setApplications(appsRes.data);
  };

  useEffect(() => {
    loadData().catch(() => setMessage('Unable to load company dashboard data'));
  }, []);

  const handleStatusUpdate = async (applicationId: number, status: 'SHORTLISTED' | 'REJECTED') => {
    await applicationAPI.updateStatus(applicationId, status);
    const appsRes = await applicationAPI.getByCompany();
    setApplications(appsRes.data);
  };

  const handleCreateJob = async () => {
    const errs = validateJobForm(jobTitle, jobDescription);
    if (errs.length > 0) { setFormErrors(errs); return; }
    if (!myCompany) { setFormErrors(['Company profile not found']); return; }
    setFormErrors([]);
    setPosting(true);
    try {
      await jobAPI.create({ title: jobTitle, description: jobDescription, requiredSkills: jobSkills, company: { id: myCompany.id } });
      setJobTitle('');
      setJobDescription('');
      setJobSkills('');
      const jobsRes = await jobAPI.getAll();
      setJobs(jobsRes.data);
      setActiveTab('listings');
    } catch {
      setMessage('Failed to create job');
    } finally {
      setPosting(false);
    }
  };

  const loadAnalytics = async (jobId: number) => {
    const [averageRes, ratioRes, distributionRes] = await Promise.all([
      applicationAPI.getAnalyticsAverage(jobId),
      applicationAPI.getAnalyticsSelectionRatio(jobId),
      applicationAPI.getAnalyticsStatus(jobId),
    ]);
    setAnalytics({
      average: Number(averageRes.data || 0),
      ratio:   Number(ratioRes.data || 0),
      distribution: distributionRes.data,
    });
  };

  const shortlisted = applications.filter((a) => a.status?.toUpperCase() === 'SHORTLISTED').length;
  const rejected    = applications.filter((a) => a.status?.toUpperCase() === 'REJECTED').length;
  const applied     = applications.filter((a) => !['SHORTLISTED','REJECTED'].includes((a.status || '').toUpperCase())).length;
  const tampered    = applications.filter((a) => a.verification === 'TAMPERED DATA').length;

  const appPieData = [
    { name: 'Applied',     value: applied,     color: STATUS_COLORS.APPLIED },
    { name: 'Shortlisted', value: shortlisted, color: STATUS_COLORS.SHORTLISTED },
    { name: 'Rejected',    value: rejected,    color: STATUS_COLORS.REJECTED },
  ].filter((d) => d.value > 0);

  return (
    <Layout>
      <div className="flex flex-col h-full">
        <div className="bg-white border-b border-slate-200 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Company Dashboard</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                <span className="font-medium text-slate-700">{user?.username}</span> — Manage your jobs and candidates
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200">
              <Building2 size={16} className="text-teal-600" />
              <span className="text-sm font-medium text-teal-700">Company</span>
            </div>
          </div>
        </div>


        <div className="flex-1 p-6 animate-fadeIn">
          {message && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
              <AlertCircle size={16} className="flex-shrink-0" />{message}
            </div>
          )}

          {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Open Positions"      value={myJobs.length}      icon={<Briefcase size={18} />}    variant="indigo" />
                <StatCard label="Total Applications"  value={applications.length} icon={<Users size={18} />}       variant="blue" />
                <StatCard label="Shortlisted"         value={shortlisted}        icon={<CheckCircle2 size={18} />} variant="green" />
                <StatCard label="Flagged Profiles"    value={tampered}           icon={<ShieldAlert size={18} />}  variant={tampered > 0 ? 'red' : 'default'} />
              </div>

              {/* Application Status Chart */}
              {applications.length > 0 && (
                <SectionCard title="Application Status Breakdown" subtitle="Live distribution of all your applications">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-full md:w-64 h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie dataKey="value" data={appPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4}>
                            {appPieData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(val: any) => [`${val} applications`, '']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col gap-3 flex-1">
                      {[
                        { label: 'Applied',     value: applied,     color: STATUS_COLORS.APPLIED,     bg: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
                        { label: 'Shortlisted', value: shortlisted, color: STATUS_COLORS.SHORTLISTED, bg: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
                        { label: 'Rejected',    value: rejected,    color: STATUS_COLORS.REJECTED,    bg: 'bg-rose-50 border-rose-200 text-rose-800' },
                      ].map((item) => (
                        <div key={item.label} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${item.bg}`}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                            <span className="font-medium text-sm">{item.label}</span>
                          </div>
                          <span className="font-bold text-lg">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </SectionCard>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <button onClick={() => setActiveTab('post')} className="page-card p-6 flex items-center gap-4 hover:shadow-card-hover transition-all duration-200 text-left">
                  <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center">
                    <Plus size={24} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Post a New Job</p>
                    <p className="text-sm text-slate-500 mt-0.5">Reach qualified candidates</p>
                  </div>
                </button>
                <button onClick={() => setActiveTab('applications')} className="page-card p-6 flex items-center gap-4 hover:shadow-card-hover transition-all duration-200 text-left">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                    <Users size={24} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Review Applications</p>
                    <p className="text-sm text-slate-500 mt-0.5">{applications.length} total received</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ── POST JOB ─────────────────────────────────────────────────── */}
          {activeTab === 'post' && (
            <div className="max-w-2xl">
              <SectionCard title="Create Job Posting" subtitle="All fields marked * are required">
                <div className="space-y-5">
                  {formErrors.length > 0 && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                      {formErrors.map((e, i) => (
                        <p key={i} className="text-sm text-rose-700 flex items-center gap-2">
                          <AlertCircle size={14} className="flex-shrink-0" /> {e}
                        </p>
                      ))}
                    </div>
                  )}
                  <div>
                    <label className="form-label">Job Title <span className="text-rose-500">*</span></label>
                    <input className="form-input" placeholder="e.g., Software Engineer Intern"
                      value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Description <span className="text-rose-500">*</span></label>
                    <textarea className="form-input min-h-[100px] resize-none"
                      placeholder="Describe the role, responsibilities, and expectations..."
                      value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Required Skills</label>
                    <input className="form-input" placeholder="e.g., React, Node.js, SQL"
                      value={jobSkills} onChange={(e) => setJobSkills(e.target.value)} />
                    {jobSkills && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {jobSkills.split(',').map((s, i) => s.trim() && (
                          <span key={i} className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">{s.trim()}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button className="btn-primary w-full justify-center py-3" onClick={handleCreateJob} disabled={posting} type="button">
                    <Plus size={18} />
                    {posting ? 'Publishing...' : 'Publish Job'}
                  </button>
                </div>
              </SectionCard>
            </div>
          )}

          {/* ── MY LISTINGS ──────────────────────────────────────────────── */}
          {activeTab === 'listings' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500 font-medium">{myJobs.length} job{myJobs.length !== 1 ? 's' : ''} posted</p>
              {myJobs.length === 0 ? (
                <div className="page-card p-12 text-center">
                  <Briefcase size={40} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No jobs posted yet</p>
                  <button onClick={() => setActiveTab('post')} className="mt-3 btn-primary text-sm"><Plus size={16} /> Post your first job</button>
                </div>
              ) : (
                <div className="page-card overflow-hidden">
                  <table className="data-table">
                    <thead>
                      <tr><th>Job Title</th><th>Description</th><th>Required Skills</th><th>Applications</th></tr>
                    </thead>
                    <tbody>
                      {myJobs.map((job) => {
                        const appCount = applications.filter((a) => a.jobTitle === job.title).length;
                        const skills = job.requiredSkills?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
                        return (
                          <tr key={job.id}>
                            <td className="font-medium">{job.title}</td>
                            <td className="max-w-xs truncate text-slate-500">{job.description}</td>
                            <td>
                              <div className="flex flex-wrap gap-1">
                                {skills.map((s, i) => <span key={i} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{s}</span>)}
                                {skills.length === 0 && <span className="text-slate-400 text-xs">—</span>}
                              </div>
                            </td>
                            <td><span className={`pill ${appCount > 0 ? 'pill-blue' : 'pill-slate'}`}>{appCount}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── APPLICATIONS ─────────────────────────────────────────────── */}
          {activeTab === 'applications' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500 font-medium">{applications.length} application{applications.length !== 1 ? 's' : ''} received</p>
              {applications.length === 0 ? (
                <div className="page-card p-12 text-center">
                  <Users size={40} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No applications received yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((row) => (
                    <div key={row.applicationId} className="page-card p-4">
                      <div className="flex flex-wrap items-start gap-4">
                        <div className="flex-1 min-w-[200px]">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0">
                              {row.studentName?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-slate-900">{row.studentName}</p>
                              <p className="text-xs text-slate-500">{row.studentEmail}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-600">
                            {row.studentCgpa && <span className="bg-slate-100 px-2 py-0.5 rounded">CGPA: {row.studentCgpa}</span>}
                            {row.studentPhone && <span className="bg-slate-100 px-2 py-0.5 rounded">{row.studentPhone}</span>}
                            {row.studentResumeLink && row.studentResumeLink.startsWith('http') && (
                              <a href={row.studentResumeLink} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline font-medium">Resume →</a>
                            )}
                          </div>
                          {row.studentSkills && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {row.studentSkills.split(',').map((s, i) => s.trim() && (
                                <span key={i} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">{s.trim()}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0 min-w-[150px]">
                          <p className="text-xs text-slate-400 uppercase font-semibold">Applied For</p>
                          <p className="font-medium text-sm text-slate-800 mt-0.5">{row.jobTitle}</p>
                          <div className="flex flex-col gap-1 mt-2">
                            <div className="flex items-center gap-1.5">
                              <Star size={12} className="text-amber-500" />
                              <span className="text-xs text-slate-600">Fit: <strong>{row.fitScore}</strong> ({row.level})</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <StatusPill label={row.studentIntegrityStatus || 'UNKNOWN'} />
                          <StatusPill label={row.verification} />
                          <StatusPill label={row.status} />
                          <div className="flex gap-2 mt-1">
                            <button className="btn-success text-xs px-3 py-1.5" onClick={() => handleStatusUpdate(row.applicationId, 'SHORTLISTED')}>
                              <CheckCircle2 size={13} /> Shortlist
                            </button>
                            <button className="btn-danger text-xs px-3 py-1.5" onClick={() => handleStatusUpdate(row.applicationId, 'REJECTED')}>
                              Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ANALYTICS ────────────────────────────────────────────────── */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 max-w-2xl">
              <SectionCard title="Analytics by Job" subtitle="Select a job to load recruitment analytics">
                <div className="flex items-center gap-3">
                  <select className="form-input flex-1" value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value ? Number(e.target.value) : '')}>
                    <option value="">Select a job posting...</option>
                    {myJobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
                  </select>
                  <button className="btn-primary flex-shrink-0" type="button"
                    onClick={() => selectedJobId ? loadAnalytics(selectedJobId).catch(() => setMessage('Failed to load analytics')) : undefined}
                    disabled={!selectedJobId}>
                    <BarChart3 size={16} /> Load
                  </button>
                </div>
                {analytics.distribution && (
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <StatCard label="Avg Fit Score"   value={analytics.average.toFixed(2)} icon={<Star size={18} />}        variant="indigo" />
                    <StatCard label="Selection Ratio" value={`${analytics.ratio.toFixed(1)}%`} icon={<TrendingUp size={18} />} variant="green" />
                    <StatCard label="Total Applied"   value={analytics.distribution.applied}     icon={<Users size={18} />}       variant="blue" />
                    <StatCard label="Shortlisted"     value={analytics.distribution.shortlisted} icon={<CheckCircle2 size={18} />} variant="green" />
                  </div>
                )}
              </SectionCard>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
