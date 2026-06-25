import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, Calendar, Clock, CheckCircle2, Search, 
  UserPlus, RefreshCw, Send, ChevronRight, MessageSquare 
} from 'lucide-react';

const AdminDashboard = ({ onViewBooking }) => {
  const { 
    bookings, stats, agents, fetchBookings, fetchDashboardStats, 
    updateBookingStatus, assignAgent, loading 
  } = useApp();

  const [filters, setFilters] = useState({ search: '', status: '', agentId: '' });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Status Modal State
  const [statusForm, setStatusForm] = useState({
    status: '',
    notes: '',
    preferred_date: '',
    preferred_time_slot: '10:00 AM - 12:00 PM'
  });

  // Assign Modal State
  const [selectedAgentId, setSelectedAgentId] = useState('');

  useEffect(() => {
    fetchBookings(filters);
    fetchDashboardStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleRefresh = () => {
    fetchBookings(filters);
    fetchDashboardStats();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Status Update Submit
  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    
    const success = await updateBookingStatus({
      bookingId: selectedBooking.id,
      status: statusForm.status,
      notes: statusForm.notes,
      updatedBy: 'Admin',
      preferred_date: statusForm.status === 'Rescheduled' ? statusForm.preferred_date : undefined,
      preferred_time_slot: statusForm.status === 'Rescheduled' ? statusForm.preferred_time_slot : undefined
    });

    if (success) {
      setShowStatusModal(false);
      setSelectedBooking(null);
      handleRefresh();
    }
  };

  // Agent Assignment Submit
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBooking || !selectedAgentId) return;

    const success = await assignAgent(selectedBooking.id, selectedAgentId);
    if (success) {
      setShowAssignModal(false);
      setSelectedBooking(null);
      setSelectedAgentId('');
      handleRefresh();
    }
  };

  const openStatusModal = (booking) => {
    setSelectedBooking(booking);
    setStatusForm({
      status: booking.status,
      notes: '',
      preferred_date: booking.preferred_date,
      preferred_time_slot: booking.preferred_time_slot
    });
    setShowStatusModal(true);
  };

  const openAssignModal = (booking) => {
    setSelectedBooking(booking);
    setSelectedAgentId(booking.agent_id || '');
    setShowAssignModal(true);
  };

  // Helper to get status badge classes
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Pending':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'Completed':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'Cancelled':
      case 'Rejected':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'Rescheduled':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  // WhatsApp Web Redirection helper
  const sendWhatsAppSim = (recipient, message) => {
    const cleaned = recipient.replace(/[^\d+]/g, '');
    const url = `https://api.whatsapp.com/send?phone=${cleaned}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Admin Operations Control</h1>
          <p className="text-xs text-slate-400">Monitor and automate property site visits, agent assignments, and customer notifications.</p>
        </div>
        <button 
          onClick={handleRefresh}
          className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Dash
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">Total Enquiries</span>
                <span className="text-3xl font-black text-white mt-1 block">{stats.totalLeads}</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </div>
          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">Scheduled Today</span>
                <span className="text-3xl font-black text-amber-400 mt-1 block">{stats.todayVisits}</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <Calendar className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </div>
          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">Pending Approval</span>
                <span className="text-3xl font-black text-rose-400 mt-1 block">{stats.pendingVisits}</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <Clock className="w-5 h-5 text-rose-400" />
              </div>
            </div>
          </div>
          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">Completed Visits</span>
                <span className="text-3xl font-black text-emerald-400 mt-1 block">{stats.completedVisits}</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bookings Table Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card p-6 rounded-2xl border border-slate-800">
            
            {/* Filters Header */}
            <div className="flex flex-col md:flex-row gap-3 mb-6 justify-between items-start md:items-center">
              <h2 className="text-lg font-bold text-white">Leads & Bookings</h2>
              
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {/* Search */}
                <div className="relative flex-1 md:w-60">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Search name, code, phone..."
                    className="glass-input w-full py-1.5 pl-9 pr-3 text-xs"
                  />
                </div>
                {/* Filter status */}
                <div className="relative">
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="glass-input py-1.5 pl-3 pr-8 text-xs appearance-none text-slate-200"
                  >
                    <option value="" className="bg-slate-900">All Statuses</option>
                    <option value="Pending" className="bg-slate-900">Pending</option>
                    <option value="Approved" className="bg-slate-900">Approved</option>
                    <option value="Rescheduled" className="bg-slate-900">Rescheduled</option>
                    <option value="Completed" className="bg-slate-900">Completed</option>
                    <option value="Cancelled" className="bg-slate-900">Cancelled</option>
                    <option value="Rejected" className="bg-slate-900">Rejected</option>
                  </select>
                </div>
                {/* Filter agent */}
                <div className="relative">
                  <select
                    name="agentId"
                    value={filters.agentId}
                    onChange={handleFilterChange}
                    className="glass-input py-1.5 pl-3 pr-8 text-xs appearance-none text-slate-200"
                  >
                    <option value="" className="bg-slate-900">All Agents</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id} className="bg-slate-900">{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Bookings Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                    <th className="pb-3 font-semibold">Lead Details</th>
                    <th className="pb-3 font-semibold">Visit Schedule</th>
                    <th className="pb-3 font-semibold">Agent Assigned</th>
                    <th className="pb-3 font-semibold text-center">Status</th>
                    <th className="pb-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-xs text-slate-500 italic">No bookings match the filter criteria.</td>
                    </tr>
                  ) : (
                    bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-slate-900/35 transition group">
                        {/* Lead Name & Code */}
                        <td className="py-4 pr-3">
                          <div className="font-bold text-white text-sm group-hover:text-emerald-400 transition cursor-pointer flex items-center gap-1" onClick={() => onViewBooking(booking.id)}>
                            {booking.customer_name} <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-emerald-400 transition" />
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">{booking.booking_code} | {booking.customer_phone}</span>
                        </td>
                        {/* Date & Time / Location */}
                        <td className="py-4 pr-3 text-xs">
                          <div className="text-white font-medium">{booking.preferred_date}</div>
                          <div className="text-slate-400 text-[10px]">{booking.preferred_time_slot}</div>
                          <span className="text-[10px] text-slate-500 block truncate max-w-[150px]">{booking.property_location}</span>
                        </td>
                        {/* Assigned Agent */}
                        <td className="py-4 pr-3 text-xs">
                          {booking.agent_id ? (
                            <div>
                              <div className="text-white font-medium">{booking.agent_name}</div>
                              <button 
                                onClick={() => openAssignModal(booking)}
                                className="text-[10px] text-emerald-400 hover:underline flex items-center gap-0.5 mt-0.5"
                              >
                                Reassign
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => openAssignModal(booking)}
                              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[10px] border border-amber-500/20 px-2 py-0.5 rounded font-medium flex items-center gap-1"
                            >
                              <UserPlus className="w-3 h-3" /> Assign Executive
                            </button>
                          )}
                        </td>
                        {/* Status */}
                        <td className="py-4 pr-3 text-center">
                          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusBadge(booking.status)}`}>
                            {booking.status}
                          </span>
                        </td>
                        {/* Actions */}
                        <td className="py-4 text-right">
                          <button
                            onClick={() => openStatusModal(booking)}
                            className="bg-slate-800 hover:bg-slate-700 text-white font-semibold py-1 px-2.5 rounded text-[10px] border border-slate-750 transition"
                          >
                            Update
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Panel (Agent Workloads & Notifications) */}
        <div className="space-y-6">
          
          {/* Agent status workload cards */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800">
            <h2 className="text-base font-bold text-white mb-4">Agent Allocation Status</h2>
            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
              {stats && stats.agentStats.map((agent) => (
                <div key={agent.id} className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-white font-bold block">{agent.name}</span>
                    <span className="text-[10px] text-slate-500 block">Active: {agent.active_bookings} | Total: {agent.total_bookings}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    agent.status === 'Available' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : agent.status === 'On Visit'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                  }`}>
                    {agent.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* System Notifications Log */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800">
            <h2 className="text-base font-bold text-white mb-1">WhatsApp Broadcast Log</h2>
            <p className="text-[10px] text-slate-400 mb-4">Simulate triggers and view sent text messages instantly.</p>
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {stats && stats.recentNotifications.map((noti) => (
                <div key={noti.id} className="p-3 bg-slate-900/50 border border-slate-800/60 rounded-xl text-[11px] space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                    <span className="font-mono text-emerald-400">{noti.booking_code}</span>
                    <span>{new Date(noti.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-white leading-relaxed font-light">{noti.message}</p>
                  <div className="flex justify-between items-center pt-1.5 border-t border-slate-850/80">
                    <span className="text-[9px] text-slate-500">{noti.recipient}</span>
                    <button
                      onClick={() => sendWhatsAppSim(noti.recipient, noti.message)}
                      className="text-[9px] text-emerald-400 font-bold hover:underline flex items-center gap-1"
                    >
                      <Send className="w-2.5 h-2.5 text-emerald-400" /> Send via Web API
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* =========================================================================
          STATUS UPDATE MODAL
          ========================================================================= */}
      {showStatusModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in-up">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border border-slate-800 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1">Update Booking Status</h3>
            <p className="text-xs text-slate-400 mb-4">Update status for booking <span className="text-emerald-400 font-mono font-bold">{selectedBooking.booking_code}</span>.</p>

            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Select Status</label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, status: e.target.value }))}
                  className="glass-input w-full py-2 px-3 text-sm appearance-none text-slate-200"
                >
                  <option value="Pending" className="bg-slate-900">Pending</option>
                  <option value="Approved" className="bg-slate-900">Approved</option>
                  <option value="Rescheduled" className="bg-slate-900">Rescheduled</option>
                  <option value="Completed" className="bg-slate-900">Completed</option>
                  <option value="Cancelled" className="bg-slate-900">Cancelled</option>
                  <option value="Rejected" className="bg-slate-900">Rejected</option>
                </select>
              </div>

              {/* Conditional Reschedule Fields */}
              {statusForm.status === 'Rescheduled' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/40 rounded-lg border border-slate-800">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">New Date</label>
                    <input
                      type="date"
                      required
                      value={statusForm.preferred_date}
                      onChange={(e) => setStatusForm(prev => ({ ...prev, preferred_date: e.target.value }))}
                      className="glass-input w-full py-1.5 px-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">New Time Slot</label>
                    <select
                      value={statusForm.preferred_time_slot}
                      onChange={(e) => setStatusForm(prev => ({ ...prev, preferred_time_slot: e.target.value }))}
                      className="glass-input w-full py-1.5 px-2 text-xs"
                    >
                      <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</option>
                      <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM</option>
                      <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                      <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Status Update Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Remarks / Remarks for customer notification</label>
                <textarea
                  value={statusForm.notes}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Provide brief details about this decision (sent or saved as history)..."
                  rows="3"
                  className="glass-input w-full py-2 px-3 text-xs"
                ></textarea>
              </div>

              {/* Alert notice */}
              <div className="flex gap-2 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-[10px] text-emerald-300 leading-normal">
                <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                Updating status will automatically trigger and queue the appropriate WhatsApp template dispatch to {selectedBooking.customer_name}.
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 font-semibold py-2 px-4 rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-2 px-4 rounded-xl text-xs transition"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          AGENT ASSIGNMENT MODAL
          ========================================================================= */}
      {showAssignModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in-up">
          <div className="glass-card max-w-sm w-full p-6 rounded-2xl border border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Assign Sales Executive</h3>
            <p className="text-xs text-slate-400 mb-4">Choose agent to assign to booking <span className="text-emerald-400 font-mono font-bold">{selectedBooking.booking_code}</span>.</p>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Select Executive</label>
                <select
                  required
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="glass-input w-full py-2 px-3 text-sm appearance-none text-slate-200"
                >
                  <option value="" disabled className="bg-slate-900">Choose an agent...</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id} className="bg-slate-900">
                      {agent.name} ({agent.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Recommendation logic description */}
              <div className="flex gap-2 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-[10px] text-emerald-300 leading-normal">
                <UserPlus className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                Assigning an executive updates their workload count. A text verification alert will be queued for the customer.
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 font-semibold py-2 px-4 rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-2 px-4 rounded-xl text-xs transition"
                >
                  Assign Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
