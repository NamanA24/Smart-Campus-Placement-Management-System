import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { StatCard } from '../components/StatCard';
import { SectionCard } from '../components/SectionCard';
import { JobCard } from '../components/JobCard';
import { ApplicationCard } from '../components/ApplicationCard';
import { Toast } from '../components/Toast';
import { IntegrityBadge } from '../components/IntegrityBadge';
import { applicationAPI, jobAPI, studentAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { ApplicationDTO, FitScoreResponse, Job, Student } from '../types/models';
import {
  Zap, FileText, Briefcase, User, ShieldAlert, ShieldCheck, Clock,
  Upload, Save, RefreshCw, BookOpen, AlertCircle, Bell, X, BellRing,
  MapPin, GraduationCap, ExternalLink, Lightbulb, CheckCircle2, Star,
} from 'lucide-react';

// ─── Circular completion ring (pure SVG — no extra dep) ─────────────────────
function CompletionRing({ pct, size = 120 }: { pct: number; size?: number }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct === 100 ? '#10B981' : pct >= 60 ? '#6366F1' : '#F59E0B';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1F5F9" strokeWidth={8} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s ease' }}
      />
    </svg>
  );
}

// ─── Notification System ────────────────────────────────────────────────────
interface AppNotif {
  id: string;
  type: 'new_job' | 'shortlisted' | 'rejected';
  title: string;
  body: string;
  timestamp: number;
}

const SEEN_JOBS_KEY  = (u: string) => `campus_seen_jobs_${u}`;
const PREV_STAT_KEY  = (u: string) => `campus_app_status_${u}`;
const NOTIFS_KEY     = (u: string) => `campus_notifs_${u}`;

function computeNewNotifs(jobs: Job[], applications: ApplicationDTO[], username: string): AppNotif[] {
  const raw = localStorage.getItem(SEEN_JOBS_KEY(username));
  const seenJobIds: number[] | null = raw ? JSON.parse(raw) : null;
  const prevStatuses: Record<string, string> = JSON.parse(
    localStorage.getItem(PREV_STAT_KEY(username)) || '{}'
  );
  const newNotifs: AppNotif[] = [];

  // New jobs (skip first ever visit so we don't flood)
  if (seenJobIds !== null) {
    const seenSet = new Set(seenJobIds);
    jobs.forEach((job) => {
      if (!seenSet.has(job.id)) {
        newNotifs.push({
          id: `job_${job.id}`,
          type: 'new_job',
          title: 'New Job Opening',
          body: `${job.company?.name || 'A company'} posted: ${job.title}`,
          timestamp: Date.now(),
        });
      }
    });
  }

  // Status changes (shortlisted / rejected)
  applications.forEach((app) => {
    const key = `${app.jobTitle}`;
    const prev = prevStatuses[key];
    const curr = (app.status || 'APPLIED').toUpperCase();
    if (prev && prev !== curr) {
      if (curr === 'SHORTLISTED') {
        newNotifs.push({
          id: `sl_${key}`,
          type: 'shortlisted',
          title: '🎉 You were Shortlisted!',
          body: `Your application for "${app.jobTitle}" has been shortlisted.`,
          timestamp: Date.now(),
        });
      } else if (curr === 'REJECTED') {
        newNotifs.push({
          id: `rj_${key}_${Date.now()}`,
          type: 'rejected',
          title: 'Application Update',
          body: `Your application for "${app.jobTitle}" was not selected this time.`,
          timestamp: Date.now(),
        });
      }
    }
  });

  // Persist updated state
  localStorage.setItem(SEEN_JOBS_KEY(username), JSON.stringify(jobs.map((j) => j.id)));
  const newStatuses: Record<string, string> = {};
  applications.forEach((app) => { newStatuses[app.jobTitle] = (app.status || 'APPLIED').toUpperCase(); });
  localStorage.setItem(PREV_STAT_KEY(username), JSON.stringify(newStatuses));

  return newNotifs;
}

