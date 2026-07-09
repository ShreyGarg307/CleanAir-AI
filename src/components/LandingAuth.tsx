import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Leaf, Shield, Activity, Sparkles, Loader2, Map as MapIcon, Users, BrainCircuit, Zap, Eye, Sun, Moon } from 'lucide-react';
import { useAqi } from '../context/AqiContext';
import { useTheme } from '../context/ThemeContext';

export function LandingAuth() {
  const { loginAsCitizen, loginAsMunicipal, loading } = useAuth();
  const { aqiIndex } = useAqi();
  const [showMunicipalForm, setShowMunicipalForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [citizenError, setCitizenError] = useState('');
  const [municipalError, setMunicipalError] = useState('');

  // Accessibility controls
  const [highContrast, setHighContrast] = useState(false);
  const { theme, toggleTheme, largeText, toggleLargeText } = useTheme();

  const handleCitizenLogin = async () => {
    setCitizenError('');
    try {
      await loginAsCitizen();
    } catch (err: any) {
      setCitizenError(err.message || 'Google Sign-in failed. Please try again.');
    }
  };

  const handleMunicipalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMunicipalError('');
    try {
      await loginAsMunicipal(email, password);
    } catch (err: any) {
      setMunicipalError(err.message || 'Login failed.');
    }
  };


  // Use real AQI from context for Marquee
  const currentAqi = aqiIndex || 45;


  const getAdvisoryText = (aqi: number) => {
    if (aqi <= 50) return ["Air quality is ideal.", "Perfect day for outdoor exercise!", "Ventilate indoor spaces safely."];
    if (aqi <= 100) return ["Sensitive individuals should reduce heavy exertion.", "Consider closing windows if you feel discomfort.", "AQI is acceptable today."];
    return ["Wear a mask outdoors.", "Avoid prolonged outdoor exposure.", "Running air purifiers indoors is highly recommended."];
  };

  const advisoryTexts = getAdvisoryText(currentAqi);

  return (
    <div className={`min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-200 overflow-x-hidden ${highContrast ? 'contrast-[1.3] saturate-[1.1] brightness-[0.95]' : ''} ${largeText ? 'text-lg' : ''}`}>
      <div className="fixed inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-5 pointer-events-none"></div>

      <div className="relative z-10 px-4 md:px-8 py-6 flex flex-col min-h-screen">
        {/* Navigation */}
        <nav className="flex items-center justify-between animate-fade-in-up">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Leaf className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800">CleanAir AI</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 bg-white/80 hover:bg-white border border-slate-200/50 text-slate-600 rounded-full transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center shadow-sm"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            {/* Accessibility Scroll Link Button */}
            <button
              onClick={() => document.getElementById('landing-footer')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-full transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <Eye size={13} className="text-emerald-500" />
              Accessibility Options
            </button>

            <button
              onClick={handleCitizenLogin} disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Citizen Portal
            </button>
            <button
              onClick={() => setShowMunicipalForm(true)} disabled={loading}
              className="px-5 py-2.5 bg-slate-900 text-white text-sm rounded-full font-semibold shadow-sm hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Shield className="w-4 h-4" />
              Municipal Command
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="mt-16 md:mt-24 text-center max-w-5xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold mb-8 animate-fade-in-up [animation-delay:100ms]">
            <Sparkles className="w-4 h-4" />
            ✨ Google Cloud Build with AI Hackathon Entry
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight animate-fade-in-up [animation-delay:200ms]">
            <span className="block text-slate-900">Spotting and Fixing</span>
            <span className="block text-emerald-500">Neighborhood Pollution</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 mb-16 leading-relaxed max-w-3xl animate-fade-in-up [animation-delay:300ms]">
            CleanAir AI is a high-performance environmental intelligence platform. We combine localized citizen-uploaded photos, satellite atmospheric readings, weather sensors, and Gemini predictions to isolate neighborhood air quality spikes and recommend municipal mitigations.
          </p>

          {/* Auth Entry Cards */}
          <div id="auth-cards-section" className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left w-full mb-24 animate-fade-in-up [animation-delay:400ms]">

            {/* Citizen Card */}
            <div
              onClick={() => !loading && handleCitizenLogin()}
              className={`group bg-white/80 backdrop-blur-md border border-slate-200/50 p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer flex flex-col ${loading ? 'opacity-70 pointer-events-none' : ''}`}
            >
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Activity className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Enter Citizen Portal</h3>
              <p className="text-slate-600 mb-8 flex-1">
                File pollution reports, view health tips, track local air indexes.
              </p>
              <div className="text-emerald-600 font-bold flex items-center gap-2 group-hover:gap-3 transition-all">
                {loading ? 'Authenticating...' : 'Citizen Auth →'}
              </div>
              {citizenError && (
                <div className="mt-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
                  {citizenError.includes('unauthorized-domain') ? (
                    <span><span className="font-bold block mb-1">Setup Required:</span> This domain is not authorized for Google Sign-in in Firebase.</span>
                  ) : (
                    citizenError
                  )}
                </div>
              )}
            </div>

            {/* Municipal Card */}
            <div className={`group bg-white/80 backdrop-blur-md border border-slate-200/50 p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col ${showMunicipalForm ? 'hover:-translate-y-0 hover:shadow-xl' : ''}`}>
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>

              {!showMunicipalForm ? (
                <div className="flex-1 flex flex-col cursor-pointer" onClick={() => !loading && setShowMunicipalForm(true)}>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Municipal Command</h3>
                  <p className="text-slate-600 mb-8 flex-1">
                    Deploy water sprayers, manage incident dispatches, audit database.
                  </p>
                  <div className="text-blue-600 font-bold flex items-center gap-2 group-hover:gap-3 transition-all">
                    {loading ? 'Authenticating...' : 'Officer Auth →'}
                  </div>
                </div>
              ) : (
                <form onSubmit={handleMunicipalLogin} className="flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Officer Login</h3>
                  <p className="text-xs text-slate-500 mb-4">See Readme for Ofiicer Credentials</p>
                  <input
                    type="email"
                    placeholder="Email address"
                    className="w-full px-4 py-2 mb-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <input
                    type="password"
                    placeholder="Password"
                    className="w-full px-4 py-2 mb-4 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  {municipalError && (
                    <div className="mt-1 mb-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200">
                      {municipalError.includes('INVALID_LOGIN_CREDENTIALS') ? 'Invalid email or password.' : municipalError}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-2">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setShowMunicipalForm(false); }}
                      className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors cursor-pointer"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70 cursor-pointer"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Login'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </main>

        {/* Supported Features Grid */}
        <section className="max-w-6xl mx-auto w-full mb-24 px-4 animate-fade-in-up [animation-delay:500ms]">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">Key Capabilities & Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 ease-out">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                <MapIcon className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-2">Live Pollution Tracking</h4>
              <p className="text-sm text-slate-600 leading-relaxed">Interactive Google Maps layer with official Google AQI data metrics and localized wind flow tiles.</p>
            </div>

            <div className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 ease-out" style={{ animationDelay: '0.1s' }}>
              <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-2">Civic Incident Reporting</h4>
              <p className="text-sm text-slate-600 leading-relaxed">Allowing citizens to report real-time hazards, upload photographic evidence, and track resolutions.</p>
            </div>

            <div className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 ease-out" style={{ animationDelay: '0.2s' }}>
              <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center mb-4">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-2">AI-Driven Mitigation</h4>
              <p className="text-sm text-slate-600 leading-relaxed">Gemini-powered response vectors generating custom deployment tactics for city officials.</p>
            </div>

            <div className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 ease-out" style={{ animationDelay: '0.3s' }}>
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-2">Emergency Dispatch</h4>
              <p className="text-sm text-slate-600 leading-relaxed">Automated WhatsApp crew routing workflows for immediate environmental cleanup operations.</p>
            </div>

          </div>
        </section>

        {/* Infinite Marquee */}
        <section className="max-w-6xl mx-auto w-full mb-12 px-4 animate-fade-in-up [animation-delay:600ms] overflow-hidden">
          <div className="flex items-center gap-4">
            <div className="shrink-0 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg z-10 relative shadow-md">
              Live Health Advisory
            </div>

            <div className="flex-1 overflow-hidden relative w-full border border-slate-200 bg-white rounded-xl shadow-sm h-12 flex items-center">
              <div className="flex w-max animate-marquee whitespace-nowrap">
                {/* Duplicate the array to make the loop smoother */}
                {[...advisoryTexts, ...advisoryTexts, ...advisoryTexts, ...advisoryTexts].map((text, i) => (
                  <div key={i} className="flex items-center mx-8 gap-2">
                    <div className={`w-2 h-2 rounded-full ${currentAqi <= 50 ? 'bg-green-500' : currentAqi <= 100 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm font-semibold text-slate-700">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Full-Width High-Contrast Dark Footer */}
      <footer id="landing-footer" className="w-full bg-slate-900 border-t border-slate-800 py-12 px-6 md:px-12 text-slate-400 text-sm animate-fade-in-up [animation-delay:700ms] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full filter blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-left relative z-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Leaf className="text-white w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">CleanAir AI</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              A high-performance environmental intelligence and emergency dispatch platform combining crowd-sourced citizen reports with Gemini air diagnostics.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-4">Platform Access</h4>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li>
                <button onClick={handleCitizenLogin} className="hover:text-emerald-400 transition-colors text-slate-400 cursor-pointer text-left">
                  Citizen Feed & Map
                </button>
              </li>
              <li>
                <button onClick={() => { setShowMunicipalForm(true); document.getElementById('auth-cards-section')?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-blue-400 transition-colors text-slate-400 cursor-pointer text-left">
                  Municipal Command Dashboard
                </button>
              </li>
              <li className="pt-2 text-slate-500">
                City Liaison: support@cleanair.gov
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-4">About Us & APIs</h4>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li>
                <a href="#vision" className="hover:text-emerald-400 transition-colors text-slate-400">
                  Company Vision
                </a>
              </li>
              <li>
                <a href="#team" className="hover:text-emerald-400 transition-colors text-slate-400">
                  Core Development Team
                </a>
              </li>
              <li>
                <a href="#api" className="hover:text-emerald-400 transition-colors text-slate-400">
                  Developer APIs & Docs
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Eye size={14} className="text-emerald-400" />
              Accessibility
            </h4>
            <div className="flex flex-col gap-2 text-xs">
              <button
                type="button"
                onClick={() => setHighContrast(!highContrast)}
                className={`w-full py-2 px-3 rounded-lg font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
                  highContrast 
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 text-slate-300'
                }`}
              >
                <span>High Contrast</span>
                <span className={`w-1.5 h-1.5 rounded-full ${highContrast ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
              </button>
              <button
                type="button"
                onClick={toggleLargeText}
                className={`w-full py-2 px-3 rounded-lg font-bold border transition-all text-left flex items-center justify-between cursor-pointer ${
                  largeText 
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 text-slate-300'
                }`}
              >
                <span>Large Text Mode</span>
                <span className={`w-1.5 h-1.5 rounded-full ${largeText ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
