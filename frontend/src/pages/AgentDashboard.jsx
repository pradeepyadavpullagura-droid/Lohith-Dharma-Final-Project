import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, Clock, MapPin, RefreshCw, AlertCircle, FileText } from 'lucide-react';

const AgentDashboard = ({ onViewBooking }) => {
  const { bookings, fetchBookings, updateBookingStatus, updateAgentStatus, user, loading } = useApp();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  
  // Status form state
  const [statusForm, setStatusForm] = useState({
    status: '',
    notes: '',
    preferred_date: '',
    preferred_time_slot: '10:00 AM - 12:00 PM'
  });

  useEffect(() => {
    if (user && user.agentId) {
      fetchBookings({ agentId: user.agentId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleRefresh = () => {
    if (user && user.agentId) {
      fetchBookings({ agentId: user.agentId });
    }
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;

    const success = await updateBookingStatus({
      bookingId: selectedBooking.id,
      status: statusForm.status,
      notes: statusForm.notes,
      updatedBy: user.name,
      preferred_date: statusForm.status === 'Rescheduled' ? statusForm.preferred_date : undefined,
      preferred_time_slot: statusForm.status === 'Rescheduled' ? statusForm.preferred_time_slot : undefined
    });

    if (success) {
      setShowStatusModal(false);
      setSelectedBooking(null);
      handleRefresh();
    }
  };

  const openStatusModal = (booking) => {
    setSelectedBooking(booking);
    setStatusForm({
      status: booking.status === 'Pending' ? 'Approved' : booking.status,
      notes: '',
      preferred_date: booking.preferred_date,
      preferred_time_slot: booking.preferred_time_slot
    });
    setShowStatusModal(true);
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

  // Calculate quick stats from assigned bookings list
  const completedBookingsCount = bookings.filter(b => b.status === 'Completed').length;
  const pendingVisitsCount = bookings.filter(b => b.status === 'Approved').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-slate-400">Welcome back, <span className="text-emerald-400 font-bold">{user.name}</span>. Manage your scheduled site tours and submit customer feedback.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Availability Status Toggle */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-850 rounded-xl px-3 py-1.5 shadow-inner">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Availability:</span>
            <select
              value={user.status || 'Available'}
              onChange={async (e) => {
                const success = await updateAgentStatus(user.agentId, e.target.value);
                if (success) handleRefresh();
              }}
              className="bg-transparent text-xs text-emerald-400 font-bold border-none outline-none focus:ring-0 cursor-pointer appearance-none pr-1"
            >
              <option value="Available" className="bg-slate-950 text-emerald-400 font-semibold">Available</option>
              <option value="On Visit" className="bg-slate-950 text-amber-400 font-semibold">On Visit</option>
              <option value="Offline" className="bg-slate-950 text-slate-400 font-semibold">Offline</option>
            </select>
          </div>

          <button 
            onClick={handleRefresh}
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Visits
          </button>
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">Assigned Total</span>
          <span className="text-2xl sm:text-3xl font-black text-white mt-1 block">{bookings.length}</span>
        </div>
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">Approved / Upcoming</span>
          <span className="text-2xl sm:text-3xl font-black text-amber-400 mt-1 block">{pendingVisitsCount}</span>
        </div>
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <span className="text-slate-400 text-xs font-medium uppercase tracking-wider block">Completed Visits</span>
          <span className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 block">{completedBookingsCount}</span>
        </div>
      </div>

      {/* Main card - Schedule list */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800">
        <h2 className="text-lg font-bold text-white mb-4">My Scheduled Site Visits</h2>
        
        {bookings.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
            <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-3" />
            <p className="text-sm text-slate-400 font-medium">No site visits assigned yet</p>
            <p className="text-xs text-slate-500 mt-1">Check back later or contact admin for listings assignment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookings.map((booking) => (
              <div 
                key={booking.id}
                className="bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800 hover:border-emerald-500/25 rounded-2xl p-5 flex flex-col justify-between transition duration-200"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span 
                      onClick={() => onViewBooking(booking.id)}
                      className="text-white font-bold hover:text-emerald-400 transition cursor-pointer font-sans text-sm"
                    >
                      {booking.customer_name}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getStatusBadge(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{booking.preferred_date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{booking.preferred_time_slot}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate max-w-[250px]">{booking.property_location}</span>
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="mt-4 p-2.5 bg-slate-950/80 rounded-lg border border-slate-850/60 text-[11px] text-slate-400 flex items-start gap-1.5 leading-normal">
                      <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span>{booking.notes}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-850 flex gap-2 justify-end">
                  <button
                    onClick={() => onViewBooking(booking.id)}
                    className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded transition"
                  >
                    View History
                  </button>
                  <button
                    onClick={() => openStatusModal(booking)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold py-1.5 px-3 rounded-lg transition"
                  >
                    Update Status
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =========================================================================
          AGENT STATUS UPDATE MODAL
          ========================================================================= */}
      {showStatusModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in-up">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border border-slate-800 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1">Update Site Tour Result</h3>
            <p className="text-xs text-slate-400 mb-4">Submit visit feedback for <span className="text-emerald-400 font-mono font-bold">{selectedBooking.booking_code}</span>.</p>

            <form onSubmit={handleStatusSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Select Outcome</label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, status: e.target.value }))}
                  className="glass-input w-full py-2 px-3 text-sm appearance-none text-slate-200"
                >
                  <option value="Approved" className="bg-slate-900">Approved / Scheduled</option>
                  <option value="Completed" className="bg-slate-900">Completed (Successful Visit)</option>
                  <option value="Rescheduled" className="bg-slate-900">Rescheduled (Customer requested)</option>
                  <option value="Cancelled" className="bg-slate-900">Cancelled</option>
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
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Visit Notes / Client Feedback</label>
                <textarea
                  required
                  value={statusForm.notes}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="e.g. Client loved the kitchen layout, will consult family and follow up on Monday..."
                  rows="3"
                  className="glass-input w-full py-2 px-3 text-xs"
                ></textarea>
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
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentDashboard;
