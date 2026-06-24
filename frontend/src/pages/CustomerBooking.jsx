import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calendar, Clock, MapPin, DollarSign, User, Phone, Mail, FileText, CheckCircle2, Building, ArrowRight, ArrowLeft } from 'lucide-react';
import AuroraCanvas from '../components/AuroraCanvas';

const CustomerBooking = ({ onNavigate }) => {
  const { createBooking, loading } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    preferred_date: '',
    preferred_time_slot: '10:00 AM - 12:00 PM',
    property_location: 'Yerragondapalem, Prakasam (96-Acre Red Sandalwood Farmland)',
    budget: '1 Acre (400 Sandalwood Trees) - ₹60L - ₹80L',
    notes: ''
  });

  const [bookingSuccess, setBookingSuccess] = useState(null);

  const locations = [
    'Yerragondapalem, Prakasam (96-Acre Red Sandalwood Farmland)',
    'Seshachalam Foothills Sector (Sandalwood Plot)',
    'Nallamala Native Sector (Sandalwood Block)',
    'Giddalur Range Farm (Sandalwood Plot)'
  ];

  const timeSlots = [
    '09:00 AM - 11:00 AM',
    '11:00 AM - 01:00 PM',
    '02:00 PM - 04:00 PM',
    '04:00 PM - 06:00 PM'
  ];

  const budgetRanges = [
    '1/4 Acre (100 Sandalwood Trees) - ₹15L - ₹25L',
    '1/2 Acre (200 Sandalwood Trees) - ₹30L - ₹45L',
    '1 Acre (400 Sandalwood Trees) - ₹60L - ₹80L',
    '2+ Acres (800+ Sandalwood Trees) - ₹1.2Cr+',
    'Custom Investment'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await createBooking(formData);
    if (result.success) {
      setBookingSuccess(result.booking);
    }
  };

  // Get tomorrow's date for date-picker min value
  const getTomorrowStr = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (bookingSuccess) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0 z-0">
          <img 
            src="/booking_success_bg.png" 
            alt="Township Background" 
            className="w-full h-full object-cover opacity-50"
          />
          <div className="dark-gradient-overlay" />
        </div>
        <div className="glass-confirmed-card max-w-lg w-full p-8 text-center animate-fade-in-up z-10">
          <div className="w-20 h-20 bg-[#B69344]/10 border border-[#B69344]/20 rounded-full flex items-center justify-center mx-auto mb-6 glow-checkmark">
            <CheckCircle2 className="w-10 h-10 text-[#B69344]" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">Visit Slot Confirmed!</h2>
          <p className="text-slate-400 mb-6">Your booking has been registered and verified by our system.</p>

          <div className="bg-slate-900/60 rounded-xl p-5 border border-slate-800 text-left mb-6 flex flex-col gap-3">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400 text-sm">Booking ID:</span>
              <span className="text-[#B69344] font-bold font-mono text-sm">{bookingSuccess.booking_code}</span>
            </div>
            <div>
              <span className="text-slate-400 text-xs block mb-1">Property Location:</span>
              <span className="text-white font-medium text-sm flex items-center gap-1.5">
                <Building className="w-4 h-4 text-[#B69344]" /> {bookingSuccess.property_location}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-1">
              <div>
                <span className="text-slate-400 text-xs block mb-0.5">Date:</span>
                <span className="text-white font-medium text-sm flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#B69344]" /> {bookingSuccess.preferred_date}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-xs block mb-0.5">Time Slot:</span>
                <span className="text-white font-medium text-sm flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#B69344]" /> {bookingSuccess.preferred_time_slot}
                </span>
              </div>
            </div>
            <div className="border-t border-slate-800 pt-3 mt-1">
              <span className="text-slate-400 text-xs block mb-1">Assigned Executive:</span>
              {bookingSuccess.agent_id ? (
                <div className="flex items-center justify-between">
                  <span className="text-[#B69344] font-semibold text-sm">{bookingSuccess.agent_name}</span>
                  <span className="bg-[#B69344]/10 text-[#B69344] text-[10px] px-2 py-0.5 rounded border border-[#B69344]/20 font-medium">Automatic Assigned</span>
                </div>
              ) : (
                <span className="text-slate-500 italic text-sm">Pending allocations</span>
              )}
            </div>
          </div>

          <p className="text-slate-400 text-xs leading-relaxed mb-6">
            A confirmation text notification has been queued and dispatched to <span className="text-[#B69344] font-medium">{formData.phone}</span>. Please keep this ID handy for entry during the site visit.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setBookingSuccess(null);
                setFormData({
                  name: '',
                  phone: '',
                  email: '',
                  preferred_date: '',
                  preferred_time_slot: '10:00 AM - 12:00 PM',
                  property_location: 'Yerragondapalem, Prakasam (96-Acre Red Sandalwood Farmland)',
                  budget: '1 Acre (400 Sandalwood Trees) - ₹60L - ₹80L',
                  notes: ''
                });
              }}
              className="flex-1 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-semibold py-3 px-6 rounded-xl transition duration-200"
            >
              Book Another Visit
            </button>
            {onNavigate && (
              <button
                onClick={() => {
                  setBookingSuccess(null);
                  onNavigate('landing');
                }}
                className="flex-1 bg-[#B69344] hover:bg-[#B69344]/90 text-slate-950 font-bold py-3 px-6 rounded-xl transition duration-200 flex items-center justify-center gap-2"
              >
                Return to Home
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

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
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight flex items-center justify-center gap-2 mb-2">
          <Building className="text-[#B69344] w-8 h-8 sm:w-10 sm:h-10" />
          LOHITHA DHARMA <span className="text-[#B69344] font-light">PROJECTS</span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base font-light">
          Red Sandalwood Farmland Booking Portal
        </p>
      </div>

      {/* Main card */}
      <div className="glass-confirmed-card max-w-xl w-full p-6 sm:p-8 border border-[#B69344]/10 animate-fade-in-up z-10">
        {onNavigate && (
          <button
            onClick={() => onNavigate('landing')}
            className="text-xs text-slate-400 hover:text-[#B69344] flex items-center gap-1 mb-6 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </button>
        )}

        <div className="mb-6 pb-4 border-b border-slate-800/80">
          <h2 className="text-xl font-bold text-white">Schedule Site Visit</h2>
          <p className="text-xs text-slate-400">Fill details below to secure a verification slot and meet with a client relation executive.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Full Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Ramesh Kulkarni"
                className="glass-input w-full py-2.5 pl-10 pr-4 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Phone Number *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. +91 9900000000"
                  className="glass-input w-full py-2.5 pl-10 pr-4 text-sm"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. ramesh@gmail.com"
                  className="glass-input w-full py-2.5 pl-10 pr-4 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Preferred Visit Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Preferred Date *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="date"
                  name="preferred_date"
                  required
                  min={getTomorrowStr()}
                  value={formData.preferred_date}
                  onChange={handleChange}
                  className="glass-input w-full py-2.5 pl-10 pr-4 text-sm text-white block"
                />
              </div>
            </div>

            {/* Preferred Time Slot */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Preferred Time Slot *</label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <select
                  name="preferred_time_slot"
                  value={formData.preferred_time_slot}
                  onChange={handleChange}
                  className="glass-input w-full py-2.5 pl-10 pr-4 text-sm appearance-none text-slate-200"
                >
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot} className="bg-slate-900 text-white">
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Property Location */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Property Location *</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <select
                name="property_location"
                value={formData.property_location}
                onChange={handleChange}
                className="glass-input w-full py-2.5 pl-10 pr-4 text-sm appearance-none text-slate-200"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc} className="bg-slate-900 text-white">
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Budget Range */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Budget Range</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <select
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                className="glass-input w-full py-2.5 pl-10 pr-4 text-sm appearance-none text-slate-200"
              >
                {budgetRanges.map((range) => (
                  <option key={range} value={range} className="bg-slate-900 text-white">
                    {range}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Additional Notes</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Mention any specific requirements or property choices..."
                rows="3"
                className="glass-input w-full py-2.5 pl-10 pr-4 text-sm"
              ></textarea>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#B69344] hover:bg-[#B69344]/90 text-slate-950 font-bold py-3 px-4 rounded-xl transition duration-200 mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Processing Schedule...' : 'Book Site Visit Slot'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default CustomerBooking;
