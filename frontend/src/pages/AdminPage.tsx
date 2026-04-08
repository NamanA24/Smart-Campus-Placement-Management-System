import { useEffect, useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { SectionCard } from '../components/SectionCard';
import { StatusPill } from '../components/StatusPill';
import { auditAPI, companyAPI, jobAPI, studentAPI, tpaAPI } from '../services/api';
import type { Company, Job, Student } from '../types/models';

export const AdminPage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [securityLogs, setSecurityLogs] = useState<string[]>([]);

  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    password: 'dev',
    branch: '',
    gender: '',
    cgpa: 0,
    skills: '',
    projects: '',
    resumeLink: '',
    phone: '',
    university: '',
    graduationYear: new Date().getFullYear(),
  });

  const [companyForm, setCompanyForm] = useState({
    name: '',
    password: 'admin',
    role: '',
    packageOffered: 0,
  });

  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    requiredSkills: '',
    companyId: 0,
  });

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
    setAuditLogs(
      auditRes.data
        .slice()
        .reverse()
        .slice(0, 30)
        .map((x) => `${x.timestamp} | ${x.action} | ${x.performedBy} | ${x.details}`)
    );
  };

  useEffect(() => {
    loadData().catch(() => setSecurityLogs((prev) => ['Failed to load admin data', ...prev]));
  }, []);

  const tamperedStudentCount = useMemo(
    () => students.filter((s) => (s.integrityStatus || '').toUpperCase() === 'TAMPERED').length,
    [students]
  );

  const createStudent = async () => {
    await studentAPI.create(studentForm);
    setStudentForm({
      name: '',
      email: '',
      password: 'dev',
      branch: '',
      gender: '',
      cgpa: 0,
      skills: '',
      projects: '',
      resumeLink: '',
      phone: '',
      university: '',
      graduationYear: new Date().getFullYear(),
    });
    await loadData();
  };

  const createCompany = async () => {
    await companyAPI.create(companyForm);
    setCompanyForm({ name: '', password: 'admin', role: '', packageOffered: 0 });
    await loadData();
  };

  const createJob = async () => {
    if (!jobForm.companyId) {
      return;
    }
    await jobAPI.create({
      title: jobForm.title,
      description: jobForm.description,
      requiredSkills: jobForm.requiredSkills,
      company: { id: jobForm.companyId },
    });
    setJobForm({ title: '', description: '', requiredSkills: '', companyId: 0 });
    await loadData();
  };

  const runAudit = async () => {
    const res = await tpaAPI.runAudit();
    setSecurityLogs(res.data);
    await loadData();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <SectionCard title="Admin Command Center" subtitle="Provision actors, jobs, and run security audits">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-slate-50 p-4"><p className="text-xs text-slate-500">Students</p><p className="mt-1 text-2xl font-semibold">{students.length}</p></div>
            <div className="rounded-lg bg-slate-50 p-4"><p className="text-xs text-slate-500">Companies</p><p className="mt-1 text-2xl font-semibold">{companies.length}</p></div>
            <div className="rounded-lg bg-slate-50 p-4"><p className="text-xs text-slate-500">Jobs</p><p className="mt-1 text-2xl font-semibold">{jobs.length}</p></div>
            <div className="rounded-lg bg-slate-50 p-4"><p className="text-xs text-slate-500">Tampered Profiles</p><p className="mt-1 text-2xl font-semibold">{tamperedStudentCount}</p></div>
          </div>
        </SectionCard>

        <SectionCard title="Create Student">
          <div className="grid gap-3 md:grid-cols-3">
            <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Name" value={studentForm.name} onChange={(e) => setStudentForm((prev) => ({ ...prev, name: e.target.value }))} />
            <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Email" value={studentForm.email} onChange={(e) => setStudentForm((prev) => ({ ...prev, email: e.target.value }))} />
            <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Branch" value={studentForm.branch} onChange={(e) => setStudentForm((prev) => ({ ...prev, branch: e.target.value }))} />
            <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={studentForm.gender} onChange={(e) => setStudentForm((prev) => ({ ...prev, gender: e.target.value }))}>
              <option value="">Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" type="number" step="0.1" placeholder="CGPA" value={studentForm.cgpa} onChange={(e) => setStudentForm((prev) => ({ ...prev, cgpa: Number(e.target.value) }))} />
            <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Skills" value={studentForm.skills} onChange={(e) => setStudentForm((prev) => ({ ...prev, skills: e.target.value }))} />
            <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="University" value={studentForm.university} onChange={(e) => setStudentForm((prev) => ({ ...prev, university: e.target.value }))} />
          </div>
          <button className="mt-3 rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800" onClick={() => createStudent().catch(() => setSecurityLogs((prev) => ['Failed to create student', ...prev]))}>
            Create Student
          </button>
        </SectionCard>

        <SectionCard title="Create Company and Job">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="grid gap-3">
                <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Company Name" value={companyForm.name} onChange={(e) => setCompanyForm((prev) => ({ ...prev, name: e.target.value }))} />
                <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Role" value={companyForm.role} onChange={(e) => setCompanyForm((prev) => ({ ...prev, role: e.target.value }))} />
                <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" type="number" placeholder="Package" value={companyForm.packageOffered} onChange={(e) => setCompanyForm((prev) => ({ ...prev, packageOffered: Number(e.target.value) }))} />
              </div>
              <button className="mt-3 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100" onClick={() => createCompany().catch(() => setSecurityLogs((prev) => ['Failed to create company', ...prev]))}>
                Create Company
              </button>
            </div>

            <div>
              <div className="grid gap-3">
                <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Job title" value={jobForm.title} onChange={(e) => setJobForm((prev) => ({ ...prev, title: e.target.value }))} />
                <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Description" value={jobForm.description} onChange={(e) => setJobForm((prev) => ({ ...prev, description: e.target.value }))} />
                <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm" value={jobForm.companyId}
                  onChange={(e) => setJobForm((prev) => ({ ...prev, companyId: Number(e.target.value) }))}>
                  <option value={0}>Select company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </div>
              <button className="mt-3 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100" onClick={() => createJob().catch(() => setSecurityLogs((prev) => ['Failed to create job', ...prev]))}>
                Create Job
              </button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Run TPA Audit" right={<button className="rounded-lg bg-secondary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-secondary-800" onClick={() => runAudit().catch(() => setSecurityLogs((prev) => ['TPA audit failed', ...prev]))}>Run Audit</button>}>
          <div className="space-y-2">
            {securityLogs.length === 0 ? <p className="text-sm text-slate-500">No recent TPA output.</p> : null}
            {securityLogs.map((log, idx) => (
              <div key={`${log}-${idx}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">{log}</div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Students Full Data (Admin)">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-600">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Phone</th>
                  <th className="py-2 pr-4">Gender</th>
                  <th className="py-2 pr-4">Branch</th>
                  <th className="py-2 pr-4">CGPA</th>
                  <th className="py-2 pr-4">Skills</th>
                  <th className="py-2 pr-4">Projects</th>
                  <th className="py-2 pr-4">Resume</th>
                  <th className="py-2 pr-4">University</th>
                  <th className="py-2 pr-4">Grad Year</th>
                  <th className="py-2 pr-4">Integrity</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-b border-slate-100">
                    <td className="py-2 pr-4">{student.name}</td>
                    <td className="py-2 pr-4">{student.email}</td>
                    <td className="py-2 pr-4">{student.phone}</td>
                    <td className="py-2 pr-4">{student.gender || 'N/A'}</td>
                    <td className="py-2 pr-4">{student.branch}</td>
                    <td className="py-2 pr-4">{student.cgpa}</td>
                    <td className="py-2 pr-4">{student.skills}</td>
                    <td className="py-2 pr-4">{student.projects}</td>
                    <td className="py-2 pr-4">
                      {student.resumeLink ? (
                        <a href={student.resumeLink} target="_blank" rel="noreferrer" className="font-semibold text-primary-700 hover:text-primary-800">Open</a>
                      ) : 'N/A'}
                    </td>
                    <td className="py-2 pr-4">{student.university}</td>
                    <td className="py-2 pr-4">{student.graduationYear}</td>
                    <td className="py-2 pr-4"><StatusPill label={student.integrityStatus || 'UNSIGNED'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Audit Feed">
          <div className="max-h-[320px] space-y-2 overflow-auto">
            {auditLogs.map((entry, idx) => (
              <p key={`${entry}-${idx}`} className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700">{entry}</p>
            ))}
          </div>
        </SectionCard>
      </div>
    </Layout>
  );
};