function useNotifications(jobs: Job[], applications: ApplicationDTO[], username: string) {
  const [notifs, setNotifs] = useState<AppNotif[]>([]);
  const initialised = useRef(false);

  useEffect(() => {
    if (!username || (!jobs.length && !applications.length)) return;
    if (initialised.current) return; // only run once on initial data load
    initialised.current = true;

    const existing: AppNotif[] = JSON.parse(localStorage.getItem(NOTIFS_KEY(username)) || '[]');
    const fresh = computeNewNotifs(jobs, applications, username);
    const existingIds = new Set(existing.map((n) => n.id));
    const merged = [...existing, ...fresh.filter((n) => !existingIds.has(n.id))];
    localStorage.setItem(NOTIFS_KEY(username), JSON.stringify(merged));
    setNotifs(merged);
  }, [jobs, applications, username]);

  // Also re-check on polling (jobs/apps array reference changes)
  const checkForUpdates = (newJobs: Job[], newApps: ApplicationDTO[]) => {
    const existing: AppNotif[] = JSON.parse(localStorage.getItem(NOTIFS_KEY(username)) || '[]');
    const fresh = computeNewNotifs(newJobs, newApps, username);
    if (fresh.length === 0) return;
    const existingIds = new Set(existing.map((n) => n.id));
    const merged = [...existing, ...fresh.filter((n) => !existingIds.has(n.id))];
    localStorage.setItem(NOTIFS_KEY(username), JSON.stringify(merged));
    setNotifs(merged);
  };

  const dismiss = (id: string) => {
    const stored: AppNotif[] = JSON.parse(localStorage.getItem(NOTIFS_KEY(username)) || '[]');
    const updated = stored.filter((n) => n.id !== id);
    localStorage.setItem(NOTIFS_KEY(username), JSON.stringify(updated));
    setNotifs(updated);
  };

  const dismissAll = () => {
    localStorage.setItem(NOTIFS_KEY(username), '[]');
    setNotifs([]);
  };

  return { notifs, dismiss, dismissAll, checkForUpdates };
}

// ─── Profile validation ──────────────────────────────────────────────────────
function validateProfileForm(f: typeof EMPTY_FORM): string[] {
  const errs: string[] = [];
  const cgpa = Number(f.cgpa);
  if (f.cgpa === '') errs.push('CGPA is required');
  else if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) errs.push('CGPA must be between 0 and 10');
  if (!f.phone.trim())  errs.push('Phone number is required');
  else if (!/^\d+$/.test(f.phone)) errs.push('Phone must contain digits only');
  else if (f.phone.length > 10) errs.push('Phone number cannot exceed 10 digits');
  if (!f.university.trim()) errs.push('University is required');
  if (!f.skills.trim())     errs.push('Skills are required');
  if (!f.projects.trim())   errs.push('Projects are required');
  if (!f.resumeLink.trim()) errs.push('Resume link is required');
  if (!f.graduationYear)    errs.push('Graduation year is required');
  return errs;
}

const EMPTY_FORM = {
  cgpa: '' as string | number,
  skills: '', projects: '', resumeLink: '', phone: '', university: '',
  graduationYear: '' as string | number,
};

// ─── Tab label map ──────────────────────────────────────────────────────────
const TAB_LABELS: Record<string, string> = {
  '': 'Overview', 'profile': 'My Profile', 'jobs': 'Browse Jobs', 'applications': 'My Applications',
};

