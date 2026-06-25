import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Mail, Building, ArrowLeft, Home, Eye, EyeOff } from 'lucide-react';

const Login = ({ onNavigate }) => {
  const { login, loading } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

        <h2 className="text-xl font-bold text-white mb-6">Internal Portal Access</h2>

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
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="glass-input w-full py-2.5 pl-10 pr-10 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition cursor-pointer flex items-center justify-center"
              >
                {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
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
      </div>
    </div>
  );
};

export default Login;
