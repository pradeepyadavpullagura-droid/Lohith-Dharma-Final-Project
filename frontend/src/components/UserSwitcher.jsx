import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Users, ShieldAlert, Key, Copy, ExternalLink, X, ArrowRight, Radio, LogIn } from 'lucide-react';

const UserSwitcher = ({ setPage }) => {
  const { agents, fetchAgents, login, triggerToast, user } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Fetch agents on mount to ensure we have the list
  useEffect(() => {
    fetchAgents();
  }, []);

  const handleCopyLink = (email, id) => {
    const loginLink = `${window.location.origin}${window.location.pathname}?email=${encodeURIComponent(email)}`;
    navigator.clipboard.writeText(loginLink);
    triggerToast(`One-click login link copied!`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleQuickLogin = async (email) => {
    const password = email.includes('admin') ? 'admin123' : 'agent123';
    const result = await login(email, password);
    if (result.success) {
      setPage('dashboard');
      setIsOpen(false);
    }
  };

  // Status colors helper
  const getStatusColor = (status) => {
    switch (status) {
      case 'Available':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'On Visit':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Offline':
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold px-4 py-3 rounded-2xl transition duration-300 shadow-[0_8px_30px_rgb(16,185,129,0.3)] hover:scale-105 group border border-emerald-400/20 cursor-pointer"
        title="Impersonate / See Anyone"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-950"></span>
        </span>
        <Users className="w-4 h-4 text-slate-950 group-hover:rotate-12 transition duration-300" />
        <span className="text-xs uppercase tracking-wider font-extrabold text-slate-950">See Anyone</span>
      </button>

      {/* Slide-over Drawer Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-over Drawer Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[450px] bg-slate-950/95 border-l border-slate-800/80 shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-850 flex items-center justify-between bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                Quick Access Portal
              </h2>
              <p className="text-[11px] text-slate-400">Simulate and view the app as any platform user.</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:text-white transition cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Active Session Info */}
          {user && (
            <div className="glass-card p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/5 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block mb-0.5">Active Session</span>
                <span className="text-sm font-bold text-white block">{user.name}</span>
                <span className="text-[10px] text-slate-400">{user.email}</span>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 uppercase font-extrabold">
                {user.role}
              </span>
            </div>
          )}

          {/* Section: Platform Administrator */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Platform Administration
            </h3>
            
            <div className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col gap-3.5 hover:border-amber-500/20 transition duration-300">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                    System Administrator
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">admin@realestate.com</p>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Full Access
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleCopyLink('admin@realestate.com', 'admin')}
                  className="flex items-center justify-center gap-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold py-2 px-3 rounded-xl text-xs transition relative cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>{copiedId === 'admin' ? 'Copied URL!' : 'Copy Link'}</span>
                </button>
                <button
                  onClick={() => handleQuickLogin('admin@realestate.com')}
                  className="flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-2 px-3 rounded-xl text-xs transition cursor-pointer shadow-md"
                >
                  <LogIn className="w-3.5 h-3.5 text-slate-950" />
                  <span>Log In</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section: Sales Executives */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" /> Sales Agent Registry
            </h3>

            {agents.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 italic">Loading sales agents...</div>
            ) : (
              <div className="space-y-3">
                {agents.map((agent) => (
                  <div 
                    key={agent.id} 
                    className="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col gap-3.5 hover:border-emerald-500/20 transition duration-300"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-300 text-xs font-bold font-mono">
                          {agent.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-white leading-tight">{agent.name}</h4>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{agent.email}</p>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${getStatusColor(agent.status)}`}>
                        {agent.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleCopyLink(agent.email, agent.id)}
                        className="flex items-center justify-center gap-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold py-2 px-3 rounded-xl text-xs transition relative cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>{copiedId === agent.id ? 'Copied URL!' : 'Copy Link'}</span>
                      </button>
                      <button
                        onClick={() => handleQuickLogin(agent.email)}
                        className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold py-2 px-3 rounded-xl text-xs transition cursor-pointer shadow-md"
                      >
                        <LogIn className="w-3.5 h-3.5 text-slate-950" />
                        <span>Log In</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-850 text-center text-[10px] text-slate-500 bg-slate-900/20">
          Tip: Direct Login links trigger auto-authentication using standard credentials.
        </div>
      </div>
    </>
  );
};

export default UserSwitcher;
