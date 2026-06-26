import React, { useState } from 'react';
import { 
  Building, 
  CheckCircle, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  TrendingUp, 
  PhoneCall, 
  Phone, 
  Mail, 
  Compass, 
  Menu, 
  X, 
  ChevronRight, 
  ArrowRight,
  Map
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const LandingPage = ({ onNavigate }) => {
  const { triggerToast } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const features = [
    {
      title: "100% Legal Ownership",
      desc: "Legally registered mutual agreements and deed registration guarantees your ownership and crop share.",
      icon: ShieldCheck
    },
    {
      title: "Native Soil Locations",
      desc: "Farmlands in Prakasam and Seshachalam regions, the natural native habitat of Red Sandalwood.",
      icon: MapPin
    },
    {
      title: "Expert 12-Year Care",
      desc: "Full maintenance cycle including drip irrigation, security, harvesting, and government-approved sales.",
      icon: Calendar
    },
    {
      title: "High Returns Potential",
      desc: "Expected crop yields of 40 tons per acre at ₹21 Lakhs minimum government baseline rate.",
      icon: CheckCircle
    },
    {
      title: "Acreage Options",
      desc: "Choose from 1/4 acre, 1/2 acre, or full 1-acre plots pre-planted with 400 saplings per acre.",
      icon: TrendingUp
    },
    {
      title: "24/7 Security Patrols",
      desc: "Boundary fencing, continuous CCTV surveillance, and dedicated watchmen to safeguard the trees.",
      icon: PhoneCall
    }
  ];

  const properties = [
    {
      id: 1,
      name: "Yerragondapalem Gated Farms",
      location: "Prakasam District, AP",
      price: "₹60 Lakhs / Acre",
      area: "1 Acre (400 Trees)",
      tag: "Main Project",
      highlight: "96-Acre Managed Farmland",
      image: "/plot_meadows.png"
    },
    {
      id: 2,
      name: "Seshachalam Foothills Block A",
      location: "Tirupati Range Foothills, AP",
      price: "₹18 Lakhs / Plot",
      area: "1/4 Acre (100 Trees)",
      tag: "Fast Selling",
      highlight: "Solar Fencing & CCTV Protected",
      image: "/plot_greenwood.png"
    },
    {
      id: 3,
      name: "Nallamala Native Sector Block B",
      location: "Kurnool Range Link Road, AP",
      price: "₹32 Lakhs / Plot",
      area: "1/2 Acre (200 Trees)",
      tag: "Gated Farm",
      highlight: "Drip Irrigation Installed",
      image: "/plot_skyline.png"
    },
    {
      id: 4,
      name: "Giddalur Range Sandalwood plots",
      location: "Prakasam Giddalur Sector, AP",
      price: "₹65 Lakhs / Acre",
      area: "1 Acre (400 Trees)",
      tag: "New Launch",
      highlight: "12-Year Expert Maintenance",
      image: "/plot_valley.png"
    }
  ];


  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-[#B69344]/35 selection:text-white flex flex-col font-sans">
      
      {/* Autoplay Video Background / Fallback Image Overlay */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <img 
          src="/main_hero_bg.png" 
          alt="Township Background"
          className="video-bg-element opacity-45 animate-gentle-zoom"
        />
        <div className="dark-gradient-overlay" />
      </div>

      {/* Navbar Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection('home')}>
            <div className="w-10 h-10 rounded-xl bg-[#B69344]/20 border border-[#B69344]/30 flex items-center justify-center">
              <Map className="w-5 h-5 text-[#B69344]" />
            </div>
            <span className="text-xl font-black text-white tracking-wider">
              LOHITHA DHARMA <span className="text-[#B69344] font-light">PROJECTS</span>
            </span>
          </div>

          {/* Desktop Menu Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('home')} className="text-sm font-medium text-slate-300 hover:text-white hover:underline transition underline-offset-4 cursor-pointer">Home</button>
            <button onClick={() => scrollToSection('properties')} className="text-sm font-medium text-slate-300 hover:text-white hover:underline transition underline-offset-4 cursor-pointer">Properties</button>
            <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-slate-300 hover:text-white hover:underline transition underline-offset-4 cursor-pointer">Features</button>
            <button onClick={() => scrollToSection('contact')} className="text-sm font-medium text-slate-300 hover:text-white hover:underline transition underline-offset-4 cursor-pointer">Contact Us</button>
            <button onClick={() => onNavigate('login')} className="text-sm font-semibold bg-slate-900 border border-slate-800 hover:border-[#B69344]/30 text-[#B69344] hover:text-[#B69344]/90 px-4 py-2 rounded-xl transition cursor-pointer">Employee Portal</button>
          </nav>

          {/* Mobile hamburger menu toggle */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white rounded-lg cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-950 border-b border-slate-900 px-4 pt-2 pb-6 flex flex-col gap-4 animate-fade-in-up">
            <button onClick={() => scrollToSection('home')} className="text-left py-2 text-sm font-medium text-slate-300 hover:text-white">Home</button>
            <button onClick={() => scrollToSection('properties')} className="text-left py-2 text-sm font-medium text-slate-300 hover:text-white">Properties</button>
            <button onClick={() => scrollToSection('features')} className="text-left py-2 text-sm font-medium text-slate-300 hover:text-white">Features</button>
            <button onClick={() => scrollToSection('contact')} className="text-left py-2 text-sm font-medium text-slate-300 hover:text-white">Contact Us</button>
            <button 
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('login');
              }} 
              className="text-center w-full mt-2 bg-[#B69344] hover:bg-[#B69344]/90 text-slate-950 font-bold py-2.5 rounded-xl transition"
            >
              Employee Portal
            </button>
          </div>
        )}
      </header>

      {/* Main Page Layout Wrapper */}
      <main className="flex-1">

        {/* Hero Section */}
        <section id="home" className="relative plot-hero-content">
          <div className="flex flex-col items-center gap-6">
            <div className="inline-flex items-center gap-2 bg-[#B69344]/10 border border-[#B69344]/20 text-[#B69344] px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider animate-pulse">
              <Compass className="w-4 h-4" /> MANAGED RED SANDALWOOD FARMLANDS
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-black text-white leading-[1.1] tracking-tight text-center max-w-4xl">
              Invest in <span className="gold-gradient-text">Red Sandalwood</span> Farmlands
            </h1>

            <p className="text-slate-300 text-sm sm:text-lg max-w-2xl font-light text-center leading-relaxed">
              Invest in rare Red Sandalwood managed farmlands in Andhra Pradesh. Secure high returns with 12-year expert maintenance, 100% legal title registration, and crop profit sharing.
            </p>

            <div className="hero-buttons flex flex-wrap justify-center gap-4 mt-2">
              <button 
                onClick={() => onNavigate('public-booking')}
                className="btn-gold-primary flex items-center gap-2 font-bold cursor-pointer"
              >
                Book Site Visit <ArrowRight className="w-4.5 h-4.5" />
              </button>
              <button 
                onClick={() => scrollToSection('properties')}
                className="btn-gold-secondary flex items-center gap-2 font-semibold cursor-pointer"
              >
                Explore Farms
              </button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-slate-950/80 backdrop-blur-sm border-t border-slate-900">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Why Invest in Lohitha Dharma Projects?</h2>
              <p className="text-sm text-slate-400 mt-3 font-light max-w-xl mx-auto">
                We cultivate rare Red Sandalwood farmlands that offer safety, expert maintenance, and exceptional returns.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feat, i) => (
                <div key={i} className="glass-gold-card p-6 rounded-2xl border border-slate-800">
                  <div className="w-12 h-12 rounded-xl bg-[#B69344]/10 border border-[#B69344]/20 flex items-center justify-center mb-5">
                    <feat.icon className="w-6 h-6 text-[#B69344]" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-light">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Properties Grid Section */}
        <section id="properties" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-slate-950/95">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16">
              <div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Featured Sandalwood Sectors</h2>
                <p className="text-sm text-slate-400 mt-2 font-light">
                  Premium native forest sectors managed by agricultural specialists.
                </p>
              </div>
              <button 
                onClick={() => onNavigate('public-booking')}
                className="mt-4 md:mt-0 flex items-center gap-1 text-xs text-[#B69344] hover:text-[#B69344]/90 font-bold transition cursor-pointer"
              >
                Schedule Site Inspection Tour &rarr;
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {properties.map((prop) => (
                <div key={prop.id} className="glass-gold-card flex flex-col rounded-2xl overflow-hidden border border-slate-850 group">
                  
                  {/* Card Image Frame */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-900 shrink-0">
                    <img 
                      src={prop.image} 
                      alt={prop.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-80" 
                    />
                    <div className="absolute top-3 left-3 bg-[#B69344] text-slate-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded border border-[#B69344]/20 shadow-md">
                      {prop.tag}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[#B69344] text-[10px] font-bold tracking-wider uppercase">{prop.highlight}</span>
                      <h3 className="text-md font-bold text-white leading-tight group-hover:text-[#B69344] transition">{prop.name}</h3>
                      <p className="text-xs text-slate-400 font-light flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" /> {prop.location}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-850/60 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 block leading-none">Starting Price</span>
                        <span className="text-md font-extrabold text-white">{prop.price}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block leading-none">Area</span>
                        <span className="text-xs font-semibold text-slate-300">{prop.area}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => onNavigate('public-booking')}
                      className="w-full bg-slate-900 hover:bg-[#B69344]/10 border border-slate-800 hover:border-[#B69344]/20 text-slate-300 hover:text-[#B69344] font-semibold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Book Visit Details <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-slate-950/80 border-t border-slate-900">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Let's Find Your Property</h2>
              <p className="text-sm text-slate-400 mt-3 font-light leading-relaxed max-w-xl mx-auto">
                Have questions about Red Sandalwood farmlands, registration guidelines, or want to schedule a personalized transport service for your site visit? Drop us a line.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6 bg-slate-900/40 border border-slate-900 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-[#B69344]/10 border border-[#B69344]/20 flex items-center justify-center mb-4">
                  <Phone className="w-5 h-5 text-[#B69344]" />
                </div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Phone Support</span>
                <span className="text-sm font-bold text-white">+91 80966 77099</span>
              </div>

              <div className="flex flex-col items-center text-center p-6 bg-slate-900/40 border border-slate-900 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-[#B69344]/10 border border-[#B69344]/20 flex items-center justify-center mb-4">
                  <Mail className="w-5 h-5 text-[#B69344]" />
                </div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Email Inquiry</span>
                <span className="text-sm font-bold text-white">dharmass@gmail.com</span>
              </div>

              <div className="flex flex-col items-center text-center p-6 bg-slate-900/40 border border-slate-900 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-[#B69344]/10 border border-[#B69344]/20 flex items-center justify-center mb-4">
                  <Building className="w-5 h-5 text-[#B69344]" />
                </div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Corporate Address</span>
                <span className="text-sm font-bold text-white max-w-xs leading-relaxed">2nd Floor, Plot No 152, Road No. 2, Rock Town Residents Colony, L. B. Nagar, Hyderabad 500068</span>
              </div>
            </div>

            <div className="mt-12 text-center text-xs text-slate-500 pt-6 border-t border-slate-900">
              * Dynamic WhatsApp dispatch notifications are automatically sent once booking details are verified.
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <span>&copy; 2026 Lohitha Dharma Projects Pvt. Ltd. All Rights Reserved.</span>
          <div className="flex items-center gap-4 text-[10px]">
            <button onClick={() => onNavigate('login')} className="hover:text-[#B69344] hover:underline">Employee Login</button>
            <span>&bull;</span>
            <button onClick={() => onNavigate('public-booking')} className="hover:text-[#B69344] hover:underline">Book Site Visits</button>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
