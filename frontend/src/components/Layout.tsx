import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = (() => {
    if (!user) {
      return [] as Array<{ to: string; label: string }>;
    }

    const common = [{ to: '/dashboard', label: 'Overview' }];

    if (user.role === 'STUDENT') {
      return [...common, { to: '/student', label: 'Student Desk' }];
    }
    if (user.role === 'COMPANY') {
      return [...common, { to: '/company', label: 'Company Console' }];
    }
    if (user.role === 'PLACEMENT') {
      return [...common, { to: '/placement', label: 'Placement Ops' }];
    }
    if (user.role === 'ADMIN') {
      return [
        ...common,
        { to: '/admin', label: 'Admin Center' },
        { to: '/placement', label: 'Placement Ops' },
      ];
    }

    return common;
  })();

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'STUDENT':
        return 'bg-blue-900 text-blue-100';
      case 'COMPANY':
        return 'bg-teal-900 text-teal-100';
      case 'ADMIN':
        return 'bg-red-900 text-red-100';
      case 'PLACEMENT':
        return 'bg-purple-900 text-purple-100';
      default:
        return 'bg-gray-900 text-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-gradient-to-r from-primary-900 to-secondary-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-primary-900">
                PP
              </div>
              <h1 className="text-xl font-bold font-sora">Placement Portal</h1>
            </div>

            {/* Desktop menu */}
            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-white/20 text-white' : 'text-white/85 hover:bg-white/10'}`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
              {user && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-medium">{user.username}</p>
                      <p className={`text-xs px-2 py-1 rounded ${getRoleColor(user.role)}`}>
                        {user.role}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 transition"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-white/20">
              <div className="mb-4 flex flex-col gap-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-white/20 text-white' : 'text-white/85 hover:bg-white/10'}`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
              {user && (
                <>
                  <p className="font-medium mb-2">{user.username}</p>
                  <p className={`text-xs px-2 py-1 rounded inline-block mb-4 ${getRoleColor(user.role)}`}>
                    {user.role}
                  </p>
                  <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 transition"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};
