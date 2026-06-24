import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Key, Copy, ExternalLink, Lock, Mail, Phone, Shield, User, RefreshCw, Pencil, Trash2, UserPlus } from 'lucide-react';

const AgentAccess = () => {
  const { 
    agents, stats, fetchDashboardStats, setUser, triggerToast, loading, updateAgent, deleteAgent, createAgent 
  } = useApp();

  const [copiedId, setCopiedId] = useState(null);
  const [copiedLinkId, setCopiedLinkId] = useState(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  
  const [addForm, setAddForm] = useState({ name: '', email: '', phone: '' });
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const handleCopyCredentials = (agent) => {
    const text = `Email: ${agent.email}\nPassword: agent123`;
    navigator.clipboard.writeText(text);
    triggerToast(`Credentials copied for ${agent.name}!`);
    setCopiedId(agent.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyLoginLink = (agent) => {
    const loginLink = `${window.location.origin}${window.location.pathname}?email=${encodeURIComponent(agent.email)}`;
    navigator.clipboard.writeText(loginLink);
    triggerToast(`One-click login link copied for ${agent.name}!`);
    setCopiedLinkId(agent.id);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  const handleImpersonate = (agent) => {
    // 1. Backup admin session
    const currentSession = localStorage.getItem('site_visit_user');
    if (currentSession) {
      localStorage.setItem('site_visit_admin_backup', currentSession);
    }

    // 2. Set active user to agent session
    const agentSession = {
      name: agent.name,
      email: agent.email,
      role: 'agent',
      agentId: agent.id,
      phone: agent.phone,
      status: agent.status,
      isImpersonated: true
    };

    setUser(agentSession);
    localStorage.setItem('site_visit_user', JSON.stringify(agentSession));
    triggerToast(`Impersonating Agent: ${agent.name}`, 'success');
  };

  // Submit agent registration
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const success = await createAgent(addForm);
    if (success) {
      setShowAddModal(false);
      setAddForm({ name: '', email: '', phone: '' });
      fetchDashboardStats();
    }
  };

  // Open edit modal helper
  const handleOpenEdit = (agent) => {
    setSelectedAgent(agent);
    setEditForm({
      name: agent.name,
      email: agent.email,
      phone: agent.phone
    });
    setShowEditModal(true);
  };

  // Submit agent edits
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAgent) return;

    const success = await updateAgent(selectedAgent.id, editForm);
    if (success) {
      setShowEditModal(false);
      setSelectedAgent(null);
      fetchDashboardStats();
    }
  };

  // Open delete modal helper
  const handleOpenDelete = (agent) => {
    setSelectedAgent(agent);
    setShowDeleteModal(true);
  };

  // Submit agent deletion
  const handleDeleteSubmit = async () => {
    if (!selectedAgent) return;

    const success = await deleteAgent(selectedAgent.id);
    if (success) {
      setShowDeleteModal(false);
      setSelectedAgent(null);
      fetchDashboardStats();
    }
  };

  // Combine lists of agents from general lookup and dashboard metrics
  const combinedAgents = agents.map(agent => {
    const stat = stats?.agentStats?.find(s => s.id === agent.id);
    return {
      ...agent,
      active_bookings: stat?.active_bookings ?? 0,
      total_bookings: stat?.total_bookings ?? 0,
      completed_bookings: stat?.completed_bookings ?? 0
    };
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Shield className="text-emerald-400 w-6 h-6 shrink-0" />
            Agent Account Directory & Access
          </h1>
          <p className="text-xs text-slate-400">View registered credentials, edit profile details, delete accounts, or impersonate sessions for system testing.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button 
            onClick={() => {
              setAddForm({ name: '', email: '', phone: '' });
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition shadow-md"
          >
            <UserPlus className="w-3.5 h-3.5 text-slate-950" />
            Register Agent
          </button>
          <button 
            onClick={fetchDashboardStats}
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Registry
          </button>
        </div>
      </div>

      {/* Security Callout Info */}
      <div className="glass-card p-4 rounded-2xl border border-slate-800 flex gap-3.5 items-start">
        <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
          <Key className="w-5 h-5" />
        </div>
        <div className="text-xs space-y-1 leading-relaxed">
          <span className="font-bold text-white block">System Access Rules</span>
          <p className="text-slate-400 font-light">
            All sales agents use their corporate email address and the unified default password <code className="bg-slate-950 px-1.5 py-0.5 rounded text-emerald-400 font-mono text-[10px]">agent123</code>. 
            Admins can add, edit, or remove agents, use credentials to authenticate manually, or impersonate sessions instantly.
          </p>
        </div>
      </div>

      {/* Main Registry List */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800">
        <h2 className="text-lg font-bold text-white mb-4">Registered Sales Executives</h2>
        
        {combinedAgents.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-500 italic">No agents registered in the database.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                  <th className="pb-3 font-semibold">Agent Name</th>
                  <th className="pb-3 font-semibold">Account Credentials</th>
                  <th className="pb-3 font-semibold">Availability</th>
                  <th className="pb-3 font-semibold text-center">Active Workload</th>
                  <th className="pb-3 font-semibold text-right">Access Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {combinedAgents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-slate-900/35 transition group">
                    {/* Profil / Name */}
                    <td className="py-4 pr-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-center text-slate-300 font-bold shrink-0">
                          {agent.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{agent.name}</div>
                          <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-600" /> {agent.phone}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email / PW */}
                    <td className="py-4 pr-3 text-xs space-y-1.5">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="font-medium">{agent.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="font-mono bg-slate-950/80 px-1.5 py-0.5 rounded text-[10px] border border-slate-850">agent123</span>
                      </div>
                    </td>

                    {/* Availability */}
                    <td className="py-4 pr-3 text-xs">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        agent.status === 'Available' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : agent.status === 'On Visit'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>
                        {agent.status}
                      </span>
                    </td>

                    {/* Workload */}
                    <td className="py-4 pr-3 text-center text-xs">
                      <div className="text-white font-bold">{agent.active_bookings} active</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">Total assignments: {agent.total_bookings}</div>
                    </td>

                    {/* Access Controls */}
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {/* Edit details */}
                        <button
                          onClick={() => handleOpenEdit(agent)}
                          title="Edit Agent details"
                          className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 p-2 rounded-xl text-xs transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>

                        {/* Delete agent */}
                        <button
                          onClick={() => handleOpenDelete(agent)}
                          title="Delete Agent"
                          className="bg-red-950/20 border border-red-900/30 hover:bg-red-950/40 text-red-400 p-2 rounded-xl text-xs transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {/* Copy details */}
                        <button
                          onClick={() => handleCopyCredentials(agent)}
                          title="Copy Email & Password"
                          className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 p-2 rounded-xl text-xs transition relative"
                        >
                          <Copy className="w-4 h-4" />
                          {copiedId === agent.id && (
                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-slate-950 font-extrabold text-[9px] px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap">
                              Copied!
                            </span>
                          )}
                        </button>

                        {/* Copy direct link */}
                        <button
                          onClick={() => handleCopyLoginLink(agent)}
                          title="Copy One-Click Login URL"
                          className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 p-2 rounded-xl text-xs transition relative"
                        >
                          <ExternalLink className="w-4 h-4" />
                          {copiedLinkId === agent.id && (
                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-emerald-600 text-slate-950 font-extrabold text-[9px] px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap">
                              Copied Link!
                            </span>
                          )}
                        </button>

                        {/* Direct Impersonation */}
                        <button
                          onClick={() => handleImpersonate(agent)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1 shadow-md shrink-0"
                        >
                          <User className="w-3.5 h-3.5" />
                          Login as Agent
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================================
          REGISTER NEW AGENT MODAL
          ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in-up">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border border-slate-800 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1">Register Sales Executive</h3>
            <p className="text-xs text-slate-400 mb-4">Add a new executive profile to the active directory.</p>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Full Name"
                  className="glass-input w-full py-2.5 px-3 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={addForm.email}
                  onChange={(e) => setAddForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com"
                  className="glass-input w-full py-2.5 px-3 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={addForm.phone}
                  onChange={(e) => setAddForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+919876543210"
                  className="glass-input w-full py-2.5 px-3 text-sm"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 font-semibold py-2 px-4 rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-2 px-4 rounded-xl text-xs transition"
                >
                  Register Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          EDIT AGENT PROFILE MODAL
          ========================================================================= */}
      {showEditModal && selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in-up">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border border-slate-800 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1">Edit Agent Profile</h3>
            <p className="text-xs text-slate-400 mb-4">Modify contact and account details for <span className="text-emerald-400 font-bold">{selectedAgent.name}</span>.</p>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Full Name"
                  className="glass-input w-full py-2 px-3 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com"
                  className="glass-input w-full py-2.5 px-3 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+919876543210"
                  className="glass-input w-full py-2.5 px-3 text-sm"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedAgent(null);
                  }}
                  className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 font-semibold py-2 px-4 rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-2 px-4 rounded-xl text-xs transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          DELETE CONFIRMATION MODAL
          ========================================================================= */}
      {showDeleteModal && selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in-up">
          <div className="glass-card max-sm w-full p-6 rounded-2xl border border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Remove Executive</h3>
            <p className="text-xs text-slate-400 leading-normal mb-4">
              Are you sure you want to remove <span className="text-red-400 font-bold">{selectedAgent.name}</span> from the executive directory?
            </p>
            
            <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-[10px] text-red-300 leading-normal mb-4">
              ⚠️ Warning: Deleting this agent will cause all their currently assigned site visits to revert to "Unassigned Agent". This action is permanent.
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedAgent(null);
                }}
                className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 font-semibold py-2 px-4 rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubmit}
                className="bg-red-600 hover:bg-red-500 text-slate-950 font-bold py-2 px-4 rounded-xl text-xs transition"
              >
                Remove Agent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentAccess;