// ─── Page ───────────────────────────────────────────────────────────────────
export const StudentPage = () => {
  const { user } = useAuth();
  const username = user?.username ?? '';
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') ?? '';
  const setActiveTab = (id: string) => setSearchParams(id ? { tab: id } : {});

  const [profile, setProfile] = useState<Student | null>(null);
  const [applications, setApplications] = useState<ApplicationDTO[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [fitScore, setFitScore] = useState<FitScoreResponse | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [formState, setFormState] = useState(EMPTY_FORM);

  const { notifs, dismiss, dismissAll, checkForUpdates } = useNotifications(jobs, applications, username);

  const loadData = async () => {
    const [profileRes, appsRes, jobsRes, fitRes] = await Promise.all([
      studentAPI.getProfile(),
      applicationAPI.getByStudent(),
      jobAPI.getAll(),
      studentAPI.getFitScore(),
    ]);
    const p = profileRes.data;
    setProfile(p);
    setFormState({
      cgpa: p.cgpa ?? '',
      skills: p.skills ?? '',
      projects: p.projects ?? '',
      resumeLink: p.resumeLink ?? '',
      phone: p.phone ?? '',
      university: p.university ?? '',
      graduationYear: p.graduationYear ?? '',
    });
    setApplications(appsRes.data);
    setJobs(jobsRes.data);
    setFitScore(fitRes.data);
    return { apps: appsRes.data as ApplicationDTO[], jobs: jobsRes.data as Job[] };
  };

  useEffect(() => {
    loadData().catch(() => setError('Unable to load dashboard data'));
  }, []);

  // Polling — checks integrity AND application status changes
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const [profRes, appsRes, jobsRes] = await Promise.all([
          studentAPI.getProfile(),
          applicationAPI.getByStudent(),
          jobAPI.getAll(),
        ]);
        const next = profRes.data;
        if (profile && profile.integrityStatus !== 'TAMPERED' && next.integrityStatus === 'TAMPERED') {
          setToastOpen(true);
          setTimeout(() => setToastOpen(false), 5000);
        }
        setProfile(next);
        setApplications(appsRes.data);
        setJobs(jobsRes.data);
        checkForUpdates(jobsRes.data, appsRes.data);
      } catch {/* silent */}
    }, 30000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleUpdate = async () => {
    const errs = validateProfileForm(formState);
    if (errs.length > 0) { setFormErrors(errs); return; }
    setFormErrors([]);
    setSaving(true);
    setError('');
    try {
      const res = await studentAPI.updateMine({
        ...formState,
        cgpa: Number(formState.cgpa),
        graduationYear: Number(formState.graduationYear),
      });
      setProfile(res.data);
    } catch {
      setError('Profile update failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleResign = async () => {
    setError('');
    try {
      const res = await studentAPI.resign();
      setProfile(res.data);
    } catch {
      setError('Re-sign failed. Please try again.');
    }
  };

  const handleApply = async (jobId: number) => {
    setError('');
    try {
      await applicationAPI.create(jobId);
      const appsRes = await applicationAPI.getByStudent();
      setApplications(appsRes.data);
    } catch {
      setError('Application failed. If your profile is tampered, please re-sign it first.');
    }
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) return;
    setError('');
    setUploadingResume(true);
    try {
      const res = await studentAPI.uploadResume(resumeFile);
      setProfile(res.data);
      setFormState((prev) => ({ ...prev, resumeLink: res.data.resumeLink || '' }));
      setResumeFile(null);
    } catch {
      setError('Resume upload failed.');
    } finally {
      setUploadingResume(false);
    }
  };

  const appliedJobIds = useMemo(
    () => new Set(applications.map((a) => jobs.find((j) => j.title === a.jobTitle)?.id).filter(Boolean)),
    [applications, jobs],
  );

  const completionItems = [
    { label: 'CGPA Set',         done: !!profile?.cgpa },
    { label: 'Skills Added',     done: !!profile?.skills },
    { label: 'Resume Uploaded',  done: !!profile?.resumeLink },
    { label: 'Phone Number',     done: !!profile?.phone },
    { label: 'University',       done: !!profile?.university },
  ];
  const completionPct = Math.round((completionItems.filter((x) => x.done).length / completionItems.length) * 100);

  const integrityStatus = profile?.integrityStatus || 'UNSIGNED';
  const intCfg = {
    CLEAN:   { cls: 'bg-emerald-50 border-emerald-200 text-emerald-800', icon: <ShieldCheck size={16} className="text-emerald-600" />, label: 'Profile Verified' },
    TAMPERED:{ cls: 'bg-rose-50 border-rose-200 text-rose-800',          icon: <ShieldAlert size={16} className="text-rose-600" />,    label: '⚠ Profile Tampered — Re-sign Required' },
    UNSIGNED:{ cls: 'bg-amber-50 border-amber-200 text-amber-800',       icon: <Clock size={16} className="text-amber-600" />,         label: 'Profile Unsigned' },
  }[integrityStatus as 'CLEAN' | 'TAMPERED' | 'UNSIGNED'] ?? { cls: 'bg-amber-50 border-amber-200 text-amber-800', icon: null, label: '' };

  const sectionTitle = TAB_LABELS[activeTab] ?? 'Overview';
  const unreadCount = notifs.length;

  if (!profile) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-500 text-sm">Loading student dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Toast open={toastOpen} type="warning" message="Security alert: your profile was detected as tampered." />

      <div className="flex flex-col h-full">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="bg-white border-b border-slate-200 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {sectionTitle}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Welcome back, <span className="font-medium text-slate-700">{profile.name}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Notification bell */}
              {unreadCount > 0 && (
                <button
                  onClick={() => setActiveTab('')}
                  className="relative p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors"
                  title="View notifications"
                >
                  <BellRing size={20} className="text-indigo-600 animate-pulse" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                </button>
              )}
              <IntegrityBadge status={integrityStatus as any} />
            </div>
          </div>
        </div>

        {/* ── Content ────────────────────────────────────────────────────── */}
        <div className="flex-1 p-6 animate-fadeIn">
          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
              <AlertCircle size={16} className="flex-shrink-0" /> {error}
            </div>
          )}

          {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
          {activeTab === '' && (
            <div className="space-y-6">
              {/* Integrity banner */}
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${intCfg.cls}`}>
                {intCfg.icon}
                <span className="text-sm font-medium">{intCfg.label}</span>
              </div>

              {/* ── Notifications ─────────────────────────────────────────── */}
              {notifs.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Bell size={15} className="text-indigo-500" />
                      Notifications
                      <span className="bg-rose-100 text-rose-600 text-xs font-bold px-2 py-0.5 rounded-full">{notifs.length}</span>
                    </h3>
                    <button onClick={dismissAll} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                      Clear all
                    </button>
                  </div>
                  <div className="space-y-2">
                    {notifs.map((notif) => (
                      <div
                        key={notif.id}
                        className={`page-card p-4 flex items-start gap-3 border-l-4 ${
                          notif.type === 'shortlisted' ? 'border-l-emerald-400 bg-emerald-50/30' :
                          notif.type === 'rejected'    ? 'border-l-rose-400 bg-rose-50/30' :
                                                         'border-l-indigo-400 bg-indigo-50/30'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          notif.type === 'shortlisted' ? 'bg-emerald-100' :
                          notif.type === 'rejected'    ? 'bg-rose-100' : 'bg-indigo-100'
                        }`}>
                          {notif.type === 'shortlisted' ? <ShieldCheck size={16} className="text-emerald-600" /> :
                           notif.type === 'rejected'    ? <ShieldAlert size={16} className="text-rose-600" /> :
                                                          <Briefcase size={16} className="text-indigo-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-800">{notif.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{notif.body}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(notif.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <button onClick={() => dismiss(notif.id)} className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0">
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Fit Score"    value={fitScore?.score ?? 0} icon={<Zap size={18} />}        variant="indigo" sublabel={`Level: ${fitScore?.level ?? 'N/A'}`} />
                <StatCard label="Applications" value={applications.length}  icon={<FileText size={18} />}   variant="blue" />
                <StatCard label="Open Jobs"    value={jobs.length}          icon={<Briefcase size={18} />}  variant="default" />
              </div>

              {/* Profile readiness */}
              <SectionCard title="Profile Readiness" subtitle="Complete your profile to improve your fit score">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${completionPct}%`,
                          background: completionPct === 100
                            ? 'linear-gradient(90deg, #10B981, #34D399)'
                            : 'linear-gradient(90deg, #6366F1, #8B5CF6)',
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-700 w-12 text-right">{completionPct}%</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {completionItems.map((item) => (
                      <div key={item.label}
                        className={`text-xs font-medium px-3 py-2 rounded-lg text-center ${
                          item.done
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {item.done ? '✓ ' : ''}{item.label}
                      </div>
                    ))}
                  </div>
                </div>
              </SectionCard>

              {/* Quick actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={() => setActiveTab('jobs')} className="page-card px-5 py-4 flex items-center gap-4 hover:shadow-card-hover transition-all duration-200 text-left">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Briefcase size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Browse Open Jobs</p>
                    <p className="text-xs text-slate-500 mt-0.5">{jobs.length} job{jobs.length !== 1 ? 's' : ''} available</p>
                  </div>
                </button>
                <button onClick={() => setActiveTab('profile')} className="page-card px-5 py-4 flex items-center gap-4 hover:shadow-card-hover transition-all duration-200 text-left">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <User size={20} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Update Profile</p>
                    <p className="text-xs text-slate-500 mt-0.5">Keep your info current and signed</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ── MY PROFILE ───────────────────────────────────────────────── */}
          {activeTab === 'profile' && (() => {
            // Context-aware tips
            const tips: { icon: React.ReactNode; text: string; color: string }[] = [];
            if (!profile.skills)     tips.push({ icon: <Star size={14} />,         text: 'Add your skills to improve your Fit Score significantly.', color: 'text-indigo-600 bg-indigo-50 border-indigo-200' });
            if (!profile.resumeLink) tips.push({ icon: <Upload size={14} />,        text: 'Upload a resume — companies look for this first.', color: 'text-amber-600 bg-amber-50 border-amber-200' });
            if (!profile.phone)      tips.push({ icon: <AlertCircle size={14} />,   text: 'Add your phone number so companies can reach you.', color: 'text-orange-600 bg-orange-50 border-orange-200' });
            if (integrityStatus === 'TAMPERED') tips.push({ icon: <ShieldAlert size={14} />, text: 'Your profile is tampered. Re-sign it immediately to apply for jobs.', color: 'text-rose-600 bg-rose-50 border-rose-200' });
            if (integrityStatus === 'UNSIGNED') tips.push({ icon: <Clock size={14} />,        text: 'Click "Re-sign Profile" to verify your data integrity.', color: 'text-amber-600 bg-amber-50 border-amber-200' });
            if (tips.length === 0)   tips.push({ icon: <CheckCircle2 size={14} />,  text: 'Your profile looks great! Keep applying to open positions.', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' });

            const profileSkills = (profile.skills || '').split(',').map(s => s.trim()).filter(Boolean);
            const safeResume = profile.resumeLink?.startsWith('http') ? profile.resumeLink : null;

            return (
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">

                {/* ── LEFT: Edit Form ──────────────────────────────────── */}
                <div className="space-y-6">
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${intCfg.cls}`}>
                    {intCfg.icon}
                    <span className="text-sm font-medium">{intCfg.label}</span>
                  </div>

                  {formErrors.length > 0 && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                      {formErrors.map((e, i) => (
                        <p key={i} className="text-sm text-rose-700 flex items-center gap-2">
                          <AlertCircle size={14} className="flex-shrink-0" /> {e}
                        </p>
                      ))}
                    </div>
                  )}

                  <SectionCard title="Personal Information">
                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label className="form-label">CGPA <span className="text-rose-500">*</span></label>
                        <input className="form-input" type="number" step="0.01" min="0" max="10" placeholder="0.00 – 10.00"
                          value={formState.cgpa}
                          onChange={(e) => setFormState((prev) => ({ ...prev, cgpa: e.target.value }))} />
                      </div>
                      <div>
                        <label className="form-label">
                          Phone Number <span className="text-rose-500">*</span>
                          {String(formState.phone).length > 0 && (
                            <span className={`ml-2 text-xs ${String(formState.phone).length > 10 ? 'text-rose-500 font-semibold' : 'text-slate-400'}`}>
                              {String(formState.phone).replace(/\D/g, '').length}/10
                            </span>
                          )}
                        </label>
                        <input className="form-input" type="tel" placeholder="10-digit mobile number" maxLength={10}
                          value={formState.phone}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setFormState((prev) => ({ ...prev, phone: val }));
                          }} />
                        {formState.phone && String(formState.phone).length < 10 && (
                          <p className="text-xs text-amber-600 mt-1">Phone must be exactly 10 digits</p>
                        )}
                      </div>
                      <div>
                        <label className="form-label">University <span className="text-rose-500">*</span></label>
                        <input className="form-input" placeholder="e.g., IIT Delhi"
                          value={formState.university}
                          onChange={(e) => setFormState((prev) => ({ ...prev, university: e.target.value }))} />
                      </div>
                      <div>
                        <label className="form-label">Graduation Year <span className="text-rose-500">*</span></label>
                        <input className="form-input" type="number" placeholder={String(new Date().getFullYear())}
                          value={formState.graduationYear}
                          onChange={(e) => setFormState((prev) => ({ ...prev, graduationYear: e.target.value }))} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="form-label">Skills (comma-separated) <span className="text-rose-500">*</span></label>
                        <input className="form-input" placeholder="e.g., Java, Spring Boot, React"
                          value={formState.skills}
                          onChange={(e) => setFormState((prev) => ({ ...prev, skills: e.target.value }))} />
                        {formState.skills && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {String(formState.skills).split(',').map((s, i) => s.trim() && (
                              <span key={i} className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">{s.trim()}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className="form-label">Projects <span className="text-rose-500">*</span></label>
                        <input className="form-input" placeholder="Brief description of your projects"
                          value={formState.projects}
                          onChange={(e) => setFormState((prev) => ({ ...prev, projects: e.target.value }))} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="form-label">Resume Link (URL) <span className="text-rose-500">*</span></label>
                        <input className="form-input" type="url" placeholder="https://drive.google.com/..."
                          value={formState.resumeLink}
                          onChange={(e) => setFormState((prev) => ({ ...prev, resumeLink: e.target.value }))} />
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard title="Resume Upload" subtitle="Upload a PDF/Word file to update your resume">
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center gap-3 text-center hover:border-indigo-300 transition-colors">
                      <Upload size={28} className="text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Drop your resume here or browse</p>
                        <p className="text-xs text-slate-400 mt-0.5">PDF, DOC, DOCX accepted</p>
                      </div>
                      <input type="file" accept=".pdf,.doc,.docx"
                        onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                        className="hidden" id="resume-upload" />
                      <label htmlFor="resume-upload" className="btn-secondary cursor-pointer text-sm">Browse File</label>
                      {resumeFile && <p className="text-sm text-indigo-700 font-medium">{resumeFile.name}</p>}
                      {safeResume && (
                        <a href={safeResume} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                          View Current Resume →
                        </a>
                      )}
                    </div>
                    <div className="mt-3">
                      <button className="btn-primary" onClick={handleResumeUpload} disabled={!resumeFile || uploadingResume} type="button">
                        <Upload size={16} />
                        {uploadingResume ? 'Uploading...' : 'Upload Resume'}
                      </button>
                    </div>
                  </SectionCard>

                  <div className="flex flex-wrap gap-3">
                    <button className="btn-primary" onClick={handleUpdate} disabled={saving} type="button">
                      <Save size={16} />
                      {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                    <button className="btn-secondary" onClick={handleResign} type="button">
                      <RefreshCw size={16} />
                      Re-sign Profile
                    </button>
                  </div>
                </div>

                {/* ── RIGHT: Panel ─────────────────────────────────────── */}
                <div className="space-y-4 xl:sticky xl:top-6 self-start mt-[52px] xl:mt-0">

                  {/* ── 1. Recruiter Preview Card ─────────────────────── */}
                  <div className="page-card">
                    {/* Gradient banner */}
                    <div className="h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-violet-600 relative rounded-t-xl overflow-hidden">
                      <div className="absolute inset-0 opacity-20"
                        style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, white 1px, transparent 1px), radial-gradient(circle at 70% 80%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
                      {/* Integrity badge top-right */}
                      <div className="absolute top-3 right-3">
                        {integrityStatus === 'CLEAN' && (
                          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm border border-white/30">
                            <ShieldCheck size={11} /> Verified
                          </span>
                        )}
                        {integrityStatus === 'TAMPERED' && (
                          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/80 text-white">
                            <ShieldAlert size={11} /> Tampered
                          </span>
                        )}
                        {integrityStatus === 'UNSIGNED' && (
                          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/80 text-white">
                            <Clock size={11} /> Unsigned
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Avatar + name */}
                    <div className="px-5 pb-5">
                      <div className="-mt-7 mb-3">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-xl shadow-lg border-2 border-white">
                          {profile.name?.charAt(0)?.toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{profile.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{profile.email}</p>
                      </div>


                      {/* Meta row */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                        {profile.university && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <MapPin size={11} className="text-slate-400" />{profile.university}
                          </span>
                        )}
                        {profile.graduationYear && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <GraduationCap size={11} className="text-slate-400" />Class of {profile.graduationYear}
                          </span>
                        )}
                      </div>

                      {/* CGPA + Applications mini-stats */}
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <div className="bg-slate-50 rounded-xl px-3 py-2.5 text-center border border-slate-100">
                          <p className="text-xs text-slate-400 font-medium">CGPA</p>
                          <p className="font-bold text-slate-800 text-lg leading-tight">{profile.cgpa ?? '—'}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl px-3 py-2.5 text-center border border-slate-100">
                          <p className="text-xs text-slate-400 font-medium">Applied</p>
                          <p className="font-bold text-slate-800 text-lg leading-tight">{applications.length}</p>
                        </div>
                      </div>

                      {/* Skills cloud */}
                      {profileSkills.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Skills</p>
                          <div className="flex flex-wrap gap-1.5">
                            {profileSkills.map((s, i) => (
                              <span key={i}
                                className="text-xs px-2.5 py-1 rounded-full font-medium"
                                style={{
                                  background: ['#EEF2FF','#F0FDF4','#FFF7ED','#FDF2F8','#F0F9FF'][i % 5],
                                  color:      ['#4338CA','#15803D','#C2410C','#9D174D','#0369A1'][i % 5],
                                  border: `1px solid ${['#C7D2FE','#BBF7D0','#FED7AA','#FBCFE8','#BAE6FD'][i % 5]}`,
                                }}
                              >{s}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Resume link */}
                      {safeResume && (
                        <a href={safeResume} target="_blank" rel="noreferrer"
                          className="mt-4 flex items-center justify-center gap-2 w-full py-2 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors">
                          <ExternalLink size={13} /> View Resume
                        </a>
                      )}
                    </div>
                  </div>

                  {/* ── 2. Profile Completion Ring ───────────────────── */}
                  <div className="page-card p-5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Profile Completion</p>
                    <div className="flex items-center gap-4">
                      <div className="relative flex-shrink-0">
                        <CompletionRing pct={completionPct} size={88} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold text-slate-800">{completionPct}%</span>
                        </div>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        {completionItems.map((item) => (
                          <div key={item.label} className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                              item.done ? 'bg-emerald-100' : 'bg-slate-100'
                            }`}>
                              {item.done
                                ? <CheckCircle2 size={12} className="text-emerald-600" />
                                : <div className="w-2 h-2 rounded-full bg-slate-300" />}
                            </div>
                            <span className={`text-xs font-medium ${
                              item.done ? 'text-slate-700' : 'text-slate-400'
                            }`}>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ── 3. Context-Aware Tips ────────────────────────── */}
                  <div className="page-card p-4 space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                      <Lightbulb size={13} className="text-amber-500" /> Tips for You
                    </p>
                    <div className="space-y-2">
                      {tips.map((tip, i) => (
                        <div key={i} className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-xs ${tip.color}`}>
                          <span className="flex-shrink-0 mt-0.5">{tip.icon}</span>
                          <span className="leading-relaxed">{tip.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>{/* end right panel */}
              </div>
            );
          })()}


          {/* ── BROWSE JOBS ──────────────────────────────────────────────── */}
          {activeTab === 'jobs' && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-slate-700">
                {jobs.length} Job{jobs.length !== 1 ? 's' : ''} Available
              </h2>
              {jobs.length === 0 ? (
                <div className="page-card p-12 text-center">
                  <BookOpen size={40} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No jobs posted yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {jobs.map((job) => (
                    <JobCard key={job.id} job={job} alreadyApplied={appliedJobIds.has(job.id)} onApply={handleApply} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── MY APPLICATIONS ──────────────────────────────────────────── */}
          {activeTab === 'applications' && (
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-slate-700">
                {applications.length} Application{applications.length !== 1 ? 's' : ''}
              </h2>
              {applications.length === 0 ? (
                <div className="page-card p-12 text-center">
                  <FileText size={40} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No applications yet</p>
                  <button onClick={() => setActiveTab('jobs')} className="mt-3 text-indigo-600 hover:text-indigo-800 font-medium text-sm">
                    Browse jobs →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((app, idx) => (
                    <ApplicationCard key={`${app.jobTitle}-${idx}`} studentName={app.studentName} jobTitle={app.jobTitle} status={app.status || 'APPLIED'} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
