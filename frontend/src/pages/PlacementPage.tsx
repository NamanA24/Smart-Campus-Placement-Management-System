import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Layout } from '../components/Layout';
import { StatCard } from '../components/StatCard';
import { SectionCard } from '../components/SectionCard';
import { StatusPill } from '../components/StatusPill';
import { applicationAPI, auditAPI, studentAPI } from '../services/api';
import type { ApplicationDTO, AuditLog, StudentPlacementView } from '../types/models';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap, ScrollText, FileText, Clock,
  ExternalLink, Filter,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  APPLIED:     '#6366F1',
  SHORTLISTED: '#10B981',
  REJECTED:    '#F43F5E',
};

export const PlacementPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'overview';

  const [applications, setApplications] = useState<ApplicationDTO[]>([]);
  const [placementStudents, setPlacementStudents] = useState<StudentPlacementView[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const logsRes = await auditAPI.getAll();
        setLogs(logsRes.data);
        if (user?.role === 'ADMIN') {
          const allRes = await applicationAPI.getAll();
          const mapped = allRes.data.map((item: any) => ({
            studentName: item.student?.name || 'Unknown',
            jobTitle:    item.job?.title || 'Unknown',
            status:      item.status || 'APPLIED',
          }));
          setApplications(mapped);
        } else {
          const appsRes = await applicationAPI.getForPlacement();
          setApplications(appsRes.data);
        }
        const studentsRes = await studentAPI.getPlacementView();
        setPlacementStudents(studentsRes.data);
      } catch {
        setMessage('Unable to load placement dashboard data');
      }
    };
    load();
  }, [user?.role]);

  const filteredApps = statusFilter === 'ALL'
    ? applications
    : applications.filter((a) => (a.status || 'APPLIED').toUpperCase() === statusFilter);

  const statusCounts = {
    APPLIED:     applications.filter((a) => (a.status || 'APPLIED').toUpperCase() === 'APPLIED').length,
    SHORTLISTED: applications.filter((a) => a.status?.toUpperCase() === 'SHORTLISTED').length,
    REJECTED:    applications.filter((a) => a.status?.toUpperCase() === 'REJECTED').length,
  };

  const appPieData = [
    { name: 'Applied',     value: statusCounts.APPLIED,     color: STATUS_COLORS.APPLIED },
    { name: 'Shortlisted', value: statusCounts.SHORTLISTED, color: STATUS_COLORS.SHORTLISTED },
    { name: 'Rejected',    value: statusCounts.REJECTED,    color: STATUS_COLORS.REJECTED },
  ].filter((d) => d.value > 0);

  const recentLogs = [...logs].reverse().slice(0, 5);

  // Graduation year distribution
  const gradYearMap: Record<string, number> = {};
  placementStudents.forEach((s) => {
    const yr = String(s.graduationYear || 'Unknown');
    gradYearMap[yr] = (gradYearMap[yr] || 0) + 1;
  });
  const gradPieData = Object.entries(gradYearMap).map(([year, count], i) => ({
    name: year, value: count,
    color: ['#6366F1','#8B5CF6','#06B6D4','#10B981','#F59E0B','#F43F5E'][i % 6],
  }));

  return (
    <Layout>
      <div className="flex flex-col h-full">
        <div className="bg-white border-b border-slate-200 px-6 py-5">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Placement Operations</h1>
            <p className="text-sm text-slate-500 mt-0.5">Monitor applications, student data, and audit activity</p>
          </div>
        </div>


        <div className="flex-1 p-6 animate-fadeIn">
          {message && <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">{message}</div>}

          {/* ── OVERVIEW ─────────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard label="Total Applications" value={applications.length}       icon={<FileText size={18} />}     variant="indigo" />
                <StatCard label="Students in Roster" value={placementStudents.length}  icon={<GraduationCap size={18} />} variant="blue" />
                <StatCard label="Audit Events"        value={logs.length}               icon={<ScrollText size={18} />}   variant="default" />
              </div>

              {/* Application Status Pie */}
              {applications.length > 0 && (
                <SectionCard title="Application Status Breakdown" subtitle="Real-time distribution across all drives">
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-full md:w-64 h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie dataKey="value" data={appPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4}>
                            {appPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip formatter={(val: any) => [`${val} students`, '']} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-col gap-3 flex-1">
                      {[
                        { label: 'Applied',     value: statusCounts.APPLIED,     bg: 'bg-indigo-50 border-indigo-200 text-indigo-800',   dot: STATUS_COLORS.APPLIED },
                        { label: 'Shortlisted', value: statusCounts.SHORTLISTED, bg: 'bg-emerald-50 border-emerald-200 text-emerald-800', dot: STATUS_COLORS.SHORTLISTED },
                        { label: 'Rejected',    value: statusCounts.REJECTED,    bg: 'bg-rose-50 border-rose-200 text-rose-800',          dot: STATUS_COLORS.REJECTED },
                      ].map((item) => (
                        <div key={item.label} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${item.bg}`}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ background: item.dot }} />
                            <span className="font-medium text-sm">{item.label}</span>
                          </div>
                          <span className="font-bold text-lg">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </SectionCard>
              )}

              {/* Students by Graduation Year */}
              {gradPieData.length > 0 && (
                <SectionCard title="Students by Graduation Year">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {gradPieData.map((item) => (
                      <div key={item.name} className="rounded-xl border border-slate-100 px-4 py-3 flex flex-col items-center gap-1">
                        <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                        <p className="font-bold text-xl text-slate-800">{item.value}</p>
                        <p className="text-xs text-slate-500 font-medium">{item.name}</p>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              )}

              {/* Recent audit */}
              <SectionCard title="Recent Audit Activity" subtitle="Last 5 events">
                <div className="space-y-3">
                  {recentLogs.length === 0
                    ? <p className="text-sm text-slate-400">No audit events recorded.</p>
                    : recentLogs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                        <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{log.action}</p>
                          <p className="text-xs text-slate-500 mt-0.5">By: {log.performedBy} · {log.details}</p>
                        </div>
                        <span className="text-xs text-slate-400 flex-shrink-0 flex items-center gap-1">
                          <Clock size={11} />{log.timestamp?.split('T')[0] ?? ''}
                        </span>
                      </div>
                    ))}
                </div>
              </SectionCard>
            </div>
          )}

          {/* ── APPLICATIONS ─────────────────────────────────────────────── */}
          {activeTab === 'applications' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Filter size={15} className="text-slate-400" />
                {(['ALL', 'APPLIED', 'SHORTLISTED', 'REJECTED'] as const).map((s) => (
                  <button key={s} onClick={() => setStatusFilter(s)} type="button"
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                      statusFilter === s ? 'bg-indigo-600 text-white border-indigo-600' : 'text-slate-600 border-slate-200 hover:border-indigo-300'
                    }`}>
                    {s} {s === 'ALL' ? `(${applications.length})` : `(${statusCounts[s as keyof typeof statusCounts] ?? 0})`}
                  </button>
                ))}
              </div>
              <div className="page-card overflow-hidden">
                <table className="data-table">
                  <thead>
                    <tr><th>Student</th><th>Job Applied For</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {filteredApps.length === 0 ? (
                      <tr><td colSpan={3} className="text-center text-slate-400 py-8">No applications found.</td></tr>
                    ) : filteredApps.map((row, idx) => (
                      <tr key={`${row.studentName}-${row.jobTitle}-${idx}`}>
                        <td className="font-medium">{row.studentName}</td>
                        <td>{row.jobTitle}</td>
                        <td><StatusPill label={row.status || 'APPLIED'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── STUDENT ROSTER ───────────────────────────────────────────── */}
          {activeTab === 'students' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500 font-medium">{placementStudents.length} students in placement pool</p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {placementStudents.map((student) => {
                  const skills = student.skills?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
                  const safeResume = student.resumeLink && student.resumeLink.startsWith('http') ? student.resumeLink : null;
                  return (
                    <div key={student.id} className="page-card p-4 space-y-3 hover:shadow-card-hover transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                          {student.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate">{student.name}</p>
                          <p className="text-xs text-slate-500 truncate">{student.email}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-50 rounded-lg px-2.5 py-2">
                          <p className="text-slate-400">CGPA</p>
                          <p className="font-bold text-slate-800">{student.cgpa}</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg px-2.5 py-2">
                          <p className="text-slate-400">Grad Year</p>
                          <p className="font-bold text-slate-800">{student.graduationYear}</p>
                        </div>
                      </div>
                      {skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {skills.slice(0, 4).map((s, i) => <span key={i} className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">{s}</span>)}
                          {skills.length > 4 && <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full">+{skills.length - 4}</span>}
                        </div>
                      )}
                      {safeResume ? (
                        <a href={safeResume} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                          <ExternalLink size={12} /> View Resume
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">No resume uploaded</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── AUDIT LOG ────────────────────────────────────────────────── */}
          {activeTab === 'audit' && (
            <div className="space-y-3 max-w-3xl">
              <p className="text-sm text-slate-500 font-medium">{logs.length} total events</p>
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
