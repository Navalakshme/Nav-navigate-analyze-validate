import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, Users, Brain,
  MessageSquare, Search, FileText, Shield,
  Bell, ChevronDown, BarChart2
} from 'lucide-react';
import clsx from 'clsx';
import { useAppStore } from '../store/appStore';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/role-analysis', label: 'Role Analysis', icon: Briefcase },
  { path: '/candidates', label: 'Candidates', icon: Users },
  { path: '/interview', label: 'Interview Agent', icon: MessageSquare },
  { path: '/search', label: 'Ask NAV', icon: Search },
  { path: '/report', label: 'Reports', icon: FileText },
  { path: '/audit', label: 'Audit Trail', icon: Shield },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { candidates, analysisComplete } = useAppStore();

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-bg-primary overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-bg-secondary border-r border-border-subtle flex flex-col">
        {/* Logo */}
        <div className="px-4 pt-5 pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="w-7 h-7 rounded-lg bg-accent-gradient flex items-center justify-center shadow-glow-sm">
              <BarChart2 className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-text-primary tracking-tight">NAV</span>
          </div>
          <p className="text-[10px] text-text-muted ml-9 leading-tight">Navigate. Analyze. Validate.</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto no-scrollbar">
          {navItems.map(({ path, label, icon: Icon }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={clsx(
                'w-full text-left',
                isActive(path) ? 'nav-item-active' : 'nav-item'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-border-subtle">
          {analysisComplete && (
            <div className="mb-2 px-2 py-1.5 bg-status-verified/10 border border-status-verified/20 rounded-lg">
              <p className="text-[10px] text-status-verified font-medium">Analysis Active</p>
              <p className="text-[10px] text-text-muted">{candidates.length} candidate{candidates.length !== 1 ? 's' : ''} loaded</p>
            </div>
          )}
          <div className="flex items-center gap-2 px-1">
            <div className="w-7 h-7 rounded-full bg-accent-purple flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              N
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-text-primary truncate">Navalakshme</p>
              <p className="text-[10px] text-text-muted">Recruiter</p>
            </div>
            <ChevronDown className="w-3 h-3 text-text-muted ml-auto flex-shrink-0" />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-12 flex items-center justify-between px-5 border-b border-border-subtle bg-bg-secondary flex-shrink-0">
          <div className="flex items-center gap-2 bg-bg-primary border border-border-subtle rounded-lg px-3 py-1.5 w-72">
            <Search className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
            <span className="text-xs text-text-muted">Search candidates, skills, roles...</span>
            <span className="ml-auto text-[10px] text-text-muted border border-border-subtle rounded px-1">⌘K</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-1.5 text-text-muted hover:text-text-primary transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-accent-pink rounded-full"></span>
            </button>
            <div className="w-7 h-7 rounded-full bg-accent-purple flex items-center justify-center text-white text-xs font-bold">
              N
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
