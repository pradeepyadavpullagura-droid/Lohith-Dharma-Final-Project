import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import CustomerBooking from './pages/CustomerBooking';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import AgentDashboard from './pages/AgentDashboard';
import BookingDetails from './pages/BookingDetails';
import Reports from './pages/Reports';
import AgentAccess from './pages/AgentAccess';
import SidebarLayout from './components/SidebarLayout';
import ToastContainer from './components/ToastContainer';
import { Sun, Moon } from 'lucide-react';


const AppContent = () => {
  const { user, setUser, login, logout, triggerToast } = useApp();
  const [page, setPage] = useState('landing'); // 'landing', 'public-booking', 'login', 'dashboard', 'booking-details'
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'reports'
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('site_visit_theme') || 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('site_visit_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Authentication Route Guard
  useEffect(() => {
    const securePages = ['dashboard', 'booking-details'];
    if (securePages.includes(page) && !user) {
      setPage('login');
    }
  }, [page, user]);

  // Auto-Login Query Parameter Checker
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    if (emailParam) {
      let password = 'agent123';
      if (emailParam === 'pullagurapradeepyadav@gmail.com') {
        password = '984915';
      } else if (emailParam === 'pradeepyadavpullagura@gmail.com') {
        password = '123456789';
      }
      login(emailParam, password).then((res) => {
        if (res.success) {
          setPage('dashboard');
          // Clean the query parameter from URL bar
          const cleanUrl = window.location.origin + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle viewing booking details
  const handleViewBooking = (id) => {
    setSelectedBookingId(id);
    setPage('booking-details');
  };

  // Main page selector rendering logic
  const renderPageContent = () => {
    if (page === 'landing') {
      return <LandingPage onNavigate={setPage} />;
    }

    if (page === 'public-booking') {
      return <CustomerBooking onNavigate={setPage} />;
    }

    if (page === 'login') {
      return <Login onNavigate={setPage} />;
    }

    // Authenticated Pages
    if (user) {
      if (page === 'booking-details') {
        return (
          <BookingDetails 
            bookingId={selectedBookingId} 
            onBack={() => setPage('dashboard')} 
          />
        );
      }

      // Sidebar Tab Selection
      if (activeTab === 'reports' && user.role === 'admin') {
        return <Reports />;
      }

      if (activeTab === 'agent-access' && user.role === 'admin') {
        return <AgentAccess />;
      }

      // Default: Dashboard View
      if (user.role === 'admin') {
        return <AdminDashboard onViewBooking={handleViewBooking} />;
      } else if (user.role === 'agent') {
        return <AgentDashboard onViewBooking={handleViewBooking} />;
      }
    }

    return <LandingPage onNavigate={setPage} />;
  };

  const isPublicPage = page === 'landing' || page === 'public-booking' || page === 'login';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500/35 selection:text-white flex flex-col">
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 right-4 z-50 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-850 transition shadow-lg cursor-pointer flex items-center justify-center"
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
      </button>

      {user && user.isImpersonated && (
        <div className="bg-amber-600 text-slate-950 px-4 py-2 text-xs font-bold flex justify-between items-center z-50 shadow-md">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-950"></span>
            </span>
            <span>Impersonating Agent: <strong>{user.name}</strong> ({user.email}) | Viewing agent-specific visits & reports</span>
          </div>
          <button 
            onClick={() => {
              const savedAdmin = localStorage.getItem('site_visit_admin_backup');
              if (savedAdmin) {
                setUser(JSON.parse(savedAdmin));
                localStorage.removeItem('site_visit_admin_backup');
                localStorage.setItem('site_visit_user', savedAdmin);
                setPage('dashboard');
                setActiveTab('agent-access');
                triggerToast('Returned to Admin Control');
              } else {
                logout();
                setPage('login');
              }
            }}
            className="bg-slate-950 text-amber-400 hover:bg-slate-900 px-3 py-1 rounded-xl font-extrabold text-[10px] tracking-wide uppercase transition shrink-0"
          >
            Exit Session
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        {isPublicPage ? (
          renderPageContent()
        ) : (
          <SidebarLayout 
            activeTab={activeTab} 
            onTabChange={(tab) => {
              setActiveTab(tab);
              setPage('dashboard'); // reset from booking-details if any
            }} 
            onNavigate={setPage}
          >
            <div className="min-h-screen pb-12">
              {renderPageContent()}
            </div>
          </SidebarLayout>
        )}
      </div>

      {/* Floating System Messages */}
      <ToastContainer />
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
