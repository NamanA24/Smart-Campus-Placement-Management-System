import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { SectionCard } from '../components/SectionCard';
import { StatusPill } from '../components/StatusPill';
import { applicationAPI, companyAPI, jobAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { ApplicationResponseDTO, Company, Job, StatusDistribution } from '../types/models';

export const CompanyPage = () => {
  const { user } = useAuth();
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<ApplicationResponseDTO[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | ''>('');
  const [analytics, setAnalytics] = useState<{ average: number; ratio: number; distribution: StatusDistribution | null }>({
    average: 0,
    ratio: 0,
    distribution: null,
  });
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobSkills, setJobSkills] = useState('');
  const [message, setMessage] = useState('');

  const myCompany = useMemo(() => {
    return allCompanies.find((c) => c.name === user?.username) || null;
  }, [allCompanies, user?.username]);

  const myJobs = useMemo(() => jobs.filter((j) => j.company?.name === user?.username), [jobs, user?.username]);

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
    if (!myCompany || !jobTitle || !jobDescription) {
      return;
    }

    await jobAPI.create({
      title: jobTitle,
      description: jobDescription,
      requiredSkills: jobSkills,
      company: { id: myCompany.id },
    });

    setJobTitle('');
    setJobDescription('');
    setJobSkills('');
    const jobsRes = await jobAPI.getAll();
    setJobs(jobsRes.data);
  };

  const loadAnalytics = async (jobId: number) => {
    const [averageRes, ratioRes, distributionRes] = await Promise.all([
      applicationAPI.getAnalyticsAverage(jobId),
      applicationAPI.getAnalyticsSelectionRatio(jobId),
      applicationAPI.getAnalyticsStatus(jobId),
    ]);

    setAnalytics({
      average: Number(averageRes.data || 0),
      ratio: Number(ratioRes.data || 0),
      distribution: distributionRes.data,
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        <SectionCard title={`Company Console: ${user?.username || 'Company'}`} subtitle="Manage jobs, screening, and analytics">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Open Jobs</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{myJobs.length}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Applications</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{applications.length}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Tampered Flagged</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{applications.filter((a) => a.verification === 'TAMPERED DATA').length}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Create Job Posting">
          <div className="grid gap-3 md:grid-cols-3">
            <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
            <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Description" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} />
            <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Required skills" value={jobSkills} onChange={(e) => setJobSkills(e.target.value)} />
          </div>
          <button className="mt-3 rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800" onClick={handleCreateJob}>
            Publish Job
          </button>
        </SectionCard>

        <SectionCard title="Applications and Verification">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-600">
                  <th className="py-2 pr-4">Student</th>
                  <th className="py-2 pr-4">Job</th>
                  <th className="py-2 pr-4">Fit Score</th>
                  <th className="py-2 pr-4">Integrity</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((row) => (
                  <tr key={row.applicationId} className="border-b border-slate-100">
                    <td className="py-2 pr-4">{row.studentName}</td>
                    <td className="py-2 pr-4">{row.jobTitle}</td>
                    <td className="py-2 pr-4">{row.fitScore}</td>
                    <td className="py-2 pr-4"><StatusPill label={row.verification} /></td>
                    <td className="py-2 pr-4"><StatusPill label={row.status} /></td>
                    <td className="py-2 pr-4">
                      <div className="flex gap-2">
                        <button className="rounded border border-emerald-300 px-2 py-1 text-xs font-semibold text-emerald-700" onClick={() => handleStatusUpdate(row.applicationId, 'SHORTLISTED')}>Shortlist</button>
                        <button className="rounded border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700" onClick={() => handleStatusUpdate(row.applicationId, 'REJECTED')}>Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Analytics by Job">
          <div className="flex flex-wrap items-center gap-3">
            <select className="min-w-[280px] rounded-lg border border-slate-300 px-3 py-2 text-sm" value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">Select job</option>
              {myJobs.map((job) => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
            <button className="rounded-lg bg-secondary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-secondary-800"
              onClick={() => {
                if (selectedJobId) {
                  loadAnalytics(selectedJobId).catch(() => setMessage('Failed to load analytics'));
                }
              }}>
              Load Analytics
            </button>
          </div>
          {analytics.distribution ? (
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-3 text-sm"><p className="text-slate-500">Average Score</p><p className="text-lg font-semibold">{analytics.average.toFixed(2)}</p></div>
              <div className="rounded-lg bg-slate-50 p-3 text-sm"><p className="text-slate-500">Selection Ratio</p><p className="text-lg font-semibold">{analytics.ratio.toFixed(2)}%</p></div>
              <div className="rounded-lg bg-slate-50 p-3 text-sm"><p className="text-slate-500">Applied</p><p className="text-lg font-semibold">{analytics.distribution.applied}</p></div>
              <div className="rounded-lg bg-slate-50 p-3 text-sm"><p className="text-slate-500">Shortlisted</p><p className="text-lg font-semibold">{analytics.distribution.shortlisted}</p></div>
            </div>
          ) : null}
        </SectionCard>

        {message ? <p className="text-sm font-medium text-rose-700">{message}</p> : null}
      </div>
    </Layout>
  );
};
