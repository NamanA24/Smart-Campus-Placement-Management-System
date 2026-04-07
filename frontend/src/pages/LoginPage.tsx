import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 to-secondary-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl font-bold text-primary-900 font-sora">PP</span>
          </div>
          <h1 className="text-4xl font-bold text-white font-sora mb-2">
            Placement Portal
          </h1>
          <p className="text-secondary-200">Career opportunities for students, companies, and campus teams</p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-2xl p-8 space-y-6"
        >
          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle size={20} className="flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email or Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              disabled={isLoading}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
              disabled={isLoading}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !username || !password}
            className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 rounded-lg transition shadow-lg"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          {/* Demo Credentials */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600 text-center mb-3 font-semibold">DEMO CREDENTIALS</p>
            <div className="space-y-2 text-xs">
              <p className="text-gray-700">
                <span className="font-semibold">Admin:</span> admin / admin
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Student:</span> naman.demo.2026@gmail.com / dev
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Company:</span> AtlassanDemo20260408A / admin
              </p>
              <p className="text-gray-500">
                Use company name (not email) for company login.
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Placement:</span> placement1 / admin
              </p>
            </div>
          </div>

          <div className="pt-2 text-center">
            <p className="text-sm text-gray-600">
              New student?{' '}
              <Link to="/register/student" className="font-semibold text-primary-700 hover:text-primary-800">
                Create your account
              </Link>
            </p>
          </div>
        </form>

        {/* Footer */}
        <p className="text-center text-secondary-200 text-sm mt-6">
          Built for campus recruitment and placement workflows
        </p>
      </div>
    </div>
  );
};
