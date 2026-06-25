import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ArrowLeft, Calendar, Clock, Building, DollarSign, 
  User, Phone, Mail, Bell, MessageCircle, Trash2, Pencil 
} from 'lucide-react';

const BookingDetails = ({ bookingId, onBack }) => {
  const { fetchBookingDetails, deleteBooking, updateBooking, user, loading } = useApp();
  const [data, setData] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    preferred_date: '',
    preferred_time_slot: '10:00 AM - 12:00 PM',
    property_location: '',
    budget: '',
    notes: ''
  });

  const openEditModal = () => {
    if (!data || !data.booking) return;
    const { booking } = data;
    setEditForm({
      name: booking.customer_name || '',
      phone: booking.customer_phone || '',
      email: booking.customer_email || '',
      preferred_date: booking.preferred_date || '',
      preferred_time_slot: booking.preferred_time_slot || '10:00 AM - 12:00 PM',
      property_location: booking.property_location || '',
      budget: booking.budget || '',
      notes: booking.notes || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const success = await updateBooking(bookingId, editForm);
    if (success) {
      setShowEditModal(false);
      // Reload details
      const details = await fetchBookingDetails(bookingId);
      if (details) {
        setData(details);
      }
    }
  };

  const handleDeleteSubmit = async (e) => {
    e.preventDefault();
    const success = await deleteBooking(bookingId);
    if (success) {
      setShowDeleteModal(false);
      onBack();
    }
  };

  useEffect(() => {
    const loadDetails = async () => {
      const details = await fetchBookingDetails(bookingId);
      if (details) {
        setData(details);
      }
    };
    if (bookingId) {
      loadDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-sm text-slate-400">Loading booking trace files...</div>
      </div>
    );
  }

  const { booking, history, notifications } = data;

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

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fade-in-up">
      {/* Back Header */}
      <div>
        <button
          onClick={onBack}
          className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 transition mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
        </button>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Booking Audit Trace: <span className="font-mono text-emerald-400">{booking.booking_code}</span>
            </h1>
            <p className="text-xs text-slate-400">Review status logs, workflow modifications, and notification histories.</p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusBadge(booking.status)}`}>
              {booking.status}
            </span>
            {user?.role === 'admin' && (
              <>
                <button
                  onClick={openEditModal}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold py-1.5 px-3 rounded-xl text-xs border border-slate-750 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit Booking
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-red-950/40 hover:bg-red-900/60 text-red-400 font-semibold py-1.5 px-3 rounded-xl text-xs border border-red-900/30 hover:border-red-800 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Booking
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Customer & Agent Details Card */}
        <div className="space-y-6 md:col-span-1">
          {/* Customer Profile */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pb-1 border-b border-slate-850">Customer Profile</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-xs">
                <User className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-white font-semibold">{booking.customer_name}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{booking.customer_phone}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{booking.customer_email}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300 border-t border-slate-850 pt-2.5 mt-2.5">
                <DollarSign className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Budget: {booking.budget || 'Not specified'}</span>
              </div>
            </div>
          </div>

          {/* Site Tour Logistics */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pb-1 border-b border-slate-850">Site Tour Logistics</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 text-xs">
                <Building className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-white font-medium">{booking.property_location}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Date: {booking.preferred_date}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Slot: {booking.preferred_time_slot}</span>
              </div>
            </div>
          </div>

          {/* Assigned Representative */}
          <div className="glass-card p-5 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 pb-1 border-b border-slate-850">Assigned Representative</h3>
            {booking.agent_id ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2.5 text-xs">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 flex items-center justify-center font-bold">
                    {booking.agent_name.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <span className="text-white font-semibold">{booking.agent_name}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{booking.agent_phone}</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-300">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{booking.agent_email}</span>
                </div>
              </div>
            ) : (
              <span className="text-xs text-slate-500 italic">No representative has been allocated yet.</span>
            )}
          </div>
        </div>

        {/* Audit History and Logs Column */}
        <div className="md:col-span-2 space-y-6">
          
          {/* WorkFlow Status Audit Logs */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-6">Workflow Audit Timeline</h3>
            <div className="relative pl-6 border-l border-slate-800 space-y-6">
              {history.map((log) => (
                <div key={log.id} className="relative">
                  {/* Circle Indicator */}
                  <span className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-slate-950 border-2 border-emerald-500 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                  </span>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white font-bold">Status: {log.status}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Changed by: <span className="text-emerald-400 font-medium">{log.updated_by}</span>
                    </div>
                    {log.notes && (
                      <p className="bg-slate-900/40 border border-slate-850 p-2.5 rounded-lg text-slate-300 text-xs mt-1.5 leading-normal">
                        {log.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications Log */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-4">Notification Dispatch History</h3>
            <div className="space-y-3.5">
              {notifications.length === 0 ? (
                <div className="text-xs text-slate-500 italic py-4 text-center">No alerts logged.</div>
              ) : (
                notifications.map((noti) => (
                  <div key={noti.id} className="p-3.5 bg-slate-900/40 border border-slate-800 rounded-xl space-y-2 text-xs">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="flex items-center gap-1.5 font-semibold text-white">
                        {noti.type === 'WhatsApp' ? (
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Bell className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        {noti.type} Broadcast
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                        noti.status === 'Sent' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {noti.status}
                      </span>
                    </div>
                    <p className="text-slate-300 font-light leading-relaxed">{noti.message}</p>
                    <div className="flex justify-between text-[9px] text-slate-500 border-t border-slate-850/60 pt-1.5">
                      <span>To: {noti.recipient}</span>
                      <span>Dispatch: {new Date(noti.sent_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in-up">
          <div className="glass-card max-w-sm w-full p-6 rounded-2xl border border-slate-800 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Delete Site Visit Booking</h3>
            <p className="text-xs text-slate-400 mb-4">
              Are you sure you want to permanently delete booking <span className="text-red-400 font-mono font-bold">{booking.booking_code}</span>?
            </p>

            <form onSubmit={handleDeleteSubmit} className="space-y-4">
              <div className="flex gap-2.5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 leading-normal font-light">
                <Trash2 className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                This action is permanent. Deleting this booking will also erase the audit timeline, WhatsApp dispatch history, and release any assigned agents.
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                  }}
                  className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 font-semibold py-2 px-4 rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-650 hover:bg-red-650/85 text-white font-bold py-2 px-4 rounded-xl text-xs transition"
                >
                  Delete Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          EDIT BOOKING MODAL
          ========================================================================= */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fade-in-up py-8">
          <div className="glass-card max-w-lg w-full p-6 rounded-2xl border border-slate-800 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1">Edit Booking Details</h3>
            <p className="text-xs text-slate-400 mb-4">Modify customer and visit logistics for <span className="text-emerald-400 font-mono font-bold">{booking.booking_code}</span>.</p>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              {/* Customer Profile Section */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-850 pb-1">Customer Profile</h4>
                
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Customer Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="glass-input w-full py-1.5 px-3 text-xs"
                    placeholder="Full Name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={editForm.phone}
                      onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="glass-input w-full py-1.5 px-3 text-xs"
                      placeholder="+919900000000"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      className="glass-input w-full py-1.5 px-3 text-xs"
                      placeholder="name@email.com"
                    />
                  </div>
                </div>
              </div>

              {/* Site Tour Logistics Section */}
              <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-850 pb-1">Site Tour Logistics</h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Preferred Date</label>
                    <input
                      type="date"
                      required
                      value={editForm.preferred_date}
                      onChange={(e) => setEditForm(prev => ({ ...prev, preferred_date: e.target.value }))}
                      className="glass-input w-full py-1.5 px-3 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Preferred Time Slot</label>
                    <select
                      value={editForm.preferred_time_slot}
                      onChange={(e) => setEditForm(prev => ({ ...prev, preferred_time_slot: e.target.value }))}
                      className="glass-input w-full py-1.5 px-3 text-xs text-slate-200"
                    >
                      <option value="09:00 AM - 11:00 AM" className="bg-slate-900">09:00 AM - 11:00 AM</option>
                      <option value="11:00 AM - 01:00 PM" className="bg-slate-900">11:00 AM - 01:00 PM</option>
                      <option value="02:00 PM - 04:00 PM" className="bg-slate-900">02:00 PM - 04:00 PM</option>
                      <option value="04:00 PM - 06:00 PM" className="bg-slate-900">04:00 PM - 06:00 PM</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Property Location</label>
                  <input
                    type="text"
                    required
                    value={editForm.property_location}
                    onChange={(e) => setEditForm(prev => ({ ...prev, property_location: e.target.value }))}
                    className="glass-input w-full py-1.5 px-3 text-xs"
                    placeholder="e.g. Greenwood Residency, Sector 45"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Budget Option</label>
                  <input
                    type="text"
                    value={editForm.budget}
                    onChange={(e) => setEditForm(prev => ({ ...prev, budget: e.target.value }))}
                    className="glass-input w-full py-1.5 px-3 text-xs"
                    placeholder="e.g. ₹80L - ₹1.2Cr"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Notes / Remarks</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional requests or specifications..."
                    rows="2"
                    className="glass-input w-full py-1.5 px-3 text-xs"
                  ></textarea>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                  }}
                  className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 font-semibold py-2 px-4 rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-2 px-4 rounded-xl text-xs transition cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingDetails;
