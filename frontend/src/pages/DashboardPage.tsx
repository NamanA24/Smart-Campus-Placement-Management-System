import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { GraduationCap } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Smart redirect based on role
  const roleRoutes: Record<string, string> = {
    STUDENT: '/student',
    COMPANY: '/company',
    PLACEMENT: '/placement',
    ADMIN: '/admin',
  };

  const target = roleRoutes[user.role];
  if (target) {
    return <Navigate to={target} replace />;
  }

  // Fallback
  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <GraduationCap size={48} className="text-indigo-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900">Welcome to Campus Portal</h1>
          <p className="text-slate-500 mt-2">Your role workspace is loading...</p>
        </div>
      </div>
    </Layout>
  );
};
