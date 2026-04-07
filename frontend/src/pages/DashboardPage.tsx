import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';

interface DashboardStats {
  label: string;
  value: string | number;
  tag: string;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats[]>([]);
  const [nextRoute, setNextRoute] = useState('/dashboard');

  useEffect(() => {
    // Dashboard stats will be populated based on user role
    if (user?.role === 'STUDENT') {
      setStats([
        { label: 'My Applications', value: 'Track', tag: 'APP' },
        { label: 'Open Opportunities', value: 'Explore', tag: 'JOB' },
        { label: 'Profile Completion', value: 'Manage', tag: 'PRF' },
        { label: 'Interview Journey', value: 'Active', tag: 'INT' },
      ]);
      setNextRoute('/student');
    } else if (user?.role === 'COMPANY') {
      setStats([
        { label: 'Open Roles', value: 'Manage', tag: 'JOB' },
        { label: 'Applicants', value: 'Review', tag: 'APL' },
        { label: 'Shortlisting', value: 'Active', tag: 'SLT' },
        { label: 'Hiring Insights', value: 'View', tag: 'INS' },
      ]);
      setNextRoute('/company');
    } else if (user?.role === 'PLACEMENT') {
      setStats([
        { label: 'Placement Drive', value: 'Monitor', tag: 'DRV' },
        { label: 'Applications Feed', value: 'Live', tag: 'APL' },
        { label: 'Company Activity', value: 'Track', tag: 'CMP' },
        { label: 'Campus Progress', value: 'View', tag: 'PRG' },
      ]);
      setNextRoute('/placement');
    } else if (user?.role === 'ADMIN') {
      setStats([
        { label: 'Student Accounts', value: 'Manage', tag: 'STD' },
        { label: 'Companies', value: 'Onboard', tag: 'CMP' },
        { label: 'Job Posts', value: 'Control', tag: 'JOB' },
        { label: 'Platform Reports', value: 'View', tag: 'RPT' },
      ]);
      setNextRoute('/admin');
    }
  }, [user]);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl p-8 shadow-lg">
          <h1 className="text-3xl font-bold font-sora">Welcome back, {user?.username}!</h1>
          <p className="text-secondary-100 mt-2">You're logged in as {user?.role}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-lg p-6 shadow hover:shadow-lg transition border-l-4 border-primary-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className="text-xs font-semibold tracking-wider px-2 py-1 rounded bg-gray-100 text-gray-600">{stat.tag}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Coming Soon Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Your Portal Home</h2>
          <p className="text-gray-600">
            Access your role workspace to continue placement operations.
          </p>
          <Link
            to={nextRoute}
            className="mt-6 inline-flex rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-800"
          >
            Open Role Workspace
          </Link>
        </div>
      </div>
    </Layout>
  );
};
