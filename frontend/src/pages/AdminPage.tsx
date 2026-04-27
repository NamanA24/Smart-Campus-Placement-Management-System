import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Layout } from '../components/Layout';
import { StatCard } from '../components/StatCard';
import { SectionCard } from '../components/SectionCard';
import { StatusPill } from '../components/StatusPill';
import { auditAPI, companyAPI, jobAPI, studentAPI, tpaAPI } from '../services/api';
import type { Company, Job, Student } from '../types/models';
import { validateCompanyFields, validateStudentFields } from '../utils/validation';
import {
  GraduationCap, Building2, Briefcase, ShieldAlert, ShieldCheck,
  Plus, Play, Terminal, ExternalLink,
  Clock, AlertTriangle, AlertCircle,
} from 'lucide-react';

const INTEGRITY_COLORS: Record<string, string> = {
  CLEAN:    '#10B981',
  TAMPERED: '#F43F5E',
  UNSIGNED: '#F59E0B',
};

function validateJobForm(companyId: number, title: string, description: string): string[] {
  const errs: string[] = [];
  if (!companyId) errs.push('Please select a company');
  if (!title.trim())       errs.push('Job title is required');
  if (!description.trim()) errs.push('Job description is required');
  return errs;
}

const EMPTY_STUDENT = {
  name: '', email: '', password: 'dev', branch: '', gender: '',
  cgpa: '' as string | number, skills: '', projects: '', resumeLink: '', phone: '',
  university: '', graduationYear: '' as string | number,
};

const EMPTY_COMPANY = { name: '', password: 'admin', role: '', packageOffered: '' as string | number };
const EMPTY_JOB = { title: '', description: '', requiredSkills: '', companyId: 0 };

