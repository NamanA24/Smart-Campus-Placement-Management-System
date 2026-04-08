import { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { SectionCard } from '../components/SectionCard';
import { applicationAPI, auditAPI, studentAPI } from '../services/api';
import type { ApplicationDTO, AuditLog, StudentPlacementView } from '../types/models';
import { useAuth } from '../context/AuthContext';

export const PlacementPage = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<ApplicationDTO[]>([]);
  const [placementStudents, setPlacementStudents] = useState<StudentPlacementView[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const logsRes = await auditAPI.getAll();
        setLogs(logsRes.data);

        if (user?.role === 'ADMIN') {
          const allRes = await applicationAPI.getAll();
          const mapped = allRes.data.map((item) => ({
            studentName: item.student?.name || 'Unknown',
            jobTitle: item.job?.title || 'Unknown',
            status: item.status || 'APPLIED',
          }));
          setApplications(mapped);
          const studentsRes = await studentAPI.getPlacementView();
          setPlacementStudents(studentsRes.data);
          return;
        }

        const appsRes = await applicationAPI.getForPlacement();
        setApplications(appsRes.data);
        const studentsRes = await studentAPI.getPlacementView();
        setPlacementStudents(studentsRes.data);
      } catch {
        setMessage('Unable to load placement dashboard data');
      }
    };

    load();
  }, [user?.role]);

  return (
    <Layout>
      <div className="space-y-6">
        <SectionCard title="Placement Operations" subtitle="Monitor all student applications and security activity">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Total Applications</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{applications.length}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Audit Events</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{logs.length}</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Application Feed">
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
                {applications.map((row, idx) => (
                  <tr key={`${row.studentName}-${row.jobTitle}-${idx}`} className="border-b border-slate-100">
                    <td className="py-2 pr-4">{row.studentName}</td>
                    <td className="py-2 pr-4">{row.jobTitle}</td>
                    <td className="py-2 pr-4">{row.status || 'APPLIED'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Placement Student Data (Relevant Fields Only)">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-600">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">CGPA</th>
                  <th className="py-2 pr-4">Skills</th>
                  <th className="py-2 pr-4">Projects</th>
                  <th className="py-2 pr-4">Resume</th>
                  <th className="py-2 pr-4">Grad Year</th>
                  <th className="py-2 pr-4">University</th>
                  <th className="py-2 pr-4">Gender</th>
                  <th className="py-2 pr-4">Contact</th>
                  <th className="py-2 pr-4">Email</th>
                </tr>
              </thead>
              <tbody>
                {placementStudents.map((student) => (
                  <tr key={student.id} className="border-b border-slate-100">
                    <td className="py-2 pr-4">{student.name}</td>
                    <td className="py-2 pr-4">{student.cgpa}</td>
                    <td className="py-2 pr-4">{student.skills}</td>
                    <td className="py-2 pr-4">{student.projects}</td>
                    <td className="py-2 pr-4">
                      {student.resumeLink ? (
                        <a href={student.resumeLink} target="_blank" rel="noreferrer" className="font-semibold text-primary-700 hover:text-primary-800">Open</a>
                      ) : 'N/A'}
                    </td>
                    <td className="py-2 pr-4">{student.graduationYear}</td>
                    <td className="py-2 pr-4">{student.university}</td>
                    <td className="py-2 pr-4">{student.gender || 'N/A'}</td>
                    <td className="py-2 pr-4">{student.phone}</td>
                    <td className="py-2 pr-4">{student.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Recent Audit Logs">
          <div className="max-h-[340px] overflow-auto space-y-2">
            {logs.slice().reverse().slice(0, 30).map((log, idx) => (
              <div key={`${log.action}-${idx}`} className="rounded-lg border border-slate-200 px-3 py-2">
                <p className="text-sm font-semibold text-slate-800">{log.action}</p>
                <p className="text-xs text-slate-600">By: {log.performedBy}</p>
                <p className="text-xs text-slate-600">{log.details}</p>
                <p className="text-xs text-slate-400">{log.timestamp}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        {message ? <p className="text-sm font-medium text-rose-700">{message}</p> : null}
      </div>
    </Layout>
  );
};
