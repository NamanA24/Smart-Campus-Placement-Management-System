import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { authAPI } from '../services/api';

export const RegisterStudentPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
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

  const update = (key: keyof typeof form, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authAPI.registerStudent(form);
      navigate('/login');
    } catch {
      setError('Registration failed. This email may already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 to-secondary-900 px-4 py-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6 text-center">
          <h1 className="font-sora text-3xl font-bold text-white">Create Student Account</h1>
          <p className="mt-2 text-sm text-secondary-100">Register once, then sign in from the login page.</p>
        </div>

        <form onSubmit={submit} className="rounded-xl bg-white p-6 shadow-2xl">
          {error ? (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-slate-700">Name<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.name} onChange={(e) => update('name', e.target.value)} required /></label>
            <label className="text-sm text-slate-700">Email<input type="email" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.email} onChange={(e) => update('email', e.target.value)} required /></label>
            <label className="text-sm text-slate-700">Password<input type="password" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.password} onChange={(e) => update('password', e.target.value)} required /></label>
            <label className="text-sm text-slate-700">Branch<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.branch} onChange={(e) => update('branch', e.target.value)} required /></label>
            <label className="text-sm text-slate-700">
              Gender
              <select className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.gender} onChange={(e) => update('gender', e.target.value)} required>
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </label>
            <label className="text-sm text-slate-700">CGPA<input type="number" step="0.1" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.cgpa} onChange={(e) => update('cgpa', Number(e.target.value))} required /></label>
            <label className="text-sm text-slate-700">Phone<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.phone} onChange={(e) => update('phone', e.target.value)} required /></label>
            <label className="text-sm text-slate-700 md:col-span-2">Skills<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.skills} onChange={(e) => update('skills', e.target.value)} required /></label>
            <label className="text-sm text-slate-700 md:col-span-2">Projects<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.projects} onChange={(e) => update('projects', e.target.value)} required /></label>
            <label className="text-sm text-slate-700 md:col-span-2">Resume Link<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.resumeLink} onChange={(e) => update('resumeLink', e.target.value)} required /></label>
            <label className="text-sm text-slate-700">University<input className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.university} onChange={(e) => update('university', e.target.value)} required /></label>
            <label className="text-sm text-slate-700">Graduation Year<input type="number" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.graduationYear} onChange={(e) => update('graduationYear', Number(e.target.value))} required /></label>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Link to="/login" className="text-sm font-semibold text-primary-700 hover:text-primary-800">Back to Sign In</Link>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 disabled:opacity-60"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
