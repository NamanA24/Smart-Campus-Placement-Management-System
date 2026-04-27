import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  User,
  Briefcase,
  FileText,
  Building2,
  ListChecks,
  BarChart3,
  Users,
  ShieldCheck,
  Settings,
  LogOut,
  Menu,
  GraduationCap,
  ClipboardList,
  ScrollText,
  Plus,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  /** Base path without query – used for tab-aware active detection */
  basePath?: string;
  /** Tab value for ?tab= based items */
  tab?: string;
}

const roleColors: Record<string, string> = {
  STUDENT:   'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  COMPANY:   'bg-teal-500/20 text-teal-300 border border-teal-500/30',
  ADMIN:     'bg-rose-500/20 text-rose-300 border border-rose-500/30',
  PLACEMENT: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
};

const roleIcons: Record<string, React.ReactNode> = {
  STUDENT:   <GraduationCap size={14} />,
  COMPANY:   <Building2 size={14} />,
  ADMIN:     <ShieldCheck size={14} />,
  PLACEMENT: <ClipboardList size={14} />,
};

function buildNavItems(role: string): NavItem[] {
  if (role === 'STUDENT') {
    return [
      { to: '/student',                     label: 'Dashboard',       icon: <LayoutDashboard size={18} />, basePath: '/student', tab: '' },
      { to: '/student?tab=profile',         label: 'My Profile',      icon: <User size={18} />,            basePath: '/student', tab: 'profile' },
      { to: '/student?tab=jobs',            label: 'Browse Jobs',     icon: <Briefcase size={18} />,       basePath: '/student', tab: 'jobs' },
      { to: '/student?tab=applications',    label: 'My Applications', icon: <FileText size={18} />,        basePath: '/student', tab: 'applications' },
    ];
  }
  if (role === 'COMPANY') {
    return [
      { to: '/company',                     label: 'Dashboard',    icon: <LayoutDashboard size={18} />, basePath: '/company', tab: '' },
      { to: '/company?tab=post',            label: 'Post a Job',   icon: <Plus size={18} />,            basePath: '/company', tab: 'post' },
      { to: '/company?tab=listings',        label: 'My Listings',  icon: <ListChecks size={18} />,      basePath: '/company', tab: 'listings' },
      { to: '/company?tab=applications',    label: 'Applications', icon: <Users size={18} />,           basePath: '/company', tab: 'applications' },
      { to: '/company?tab=analytics',       label: 'Analytics',    icon: <BarChart3 size={18} />,       basePath: '/company', tab: 'analytics' },
    ];
  }
  if (role === 'PLACEMENT') {
    return [
      { to: '/placement',                    label: 'Dashboard',      icon: <LayoutDashboard size={18} />, basePath: '/placement', tab: '' },
      { to: '/placement?tab=applications',   label: 'Applications',   icon: <ClipboardList size={18} />,  basePath: '/placement', tab: 'applications' },
      { to: '/placement?tab=students',       label: 'Student Roster', icon: <GraduationCap size={18} />,  basePath: '/placement', tab: 'students' },
      { to: '/placement?tab=audit',          label: 'Audit Log',      icon: <ScrollText size={18} />,     basePath: '/placement', tab: 'audit' },
    ];
  }
  if (role === 'ADMIN') {
    return [
      { to: '/admin',                label: 'Dashboard',     icon: <LayoutDashboard size={18} />, basePath: '/admin', tab: '' },
      { to: '/admin?tab=students',   label: 'Students',      icon: <GraduationCap size={18} />,  basePath: '/admin', tab: 'students' },
      { to: '/admin?tab=companies',  label: 'Companies',     icon: <Building2 size={18} />,      basePath: '/admin', tab: 'companies' },
      { to: '/admin?tab=jobs',       label: 'Jobs',          icon: <Briefcase size={18} />,      basePath: '/admin', tab: 'jobs' },
      { to: '/admin?tab=audit',      label: 'Audit Log',     icon: <ScrollText size={18} />,     basePath: '/admin', tab: 'audit' },
      { to: '/placement',            label: 'Placement Ops', icon: <Settings size={18} />,       basePath: '/placement', tab: '' },
    ];
  }
  return [];
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = user ? buildNavItems(user.role) : [];

  const currentTab = new URLSearchParams(location.search).get('tab') ?? '';

  const isNavItemActive = (item: NavItem): boolean => {
    if (!item.basePath) return false;
    const pathMatches = location.pathname === item.basePath;
    if (!pathMatches) return false;
    // Tab-aware: '' means "no tab param" (overview/dashboard)
    return (item.tab ?? '') === currentTab;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg">
            <GraduationCap size={20} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Campus Portal</p>
            <p className="text-xs text-slate-500 mt-0.5">Placement Management</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = isNavItemActive(item);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={() => `sidebar-link ${active ? 'active' : ''}`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User info + logout */}
      {user && (
        <div className="px-3 py-4 border-t border-slate-700/50 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.username}</p>
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-0.5 ${roleColors[user.role] ?? 'bg-slate-700 text-slate-300'}`}>
                {roleIcons[user.role]}
                {user.role}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 transition-all"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar — fixed position, 240px wide */}
      <aside className="hidden md:block sidebar w-60">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-60 flex flex-col z-40 md:hidden transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: '#0F172A' }}
      >
        <SidebarContent />
      </aside>

      {/* Main content — offset by sidebar width on desktop */}
      <div className="flex flex-col min-h-screen md:ml-60">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 text-white shadow-sm sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-white/10 transition">
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <GraduationCap size={18} className="text-indigo-400" />
            <span className="font-semibold text-sm">Campus Portal</span>
          </div>
          {user && (
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};
