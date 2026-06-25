import React from 'react';
import { useApp } from '../context/AppContext';
import { LayoutDashboard, FileBarChart, LogOut, Building, PlusCircle, Key } from 'lucide-react';

const SidebarLayout = ({ children, activeTab, onTabChange, onNavigate }) => {
  const { user, logout } = useApp();

  const handleLogout = () => {
    logout();
    onNavigate('login');
  };

  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'agent'] },
    { id: 'reports', name: 'Reports & Export', icon: FileBarChart, roles: ['admin'] },
    { id: 'agent-access', name: 'Agent Log In Access', icon: Key, roles: ['admin'] },
  ];

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 text-slate-100">
      {/* Sidebar Panel */}
      <aside className="w-full md:w-64 bg-slate-900/60 border-b md:border-b-0 md:border-r border-slate-800/80 p-6 flex flex-col justify-between shrink-0 glass-panel">
        <div>
          {/* Brand */}
          <div className="flex items-center gap-2 mb-8 cursor-pointer" onClick={() => onNavigate('public-booking')}>
            <Building className="text-emerald-400 w-6 h-6 animate-pulse" />
            <span className="text-lg font-black tracking-tight text-white">LOHITH DHARMA <span className="text-emerald-400 font-light">PLOTS</span></span>
          </div>

          {/* Profile Card */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shrink-0">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="min-w-0">
              <span className="block text-sm font-semibold text-white truncate">{user.name}</span>
              <span className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                user.role === 'admin' 
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>
                {user.role}
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1.5">
            {navItems
              .filter(item => item.roles.includes(user.role))
              .map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition duration-200 ${
                      isActive
                        ? 'bg-emerald-600 text-slate-950 font-bold shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                    {item.name}
                  </button>
                );
              })}

            {/* Quick action: public booking */}
            <button
              onClick={() => onNavigate('public-booking')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition duration-200"
            >
              <PlusCircle className="w-4 h-4 text-slate-400" />
              New Booking Form
            </button>
          </nav>
        </div>

        {/* Logout at bottom */}
        <div className="pt-4 border-t border-slate-800/80 mt-6 md:mt-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/20 transition duration-200"
          >
            <LogOut className="w-4 h-4 text-red-400" />
            Sign Out Portal
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default SidebarLayout;
