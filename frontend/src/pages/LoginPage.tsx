import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  AlertCircle,
  Eye,
  EyeOff,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  ClipboardList,
  ArrowRight,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const roleCards = [
    { role: 'Student', icon: <GraduationCap size={20} />, color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', desc: 'Browse jobs & track applications' },
    { role: 'Company', icon: <Briefcase size={20} />, color: 'bg-teal-500/20 text-teal-300 border-teal-500/30', desc: 'Post roles & shortlist candidates' },
    { role: 'Placement', icon: <ClipboardList size={20} />, color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', desc: 'Monitor drives & audit activity' },
    { role: 'Admin', icon: <ShieldCheck size={20} />, color: 'bg-rose-500/20 text-rose-300 border-rose-500/30', desc: 'Manage all platform entities' },
  ];

  const demoCredentials = [
    { role: 'Admin', username: 'admin', password: 'admin' },
    { role: 'Student', username: 'naman.demo.2026@gmail.com', password: 'dev' },
    { role: 'Company', username: 'AtlassanDemo20260408A', password: 'admin' },
    { role: 'Placement', username: 'placement1', password: 'admin' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[55%] flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)' }}>
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #6366F1, transparent)' }} />
          <div className="absolute top-1/2 right-0 w-80 h-80 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #8B5CF6, transparent)' }} />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #4F46E5, transparent)' }} />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
            <GraduationCap size={22} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">Campus Portal</p>
            <p className="text-slate-400 text-xs">Smart Placement Management</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative space-y-6">
          <div>
            <h1 className="text-5xl font-bold text-white leading-tight">
              One portal,<br />
              <span className="text-gradient-indigo">four roles.</span>
            </h1>
            <p className="text-slate-400 text-lg mt-4 max-w-sm leading-relaxed">
              A complete campus recruitment ecosystem — from students to companies to placement officers and admins.
            </p>
          </div>

          {/* Role cards */}
          <div className="grid grid-cols-2 gap-3 max-w-md">
            {roleCards.map((rc) => (
              <div key={rc.role} className={`flex items-start gap-3 p-3 rounded-xl border ${rc.color} bg-opacity-10`}>
                <span className="mt-0.5">{rc.icon}</span>
                <div>
                  <p className="font-semibold text-sm text-white">{rc.role}</p>
                  <p className="text-xs opacity-70 mt-0.5">{rc.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom tag */}
        <div className="relative">
          <p className="text-slate-500 text-xs">
            Secured with JWT · Digital signature integrity · Real-time audit logging
          </p>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md space-y-8 animate-fadeIn">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <GraduationCap size={22} className="text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900">Campus Portal</span>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-slate-500 mt-1">Sign in to access your portal workspace</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 animate-fadeIn">
                <AlertCircle size={18} className="flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div>
              <label className="form-label">Username / Email</label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username or email"
                className="form-input"
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="form-input pr-11"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full btn-primary justify-center py-3 text-base rounded-xl"
              style={{ background: isLoading ? '#94A3B8' : undefined }}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                  <ArrowRight size={18} />
                </span>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-card">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Demo Credentials</p>
            </div>
            <div className="divide-y divide-slate-100">
              {demoCredentials.map((cred) => (
                <div key={cred.role} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-xs font-semibold text-slate-500 w-20 flex-shrink-0">{cred.role}</span>
                  <button
                    type="button"
                    onClick={() => { setUsername(cred.username); setPassword(cred.password); }}
                    className="flex-1 text-left"
                  >
                    <code className="text-xs text-indigo-700 hover:text-indigo-900 transition-colors cursor-pointer">
                      {cred.username}
                    </code>
                    <span className="text-xs text-slate-400 ml-2">/ {cred.password}</span>
                  </button>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 bg-amber-50 border-t border-amber-100">
              <p className="text-xs text-amber-700">💡 Click any credential above to auto-fill</p>
            </div>
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-slate-600">
            New student?{' '}
            <Link to="/register/student" className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
              Create your account →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