export const AdminPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'overview';
  const setActiveTab = (id: string) => setSearchParams(id ? { tab: id } : {});

  const [students,  setStudents]  = useState<Student[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs,      setJobs]      = useState<Job[]>([]);
  const [tpaOutput,    setTpaOutput]    = useState<string[]>([]);
  const [auditRunning, setAuditRunning] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  const [studentForm,  setStudentForm]  = useState(EMPTY_STUDENT);
  const [companyForm,  setCompanyForm]  = useState(EMPTY_COMPANY);
  const [jobForm,      setJobForm]      = useState(EMPTY_JOB);

  const [errors,       setErrors]       = useState<string[]>([]);
  const [studentErrs,  setStudentErrs]  = useState<string[]>([]);
  const [companyErrs,  setCompanyErrs]  = useState<string[]>([]);
  const [jobErrs,      setJobErrs]      = useState<string[]>([]);

  const loadData = async () => {
    const [studentsRes, companiesRes, jobsRes, auditRes] = await Promise.all([
      studentAPI.getAll(),
      companyAPI.getAll(),
      jobAPI.getAll(),
      auditAPI.getAll(),
    ]);
    setStudents(studentsRes.data);
    setCompanies(companiesRes.data);
    setJobs(jobsRes.data);
    setLogs(auditRes.data);
  };

  useEffect(() => {
    loadData().catch(() => setErrors(['Failed to load admin data']));
  }, []);

  const tamperedCount = useMemo(
    () => students.filter((s) => (s.integrityStatus || '').toUpperCase() === 'TAMPERED').length,
    [students],
  );

  // ── Chart data ─────────────────────────────────────────────────────────────
  const integrityCounts = useMemo(() => {
    const clean    = students.filter((s) => (s.integrityStatus || '').toUpperCase() === 'CLEAN').length;
    const tampered = students.filter((s) => (s.integrityStatus || '').toUpperCase() === 'TAMPERED').length;
    const unsigned = students.filter((s) => !['CLEAN','TAMPERED'].includes((s.integrityStatus || '').toUpperCase())).length;
    return [
      { name: 'Clean',    value: clean,    color: INTEGRITY_COLORS.CLEAN },
      { name: 'Tampered', value: tampered, color: INTEGRITY_COLORS.TAMPERED },
      { name: 'Unsigned', value: unsigned, color: INTEGRITY_COLORS.UNSIGNED },
    ].filter((d) => d.value > 0);
  }, [students]);

  const jobsPerCompanyData = useMemo(() => {
    const map: Record<string, number> = {};
    jobs.forEach((j) => {
      const name = j.company?.name || 'Unknown';
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name: name.length > 12 ? name.slice(0, 12) + '…' : name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [jobs]);

  // ── CRUD helpers ───────────────────────────────────────────────────────────
  const createStudent = async () => {
    const errs = validateStudentFields(studentForm, {
      requirePassword: false,
      requireProjects: false,
      requireResumeLink: false,
    });
    if (errs.length > 0) { setStudentErrs(errs); return; }
    setStudentErrs([]);
    try {
      await studentAPI.create({
        ...studentForm,
        cgpa: Number(studentForm.cgpa),
        graduationYear: Number(studentForm.graduationYear) || new Date().getFullYear(),
      });
      setStudentForm(EMPTY_STUDENT);
      await loadData();
    } catch {
      setErrors((prev) => ['Failed to create student', ...prev]);
    }
  };

  const createCompany = async () => {
    const errs = validateCompanyFields(companyForm);
    if (errs.length > 0) { setCompanyErrs(errs); return; }
    setCompanyErrs([]);
    try {
      await companyAPI.create({ ...companyForm, packageOffered: Number(companyForm.packageOffered) || 0 });
      setCompanyForm(EMPTY_COMPANY);
      await loadData();
    } catch {
      setErrors((prev) => ['Failed to create company', ...prev]);
    }
  };

  const createJob = async () => {
    const errs = validateJobForm(jobForm.companyId, jobForm.title, jobForm.description);
    if (errs.length > 0) { setJobErrs(errs); return; }
    setJobErrs([]);
    try {
      await jobAPI.create({ title: jobForm.title, description: jobForm.description, requiredSkills: jobForm.requiredSkills, company: { id: jobForm.companyId } });
      setJobForm(EMPTY_JOB);
      await loadData();
    } catch {
      setErrors((prev) => ['Failed to create job', ...prev]);
    }
  };

  const runAudit = async () => {
    setAuditRunning(true);
    setTpaOutput([]);
    try {
      const res = await tpaAPI.runAudit();
      setTpaOutput(res.data);
      await loadData();
    } catch {
      setTpaOutput(['TPA audit failed to execute.']);
    } finally {
      setAuditRunning(false);
    }
  };

  const recentLogs = [...logs].reverse().slice(0, 5);

  // ── Shared error block ─────────────────────────────────────────────────────
  const FormErrors = ({ errs }: { errs: string[] }) =>
    errs.length === 0 ? null : (
      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
        {errs.map((e, i) => (
          <p key={i} className="text-sm text-rose-700 flex items-center gap-2">
            <AlertCircle size={14} className="flex-shrink-0" /> {e}
          </p>
        ))}
      </div>
    );

  return (
    <Layout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Admin Command Center</h1>
              <p className="text-sm text-slate-500 mt-0.5">Provision accounts, manage data, run security audits</p>
            </div>
            <button onClick={runAudit} disabled={auditRunning} className="btn-primary" type="button">
              <Play size={16} />
              {auditRunning ? 'Running Audit...' : 'Run TPA Audit'}
            </button>
          </div>
        </div>


        <div className="flex-1 p-6 animate-fadeIn">
          {errors.length > 0 && (
            <div className="mb-4 space-y-1">
              {errors.map((e, i) => <div key={i} className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">{e}</div>)}
            </div>
          )}

          {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total Students"    value={students.length}    icon={<GraduationCap size={18} />} variant="blue" />
                <StatCard label="Companies"         value={companies.length}   icon={<Building2 size={18} />}    variant="indigo" />
                <StatCard label="Job Postings"      value={jobs.length}        icon={<Briefcase size={18} />}    variant="default" />
                <StatCard label="Tampered Profiles" value={tamperedCount}      icon={<ShieldAlert size={18} />}
                  variant={tamperedCount > 0 ? 'red' : 'green'}
                  sublabel={tamperedCount === 0 ? 'All clean' : `${tamperedCount} require attention`} />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Student Integrity Pie */}
                {integrityCounts.length > 0 && (
                  <SectionCard title="Student Profile Integrity" subtitle="Digital signature health across all students">
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie dataKey="value" data={integrityCounts} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4}>
                            {integrityCounts.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip formatter={(val: any) => [`${val} students`, '']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {integrityCounts.map((item) => (
                        <div key={item.name} className="rounded-xl border border-slate-100 px-3 py-2 text-center">
                          <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ background: item.color }} />
                          <p className="font-bold text-slate-800">{item.value}</p>
                          <p className="text-xs text-slate-500">{item.name}</p>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {/* Jobs per Company Bar */}
                {jobsPerCompanyData.length > 0 && (
                  <SectionCard title="Jobs Posted per Company" subtitle="Top companies by number of openings">
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={jobsPerCompanyData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                          <Tooltip formatter={(val: any) => [`${val} jobs`, '']} />
                          <Bar dataKey="count" fill="#6366F1" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </SectionCard>
                )}
              </div>

              {/* Quick actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Add Student', icon: <GraduationCap size={20} />, tab: 'students', cls: 'bg-blue-100 text-blue-600' },
                  { label: 'Add Company', icon: <Building2 size={20} />,     tab: 'companies', cls: 'bg-indigo-100 text-indigo-600' },
                  { label: 'Add Job',     icon: <Briefcase size={20} />,     tab: 'jobs',      cls: 'bg-purple-100 text-purple-600' },
                ].map((action) => (
                  <button key={action.tab} onClick={() => setActiveTab(action.tab)}
                    className="page-card p-5 flex items-center gap-4 hover:shadow-card-hover transition-all duration-200 text-left">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.cls}`}>{action.icon}</div>
                    <p className="font-semibold text-slate-800">{action.label}</p>
                  </button>
                ))}
              </div>

              {/* Recent audit */}
              <SectionCard title="Recent Activity">
                <div className="space-y-3">
                  {recentLogs.length === 0
                    ? <p className="text-sm text-slate-400">No audit events yet.</p>
                    : recentLogs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                        <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{log.action}</p>
                          <p className="text-xs text-slate-500 mt-0.5">By: {log.performedBy} · {log.details}</p>
                        </div>
                        <span className="text-xs text-slate-400 flex-shrink-0 flex items-center gap-1">
                          <Clock size={11} />{log.timestamp?.split('T')[0]}
                        </span>
                      </div>
                    ))}
                </div>
              </SectionCard>
            </div>
          )}

          {/* ── STUDENTS ─────────────────────────────────────────────────── */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              <SectionCard title="Add New Student" subtitle="All fields marked * are required">
                <FormErrors errs={studentErrs} />
                <div className="grid gap-4 md:grid-cols-3 mt-4">
                  {[
                    { label: 'Full Name *',  key: 'name',       type: 'text',   placeholder: 'Jane Doe' },
                    { label: 'Email *',      key: 'email',      type: 'email',  placeholder: 'jane@university.edu' },
                    { label: 'Branch *',     key: 'branch',     type: 'text',   placeholder: 'Computer Science' },
                    { label: 'CGPA *',       key: 'cgpa',       type: 'number', placeholder: '8.5' },
                    { label: 'University *', key: 'university', type: 'text',   placeholder: 'IIT Delhi' },
                    { label: 'Skills *',     key: 'skills',     type: 'text',   placeholder: 'Java, Python, SQL' },
                    { label: 'Projects',     key: 'projects',   type: 'text',   placeholder: 'Describe your projects' },
                  ].map((field) => (
                    <div key={field.key}>
                      <label className="form-label">{field.label}</label>
                      <input className="form-input" type={field.type} placeholder={field.placeholder}
                        value={String((studentForm as any)[field.key])}
                        onChange={(e) => {
                          const nextValue = field.key === 'name'
                            ? e.target.value.replace(/[^A-Za-z\s]/g, '')
                            : e.target.value;
                          setStudentForm((prev) => ({ ...prev, [field.key]: nextValue }));
                        }} />
                    </div>
                  ))}
                  <div>
                    <label className="form-label">
                      Phone *
                      {studentForm.phone.length > 0 && (
                        <span className={`ml-2 text-xs ${studentForm.phone.length > 10 ? 'text-rose-500 font-semibold' : 'text-slate-400'}`}>
                          {studentForm.phone.length}/10
                        </span>
                      )}
                    </label>
                    <input className="form-input" type="tel" placeholder="10-digit number" maxLength={10}
                      value={studentForm.phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setStudentForm((prev) => ({ ...prev, phone: val }));
                      }} />
                  </div>
                  <div>
                    <label className="form-label">Gender *</label>
                    <select className="form-input" value={studentForm.gender}
                      onChange={(e) => setStudentForm((prev) => ({ ...prev, gender: e.target.value }))}>
                      <option value="">Select gender</option>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Graduation Year</label>
                    <input className="form-input" type="number" placeholder={String(new Date().getFullYear())}
                      value={studentForm.graduationYear}
                      onChange={(e) => setStudentForm((prev) => ({ ...prev, graduationYear: e.target.value }))} />
                  </div>
                </div>
                <div className="mt-4">
                  <button className="btn-primary" onClick={createStudent} type="button">
                    <Plus size={16} /> Create Student
                  </button>
                </div>
              </SectionCard>

              <div className="page-card overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900">{students.length} Students</h2>
                  {tamperedCount > 0 && (
                    <span className="flex items-center gap-1.5 pill pill-red">
                      <AlertTriangle size={12} /> {tamperedCount} tampered
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr><th>Name</th><th>Email</th><th>Branch</th><th>CGPA</th><th>University</th><th>Resume</th><th>Integrity</th></tr>
                    </thead>
                    <tbody>
                      {students.map((student) => {
                        const safeResume = student.resumeLink && student.resumeLink.startsWith('http') ? student.resumeLink : null;
                        return (
                          <tr key={student.id}>
                            <td className="font-medium">{student.name}</td>
                            <td className="text-slate-500">{student.email}</td>
                            <td>{student.branch}</td>
                            <td><span className="font-semibold">{student.cgpa}</span></td>
                            <td className="text-slate-500">{student.university}</td>
                            <td>
                              {safeResume
                                ? <a href={safeResume} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-xs font-medium"><ExternalLink size={12} />Open</a>
                                : <span className="text-slate-400 text-xs">—</span>}
                            </td>
                            <td><StatusPill label={student.integrityStatus || 'UNSIGNED'} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── COMPANIES ────────────────────────────────────────────────── */}
          {activeTab === 'companies' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <SectionCard title="Add Company" subtitle="All fields marked * are required">
                  <div className="space-y-4">
                    <FormErrors errs={companyErrs} />
                    <div>
                      <label className="form-label">Company Name *</label>
                      <input className="form-input" placeholder="Acme Corp"
                        value={companyForm.name} onChange={(e) => setCompanyForm((prev) => ({ ...prev, name: e.target.value.replace(/[^A-Za-z\s]/g, '') }))} />
                    </div>
                    <div>
                      <label className="form-label">Role / Department *</label>
                      <input className="form-input" placeholder="Software Engineer"
                        value={companyForm.role} onChange={(e) => setCompanyForm((prev) => ({ ...prev, role: e.target.value }))} />
                    </div>
                    <div>
                      <label className="form-label">Package Offered (LPA) *</label>
                      <input className="form-input" type="number" placeholder="12" min="0.1" step="0.1"
                        value={companyForm.packageOffered}
                        onChange={(e) => setCompanyForm((prev) => ({ ...prev, packageOffered: e.target.value === '' ? '' : e.target.value }))} />
                    </div>
                    <button className="btn-primary w-full justify-center" type="button" onClick={createCompany}>
                      <Plus size={16} /> Add Company
                    </button>
                  </div>
                </SectionCard>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700">{companies.length} Companies</h3>
                  {companies.map((company) => (
                    <div key={company.id} className="page-card px-4 py-3 flex items-center gap-4">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0">
                        {company.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-900 truncate">{company.name}</p>
                        <p className="text-xs text-slate-500">{company.role}</p>
                      </div>
                      {company.packageOffered > 0 && (
                        <span className="pill pill-green text-xs flex-shrink-0">₹{company.packageOffered} LPA</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── JOBS ─────────────────────────────────────────────────────── */}
          {activeTab === 'jobs' && (
            <div className="space-y-6">
              <SectionCard title="Post a Job" subtitle="All fields marked * are required">
                <FormErrors errs={jobErrs} />
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="form-label">Company *</label>
                    <select className="form-input" value={jobForm.companyId}
                      onChange={(e) => setJobForm((prev) => ({ ...prev, companyId: Number(e.target.value) }))}>
                      <option value={0}>Select company</option>
                      {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Job Title *</label>
                    <input className="form-input" placeholder="Software Engineer"
                      value={jobForm.title} onChange={(e) => setJobForm((prev) => ({ ...prev, title: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="form-label">Description *</label>
                    <textarea className="form-input min-h-[80px] resize-none" placeholder="Job responsibilities..."
                      value={jobForm.description} onChange={(e) => setJobForm((prev) => ({ ...prev, description: e.target.value }))} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="form-label">Required Skills</label>
                    <input className="form-input" placeholder="e.g., Java, React, SQL"
                      value={jobForm.requiredSkills} onChange={(e) => setJobForm((prev) => ({ ...prev, requiredSkills: e.target.value }))} />
                  </div>
                </div>
                <div className="mt-4">
                  <button className="btn-primary" type="button" onClick={createJob}>
                    <Plus size={16} /> Create Job
                  </button>
                </div>
              </SectionCard>

              <div className="page-card overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="font-semibold text-slate-900">{jobs.length} Jobs</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr><th>Company</th><th>Job Title</th><th>Required Skills</th><th>Description</th></tr>
                    </thead>
                    <tbody>
                      {jobs.map((job) => (
                        <tr key={job.id}>
                          <td className="font-medium">{job.company?.name}</td>
                          <td>{job.title}</td>
                          <td>
                            <div className="flex flex-wrap gap-1">
                              {job.requiredSkills?.split(',').map((s, i) => s.trim() && (
                                <span key={i} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{s.trim()}</span>
                              ))}
                            </div>
                          </td>
                          <td className="max-w-xs truncate text-slate-500">{job.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── AUDIT LOG ────────────────────────────────────────────────── */}
          {activeTab === 'audit' && (
            <div className="space-y-3 max-w-3xl">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500 font-medium">{logs.length} events on record</p>
                <button onClick={runAudit} disabled={auditRunning} className="btn-secondary text-sm" type="button">
                  <ShieldCheck size={15} />
                  {auditRunning ? 'Running...' : 'Run TPA Audit'}
                </button>
              </div>

              {/* TPA Output Console — only here in Audit Log */}
              {tpaOutput.length > 0 && (
                <div className="page-card overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-900">
                    <div className="flex items-center gap-2">
                      <Terminal size={14} className="text-green-400" />
                      <span className="text-xs text-green-400 font-mono font-semibold">TPA Audit Output</span>
                    </div>
                    <button type="button" onClick={() => setTpaOutput([])} className="text-xs text-slate-500 hover:text-white transition-colors">
                      ✕ Clear
                    </button>
                  </div>
                  <div className="bg-slate-950 p-4 max-h-64 overflow-auto space-y-1">
                    {tpaOutput.map((line, i) => (
                      <p key={i} className="text-xs font-mono text-green-300 leading-relaxed">{line}</p>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {[...logs].reverse().map((log, idx) => (
                  <div key={idx} className="page-card px-4 py-3 flex items-start gap-4 animate-fadeIn">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-800">{log.action}</p>
                      <p className="text-xs text-slate-500 mt-0.5">By: <span className="font-medium">{log.performedBy}</span> · {log.details}</p>
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0 flex items-center gap-1">
                      <Clock size={11} />{log.timestamp?.replace('T', ' ')?.split('.')[0]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
