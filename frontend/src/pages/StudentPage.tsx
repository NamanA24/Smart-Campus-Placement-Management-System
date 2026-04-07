import { useEffect, useMemo, useState } from 'react';
import { IntegrityBadge } from '../components/IntegrityBadge';
import { SectionCard } from '../components/SectionCard';
import { StatusPill } from '../components/StatusPill';
import { Toast } from '../components/Toast';
import { Layout } from '../components/Layout';
import { applicationAPI, jobAPI, studentAPI } from '../services/api';
import type { ApplicationDTO, FitScoreResponse, Job, Student } from '../types/models';

export const StudentPage = () => {
  const [profile, setProfile] = useState<Student | null>(null);
  const [applications, setApplications] = useState<ApplicationDTO[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [fitScore, setFitScore] = useState<FitScoreResponse | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | ''>('');
  const [toastOpen, setToastOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const profileForm = useMemo(() => ({
    cgpa: profile?.cgpa ?? 0,
    skills: profile?.skills ?? '',
    projects: profile?.projects ?? '',
    resumeLink: profile?.resumeLink ?? '',
    phone: profile?.phone ?? '',
    university: profile?.university ?? '',
    graduationYear: profile?.graduationYear ?? new Date().getFullYear(),
  }), [profile]);

  const [formState, setFormState] = useState(profileForm);

  const loadData = async () => {
    const [profileRes, appsRes, jobsRes, fitRes] = await Promise.all([
      studentAPI.getProfile(),
      applicationAPI.getByStudent(),
      jobAPI.getAll(),
      studentAPI.getFitScore(),
    ]);

    const nextProfile = profileRes.data;

    if (profile && profile.integrityStatus !== 'TAMPERED' && nextProfile.integrityStatus === 'TAMPERED') {
      setToastOpen(true);
      setTimeout(() => setToastOpen(false), 5000);
    }

    setProfile(nextProfile);
    setFormState({
      cgpa: nextProfile.cgpa,
      skills: nextProfile.skills,
      projects: nextProfile.projects,
      resumeLink: nextProfile.resumeLink,
      phone: nextProfile.phone,
      university: nextProfile.university,
      graduationYear: nextProfile.graduationYear,
    });
    setApplications(appsRes.data);
    setJobs(jobsRes.data);
    setFitScore(fitRes.data);
  };

  useEffect(() => {
    loadData().catch(() => setError('Unable to load student dashboard data'));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      studentAPI
        .getProfile()
        .then((res) => {
          const nextProfile = res.data;
          if (profile && profile.integrityStatus !== 'TAMPERED' && nextProfile.integrityStatus === 'TAMPERED') {
            setToastOpen(true);
            setTimeout(() => setToastOpen(false), 5000);
          }
          setProfile(nextProfile);
        })
        .catch(() => undefined);
    }, 25000);

    return () => clearInterval(timer);
  }, [profile]);

  const handleUpdate = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await studentAPI.updateMine(formState);
      setProfile(res.data);
    } catch {
      setError('Profile update failed');
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
      setError('Re-sign failed');
    }
  };

  const handleApply = async () => {
    if (!selectedJobId) {
      return;
    }
    setError('');
    try {
      await applicationAPI.create(selectedJobId);
      const appsRes = await applicationAPI.getByStudent();
      setApplications(appsRes.data);
      setSelectedJobId('');
    } catch {
      setError('Job application failed. If profile is tampered, re-sign first.');
    }
  };

  if (!profile) {
    return (
      <Layout>
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-slate-600">Loading student dashboard...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Toast open={toastOpen} type="warning" message="Security alert: your profile was detected as tampered." />
      <div className="space-y-6">
        <SectionCard
          title={`Student Workspace: ${profile.name}`}
          subtitle={profile.email}
          right={<IntegrityBadge status={(profile.integrityStatus || 'UNSIGNED') as 'CLEAN' | 'TAMPERED' | 'UNSIGNED'} />}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Current Fit Score</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{fitScore?.score ?? 0}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Fit Level</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{fitScore?.level ?? 'N/A'}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Applications</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{applications.length}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Profile Management" subtitle="Update your profile and keep signature valid">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm text-slate-700">
              CGPA
              <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" type="number" step="0.1" value={formState.cgpa}
                onChange={(e) => setFormState((prev) => ({ ...prev, cgpa: Number(e.target.value) }))} />
            </label>
            <label className="text-sm text-slate-700">
              Phone
              <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={formState.phone}
                onChange={(e) => setFormState((prev) => ({ ...prev, phone: e.target.value }))} />
            </label>
            <label className="text-sm text-slate-700 md:col-span-2">
              Skills
              <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={formState.skills}
                onChange={(e) => setFormState((prev) => ({ ...prev, skills: e.target.value }))} />
            </label>
            <label className="text-sm text-slate-700 md:col-span-2">
              Projects
              <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={formState.projects}
                onChange={(e) => setFormState((prev) => ({ ...prev, projects: e.target.value }))} />
            </label>
            <label className="text-sm text-slate-700 md:col-span-2">
              Resume Link
              <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={formState.resumeLink}
                onChange={(e) => setFormState((prev) => ({ ...prev, resumeLink: e.target.value }))} />
            </label>
            <label className="text-sm text-slate-700">
              University
              <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={formState.university}
                onChange={(e) => setFormState((prev) => ({ ...prev, university: e.target.value }))} />
            </label>
            <label className="text-sm text-slate-700">
              Graduation Year
              <input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" type="number" value={formState.graduationYear}
                onChange={(e) => setFormState((prev) => ({ ...prev, graduationYear: Number(e.target.value) }))} />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button className="rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800" onClick={handleUpdate} disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
            <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100" onClick={handleResign}>
              Re-sign Profile
            </button>
          </div>
        </SectionCard>

        <SectionCard title="Apply to Jobs" subtitle="Apply using signed profile">
          <div className="flex flex-wrap items-center gap-3">
            <select
              className="min-w-[260px] rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Select a job</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} - {job.company?.name}
                </option>
              ))}
            </select>
            <button className="rounded-lg bg-secondary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-secondary-800" onClick={handleApply}>
              Submit Application
            </button>
          </div>
        </SectionCard>

        <SectionCard title="My Applications">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-600">
                  <th className="py-2 pr-4">Student</th>
                  <th className="py-2 pr-4">Job</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((item, idx) => (
                  <tr key={`${item.jobTitle}-${idx}`} className="border-b border-slate-100">
                    <td className="py-2 pr-4">{item.studentName}</td>
                    <td className="py-2 pr-4">{item.jobTitle}</td>
                    <td className="py-2 pr-4"><StatusPill label={item.status || 'APPLIED'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}
      </div>
    </Layout>
  );
};
