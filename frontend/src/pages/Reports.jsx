import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { FileDown, Printer, Search, Calendar, RefreshCw, BarChart3, PieChart, Info } from 'lucide-react';

const Reports = () => {
  const { bookings, agents, fetchBookings, loading } = useApp();
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    agentId: '',
    date: ''
  });

  useEffect(() => {
    fetchBookings(filters);
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleRefresh = () => {
    fetchBookings(filters);
  };

  // Dynamic calculations for report cards & custom SVG charts
  const totalBookings = bookings.length;
  const statusCounts = bookings.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {});

  const locationCounts = bookings.reduce((acc, curr) => {
    acc[curr.property_location] = (acc[curr.property_location] || 0) + 1;
    return acc;
  }, {});

  // Convert and export table to CSV format
  const handleExportCSV = () => {
    if (bookings.length === 0) return;
    
    const headers = [
      'Booking Code', 'Customer Name', 'Customer Phone', 'Customer Email', 
      'Preferred Date', 'Time Slot', 'Property Location', 'Budget', 
      'Assigned Agent', 'Booking Status', 'Notes'
    ];

    const rows = bookings.map(b => [
      b.booking_code,
      b.customer_name,
      b.customer_phone,
      b.customer_email,
      b.preferred_date,
      b.preferred_time_slot,
      `"${b.property_location.replace(/"/g, '""')}"`,
      b.budget || 'N/A',
      b.agent_name || 'Unassigned',
      b.status,
      `"${(b.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `site_visits_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print optimized layout
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in-up print:p-0 print:bg-white print:text-black">
      {/* Header (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Reports & Performance Audit</h1>
          <p className="text-xs text-slate-400">Export datasets, download client logs, and view property slot allocations.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            disabled={bookings.length === 0}
            className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-emerald-400 disabled:opacity-50 px-4 py-2 rounded-xl text-xs font-semibold transition"
          >
            <FileDown className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-950" />
            Print Report
          </button>
        </div>
      </div>

      {/* Printable Sheet Header (Visible only in Print) */}
      <div className="hidden print:block mb-8 pb-4 border-b-2 border-slate-900">
        <h1 className="text-3xl font-bold text-slate-900">Lohith Dharma Plots - Site Visit Report</h1>
        <p className="text-xs text-slate-600 mt-1">Generated: {new Date().toLocaleDateString()} | Active Listings Audit Logs</p>
      </div>

      {/* Custom SVG Charts Block (Hidden in Print) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
        {/* Conversion breakdown */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-emerald-400" /> Visit Status Breakdown
            </h3>
            <p className="text-[10px] text-slate-400 mb-6">Percentage of site visit allocations.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* SVG Pie Chart */}
            <div className="relative w-36 h-36 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="var(--color-slate-850)" strokeWidth="3"></circle>
                
                {/* Dynamically build stacked circular segments */}
                {(() => {
                  let offset = 0;
                  return Object.entries(statusCounts).map(([status, count], i) => {
                    const percentage = (count / totalBookings) * 100;
                    const dashArray = `${percentage} ${100 - percentage}`;
                    const dashOffset = 100 - offset;
                    offset += percentage;

                    // Choose colors
                    let color = '#94a3b8'; // default slate
                    if (status === 'Completed') color = '#3b82f6';
                    if (status === 'Approved') color = '#10b981';
                    if (status === 'Pending') color = '#f59e0b';
                    if (status === 'Cancelled' || status === 'Rejected') color = '#ef4444';

                    return (
                      <circle 
                        key={status}
                        cx="18" cy="18" r="15.915" 
                        fill="transparent" 
                        stroke={color} 
                        strokeWidth="3.5" 
                        strokeDasharray={dashArray} 
                        strokeDashoffset={dashOffset}
                        className="transition-all duration-500"
                      />
                    );
                  });
                })()}
              </svg>
            </div>

            {/* Legends */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full text-[11px]">
              {Object.entries(statusCounts).map(([status, count]) => {
                let bulletColor = 'bg-slate-400';
                if (status === 'Completed') bulletColor = 'bg-blue-500';
                if (status === 'Approved') bulletColor = 'bg-emerald-500';
                if (status === 'Pending') bulletColor = 'bg-amber-500';
                if (status === 'Cancelled' || status === 'Rejected') bulletColor = 'bg-red-500';

                return (
                  <div key={status} className="flex items-center gap-1.5 text-slate-300">
                    <span className={`w-2.5 h-2.5 rounded-full ${bulletColor}`}></span>
                    <span className="capitalize font-medium">{status}: {count} ({Math.round((count/totalBookings)*100)}%)</span>
                  </div>
                );
              })}
              {totalBookings === 0 && <span className="text-slate-500 italic">No bookings recorded</span>}
            </div>
          </div>
        </div>

        {/* Location Interest Bar Chart */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-emerald-400" /> Location-wise Interest
          </h3>
          <p className="text-[10px] text-slate-400 mb-6 font-light">Distribution of client requests per plot/apartment project.</p>
          
          <div className="space-y-3">
            {Object.entries(locationCounts).map(([loc, count]) => {
              const percentage = totalBookings > 0 ? (count / totalBookings) * 100 : 0;
              return (
                <div key={loc} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-medium">
                    <span className="text-white truncate max-w-[200px]">{loc}</span>
                    <span className="text-slate-400">{count} visits</span>
                  </div>
                  <div className="w-full bg-slate-900 border border-slate-800 rounded-full h-2">
                    <div 
                      className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
            {Object.keys(locationCounts).length === 0 && (
              <span className="text-xs text-slate-500 italic block py-4 text-center">No location metrics available.</span>
            )}
          </div>
        </div>
      </div>

      {/* Reports Filter block (Hidden in Print) */}
      <div className="glass-card p-5 rounded-2xl border border-slate-800 flex flex-wrap items-center gap-3 print:hidden">
        <div className="flex items-center gap-1.5 text-slate-300 font-bold text-xs pr-2 border-r border-slate-800">
          <Search className="w-3.5 h-3.5 text-emerald-400" /> Filters
        </div>
        
        {/* Search */}
        <input
          type="text"
          name="search"
          value={filters.search}
          onChange={handleFilterChange}
          placeholder="Client name, code..."
          className="glass-input py-1 px-3 text-xs w-full sm:w-40"
        />

        {/* Status */}
        <select
          name="status"
          value={filters.status}
          onChange={handleFilterChange}
          className="glass-input py-1 px-3 text-xs text-slate-200"
        >
          <option value="" className="bg-slate-900">All Statuses</option>
          <option value="Pending" className="bg-slate-900">Pending</option>
          <option value="Approved" className="bg-slate-900">Approved</option>
          <option value="Rescheduled" className="bg-slate-900">Rescheduled</option>
          <option value="Completed" className="bg-slate-900">Completed</option>
          <option value="Cancelled" className="bg-slate-900">Cancelled</option>
          <option value="Rejected" className="bg-slate-900">Rejected</option>
        </select>

        {/* Agent */}
        <select
          name="agentId"
          value={filters.agentId}
          onChange={handleFilterChange}
          className="glass-input py-1 px-3 text-xs text-slate-200"
        >
          <option value="" className="bg-slate-900">All Agents</option>
          {agents.map(a => (
            <option key={a.id} value={a.id} className="bg-slate-900">{a.name}</option>
          ))}
        </select>

        {/* Date */}
        <input
          type="date"
          name="date"
          value={filters.date}
          onChange={handleFilterChange}
          className="glass-input py-1 px-3 text-xs text-slate-200"
        />

        <button
          onClick={handleRefresh}
          className="bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-white p-1 rounded transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Reports Table Sheet */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 print:border-0 print:p-0">
        <div className="mb-4 flex justify-between items-center print:mb-6">
          <div>
            <h3 className="text-base font-bold text-white print:text-black">Audit Sheets</h3>
            <span className="text-[10px] text-slate-400 print:text-slate-600 block mt-0.5">Total Records: {bookings.length} listings</span>
          </div>
          <span className="text-[10px] text-slate-500 hidden print:block">Printed on: {new Date().toLocaleDateString()}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse print:text-black">
            <thead>
              <tr className="border-b border-slate-800 print:border-slate-400 text-[10px] uppercase font-bold text-slate-400 print:text-slate-800">
                <th className="pb-3">Booking Code</th>
                <th className="pb-3">Client Details</th>
                <th className="pb-3">Schedule</th>
                <th className="pb-3">Property Location</th>
                <th className="pb-3">Agent</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 print:divide-slate-200">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500 italic">No visit logs match selected filters.</td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-900/10 print:hover:bg-transparent transition">
                    <td className="py-3 font-mono font-bold text-emerald-400 print:text-slate-900">{booking.booking_code}</td>
                    <td className="py-3">
                      <div className="font-semibold text-white print:text-slate-900">{booking.customer_name}</div>
                      <div className="text-[10px] text-slate-400 print:text-slate-600">{booking.customer_phone}</div>
                    </td>
                    <td className="py-3">
                      <div className="text-white print:text-slate-900 font-medium">{booking.preferred_date}</div>
                      <div className="text-[10px] text-slate-400 print:text-slate-600">{booking.preferred_time_slot}</div>
                    </td>
                    <td className="py-3 text-slate-300 print:text-slate-900 truncate max-w-[180px]">{booking.property_location}</td>
                    <td className="py-3 text-slate-300 print:text-slate-900 font-medium">{booking.agent_name || 'Unassigned'}</td>
                    <td className="py-3 text-right">
                      <span className="font-bold uppercase text-[9px]">{booking.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
