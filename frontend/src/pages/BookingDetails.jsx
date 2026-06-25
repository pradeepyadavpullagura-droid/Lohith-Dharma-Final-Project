import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ArrowLeft, Calendar, Clock, Building, DollarSign, 
  User, Phone, Mail, Bell, MessageCircle 
} from 'lucide-react';

const BookingDetails = ({ bookingId, onBack }) => {
  const { fetchBookingDetails, loading } = useApp();
  const [data, setData] = useState(null);

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
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusBadge(booking.status)}`}>
            {booking.status}
          </span>
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
    </div>
  );
};

export default BookingDetails;
