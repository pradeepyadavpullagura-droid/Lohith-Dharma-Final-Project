/* eslint-disable react-refresh/only-export-components, no-unused-vars */
import React, { createContext, useState, useEffect, useContext } from 'react';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('site_visit_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [agents, setAgents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const API_BASE = import.meta.env.VITE_API_BASE || '/api';

  // Show dynamic toast notifications
  const triggerToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Fetch agents dropdown data
  const fetchAgents = async () => {
    try {
      const res = await fetch(`${API_BASE}/agents`);
      const data = await res.json();
      if (data.success) {
        setAgents(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    }
  };

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'agent')) {
      fetchAgents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Auth Functions
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('site_visit_user', JSON.stringify(data.user));
        triggerToast(`Welcome back, ${data.user.name}!`);
        return { success: true };
      } else {
        triggerToast(data.message, 'error');
        return { success: false, message: data.message };
      }
    } catch (err) {
      triggerToast('Server connection failed', 'error');
      return { success: false, message: 'Server connection failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('site_visit_user');
    triggerToast('Logged out successfully');
  };

  // Create site visit booking (lead form submission)
  const createBooking = async (bookingData) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/create-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      const data = await res.json();
      if (data.success) {
        triggerToast('Site visit booking submitted successfully!');
        return { success: true, booking: data.data };
      } else {
        triggerToast(data.message, 'error');
        return { success: false, message: data.message };
      }
    } catch (err) {
      triggerToast('Booking submission failed. Please try again.', 'error');
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Fetch all bookings (with optional filters)
  const fetchBookings = async (filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.agentId) params.append('agentId', filters.agentId);
      if (filters.date) params.append('date', filters.date);

      const res = await fetch(`${API_BASE}/bookings?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setBookings(data.data);
      }
    } catch (err) {
      triggerToast('Error loading bookings data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Single Booking Details with History & Notifications
  const fetchBookingDetails = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/booking/${id}`);
      const data = await res.json();
      if (data.success) {
        return data.data;
      } else {
        triggerToast(data.message, 'error');
        return null;
      }
    } catch (err) {
      triggerToast('Error loading booking details', 'error');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update Booking Status
  const updateBookingStatus = async (updateData) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/update-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData) // bookingId, status, notes, updatedBy, preferred_date, preferred_time_slot
      });
      const data = await res.json();
      if (data.success) {
        triggerToast(`Booking updated to: ${updateData.status}`);
        fetchAgents(); // Refresh agent list
        return true;
      } else {
        triggerToast(data.message, 'error');
        return false;
      }
    } catch (err) {
      triggerToast('Status update failed', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Assign agent manually
  const assignAgent = async (bookingId, agentId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/assign-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, agentId })
      });
      const data = await res.json();
      if (data.success) {
        triggerToast('Sales agent assigned successfully');
        fetchAgents(); // Refresh agent list
        return true;
      } else {
        triggerToast(data.message, 'error');
        return false;
      }
    } catch (err) {
      triggerToast('Agent assignment failed', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update Agent Status (Availability)
  const updateAgentStatus = async (agentId, status) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/update-agent-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, status })
      });
      const data = await res.json();
      if (data.success) {
        if (user && user.agentId === agentId) {
          const updatedUser = { ...user, status };
          setUser(updatedUser);
          localStorage.setItem('site_visit_user', JSON.stringify(updatedUser));
        }
        triggerToast(`Availability updated to: ${status}`);
        fetchAgents(); // Refresh agent list
        return true;
      } else {
        triggerToast(data.message, 'error');
        return false;
      }
    } catch (err) {
      triggerToast('Failed to update status', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Create / Register a new Agent
  const createAgent = async (agentData) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData)
      });
      const data = await res.json();
      if (data.success) {
        triggerToast('New Sales Executive registered successfully');
        fetchAgents(); // Refresh agent list
        return true;
      } else {
        triggerToast(data.message, 'error');
        return false;
      }
    } catch (err) {
      triggerToast('Failed to register agent', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update Agent details (Name, Email, Phone)
  const updateAgent = async (agentId, agentData) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/agent/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentData)
      });
      const data = await res.json();
      if (data.success) {
        triggerToast('Agent credentials updated successfully');
        fetchAgents(); // Refresh agent list
        return true;
      } else {
        triggerToast(data.message, 'error');
        return false;
      }
    } catch (err) {
      triggerToast('Failed to update agent details', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete Agent
  const deleteAgent = async (agentId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/agent/${agentId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        triggerToast('Agent removed from system directory');
        fetchAgents(); // Refresh agent list
        return true;
      } else {
        triggerToast(data.message, 'error');
        return false;
      }
    } catch (err) {
      triggerToast('Failed to delete agent', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get aggregated dashboard stats
  const fetchDashboardStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/dashboard-stats`);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard statistics:', err);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        agents,
        bookings,
        stats,
        loading,
        toasts,
        triggerToast,
        login,
        logout,
        createBooking,
        fetchBookings,
        fetchBookingDetails,
        updateBookingStatus,
        assignAgent,
        fetchDashboardStats,
        fetchAgents,
        updateAgentStatus,
        updateAgent,
        deleteAgent,
        createAgent
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
