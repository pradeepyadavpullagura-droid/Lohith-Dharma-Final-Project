import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Mail, Building, UserCheck, ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import AuroraCanvas from '../components/AuroraCanvas';

const Login = ({ onNavigate }) => {
  const { login, loading } = useApp();
  const [email, setEmail] = useState('admin@realestate.com');
  const [password, setPassword] = useState('admin123');
  const [activeRole, setActiveRole] = useState('admin'); // 'admin' or 'agent'

  const handleRoleToggle = (role) => {
    setActiveRole(role);
    if (role === 'admin') {
      setEmail('admin@realestate.com');
      setPassword('admin123');
    } else {
      setEmail('rohan.sharma@realestate.com');
      setPassword('agent123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      onNavigate('dashboard');
    }
  };

  return (
    <div className="min-h-screen w-full py-12 px-4 sm:px-6 lg:px-8 bg-slate-950 flex flex-col justify-center items-center relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src="/booking_success_bg.png" 
          alt="Township Background" 
          className="w-full h-full object-cover opacity-50"
        />
        <div className="dark-gradient-overlay" />
      </div>

      {/* Title */}
      <div className="text-center mb-8 max-w-lg z-10">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center justify-center gap-2 mb-2">
          <Building className="text-emerald-400 w-8 h-8" />
          LOHITH DHARMA <span className="text-emerald-400 font-light">PLOTS</span>
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm font-light">
          Site Visit Booking Operations Management System
        </p>
      </div>

      <div className="glass-confirmed-card max-w-md w-full p-6 sm:p-8 border border-emerald-500/10 animate-fade-in-up z-10">
        {/* Back Link */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => onNavigate('public-booking')}
            className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Booking Form
          </button>
          <button
            onClick={() => onNavigate('landing')}
            className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition"
          >
            <Home className="w-3.5 h-3.5" /> Home
          </button>
        </div>

        <h2 className="text-xl font-bold text-white mb-2">Internal Portal Access</h2>
        <p className="text-xs text-slate-400 mb-6">Select a profile below to auto-fill credentials and log in instantly for demonstration.</p>

        {/* Role Toggle Switcher */}
        <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800 mb-6">
          <button
            onClick={() => handleRoleToggle('admin')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold tracking-wide transition ${
              activeRole === 'admin'
                ? 'bg-emerald-600 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" /> Admin Portal
          </button>
          <button
            onClick={() => handleRoleToggle('agent')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold tracking-wide transition ${
              activeRole === 'agent'
                ? 'bg-emerald-600 text-slate-950 font-bold shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" /> Sales Agent
          </button>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="glass-input w-full py-2.5 pl-10 pr-4 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="glass-input w-full py-2.5 pl-10 pr-4 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 border border-emerald-500/20 text-emerald-400 hover:bg-slate-800 font-bold py-3 px-4 rounded-xl transition duration-200 mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Authorizing Access...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-[10px] text-slate-500 leading-relaxed border-t border-slate-800/80 pt-4">
          For testing alternative agents: Use Sneha Reddy's email <span className="text-slate-400">sneha.reddy@realestate.com</span> or Amit Patel's <span className="text-slate-400">amit.patel@realestate.com</span> with password <span className="text-slate-400 font-mono">agent123</span>.
        </div>
      </div>
    </div>
  );
};

export default Login;
