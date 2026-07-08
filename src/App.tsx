/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Menu, X, Activity, Map, TrendingUp, User, Shield, AlertTriangle, CheckSquare, Bell, BellRing, Trash2 } from "lucide-react";
import { InteractiveMap } from "./components/InteractiveMap";
import { ReportPollution } from "./components/ReportPollution";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { LanguageProvider, useTranslation } from "./context/LanguageContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { Sun, Moon } from "lucide-react";

import { CitizenFeed } from "./components/CitizenFeed";
import { AIPrediction } from "./components/AIPrediction";
import { ReportsProvider } from "./context/ReportsContext";

import { LocationProvider } from "./context/LocationContext";
import { AqiProvider } from "./context/AqiContext";
import { LandingAuth } from "./components/LandingAuth";
import { MunicipalDashboard } from "./components/MunicipalDashboard";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CitizenProfile } from "./components/CitizenProfile";
import { MyReports } from "./components/MyReports";
import { PageTransition } from "./components/PageTransition";

type Tab = "feed" | "map" | "prediction" | "my-reports";
type UserType = "citizen" | "municipal";

function MainRouter() {
  const { userRole, loading, logout, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("feed");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  interface CitizenNotification {
    id: string;
    title: string;
    message: string;
    type: string;
    timestamp: Date;
    read: boolean;
  }

  const [citizenToast, setCitizenToast] = useState<{ title: string; message: string; type: string } | null>(null);
  const [notifications, setNotifications] = useState<CitizenNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Auto-dismiss Citizen Toast
  React.useEffect(() => {
    if (citizenToast) {
      const timer = setTimeout(() => {
        setCitizenToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [citizenToast]);

  // Real-time updates check for citizen notifications
  React.useEffect(() => {
    if (!currentUser || userRole !== 'citizen') return;
    
    const q = query(collection(db, 'reports'));
    let isFirst = true;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!isFirst) {
        snapshot.docChanges().forEach((change) => {
          const data = change.doc.data();
          if (data.userId === currentUser.uid && change.type === 'modified') {
            const category = data.category || 'Incident';
            let title = 'Report Status Updated';
            let message = `Your report for "${category}" is now ${data.status}.`;
            let type = 'info';

            if (data.status === 'dispatched') {
              title = 'Crew Dispatched';
              message = `A cleanup crew has been dispatched to resolve your "${category}" report!`;
              type = 'info';
            } else if (data.status === 'crew_completed') {
              title = 'Cleanup Complete';
              message = `Our crew marked your "${category}" report as completed. Awaiting municipal check.`;
              type = 'warning';
            } else if (data.status === 'resolved') {
              title = 'Report Resolved';
              message = `Fantastic! Your report for "${category}" has been verified and resolved.`;
              type = 'success';
            }

            const newNotif: CitizenNotification = {
              id: `c-notif-${change.doc.id}-${Date.now()}`,
              title,
              message,
              type,
              timestamp: new Date(),
              read: false
            };

            setNotifications(prev => [newNotif, ...prev]);
            setCitizenToast({ title, message, type });
          }
        });
      } else {
        isFirst = false;
      }
    });

    return () => unsubscribe();
  }, [currentUser, userRole]);

  const { language, setLanguage, t } = useTranslation();
  const { theme, toggleTheme, largeText, toggleLargeText } = useTheme();

  const tabs = [
    { id: "feed", label: t('citizen_feed'), icon: Activity },
    { id: "map", label: t('interactive_map'), icon: Map },
    { id: "prediction", label: t('ai_prediction'), icon: TrendingUp },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-medium">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (userRole === null) {
    return <PageTransition keyProp="landing"><LandingAuth /></PageTransition>;
  }

  if (userRole === 'municipal') {
    return <PageTransition keyProp="municipal"><MunicipalDashboard /></PageTransition>;
  }

  return (
    
        <ReportsProvider>
          <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
              <div
                className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-20 md:hidden transition-opacity"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            {/* Sidebar Panel */}
            <aside
              className={`fixed md:relative inset-y-0 left-0 z-30 shrink-0 w-72 bg-slate-900 text-slate-100 flex flex-col transition-all duration-300 ease-in-out ${
                isSidebarOpen
                  ? "translate-x-0 md:ml-0"
                  : "-translate-x-full md:translate-x-0 md:-ml-72"
              } shadow-2xl md:shadow-none`}
            >
              <div className="h-20 px-6 flex items-center justify-between border-b border-slate-800">
                <h1 className="text-lg font-semibold tracking-tight text-emerald-400 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  <span>
                    CleanAir <span className="text-white font-light">&</span>{" "}
                    Clear Streets
                  </span>
                </h1>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="md:hidden p-2 -mr-2 hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  aria-label="Close sidebar"
                >
                  <X size={20} className="text-slate-400 hover:text-white" />
                </button>
              </div>

              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as Tab)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? "bg-emerald-500/10 text-emerald-400 font-medium"
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      }`}
                    >
                      <Icon
                        size={20}
                        className={
                          isActive ? "text-emerald-400" : "text-slate-400"
                        }
                      />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-800">
                <CitizenProfile onLogout={logout} userType={userRole} activeTab={activeTab} onProfileClick={() => setActiveTab('my-reports')} />
              </div>
            </aside>

            {/* Main Content Viewport */}
            <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
              {/* Header */}
              <header className="h-20 px-4 md:px-8 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="flex items-center">
                  <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 mr-4 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-600"
                    aria-label="Toggle sidebar"
                  >
                    <Menu size={24} />
                  </button>
                  <h2 className="text-xl font-medium text-slate-800">
                    {tabs.find((t) => t.id === activeTab)?.label}
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  {/* Theme Toggle Button */}
                  <button
                    onClick={toggleTheme}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    aria-label="Toggle theme"
                  >
                    {theme === 'dark' ? (
                      <Sun className="w-5 h-5 text-amber-500" />
                    ) : (
                      <Moon className="w-5 h-5 text-indigo-600" />
                    )}
                  </button>

                  {/* Large Text Accessibility Button */}
                  <button
                    onClick={toggleLargeText}
                    className={`p-2.5 border rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer font-extrabold text-[11px] leading-none h-10 w-10 flex items-center justify-center ${
                      largeText 
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                    title="Toggle Large Text"
                  >
                    A<sup>+</sup>
                  </button>

                  {/* Language Selector */}
                  <select
                    value={language}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'en' || val === 'hi') {
                        setLanguage(val as any);
                      } else {
                        alert(`${e.target.selectedOptions[0].text} translation is coming soon in the next update! Fallback to English applied.`);
                        setLanguage('en');
                      }
                    }}
                    className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="en">English (EN)</option>
                    <option value="hi">हिन्दी (HI)</option>
                    <option value="bn">বাংলা (Bengali)</option>
                    <option value="te">తెలుగు (Telugu)</option>
                    <option value="mr">मराठी (Marathi)</option>
                    <option value="ta">தமிழ் (Tamil)</option>
                    <option value="gu">ગુજરાતી (Gujarati)</option>
                    <option value="kn">ಕನ್ನಡ (Kannada)</option>
                  </select>

                  {/* Notifications Center */}
                  <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      if (!showNotifications) {
                        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                      }
                    }}
                    className="relative p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition-all"
                  >
                    {notifications.some(n => !n.read) ? (
                      <BellRing className="w-5 h-5 text-emerald-500 animate-bounce" />
                    ) : (
                      <Bell className="w-5 h-5" />
                    )}
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500"></span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <span className="text-xs font-bold text-slate-700">My Notifications ({notifications.length})</span>
                        {notifications.length > 0 && (
                          <button 
                            onClick={() => setNotifications([])}
                            className="text-[10px] text-red-500 hover:text-red-600 font-bold flex items-center gap-1"
                          >
                            <Trash2 size={11} /> Clear All
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-slate-400 italic text-center py-8">No new status updates.</p>
                        ) : (
                          notifications.map(n => (
                            <div key={n.id} className="p-3.5 hover:bg-slate-50 transition-colors">
                              <div className="flex justify-between items-start mb-0.5">
                                <span className={`text-xs font-black ${
                                  n.type === 'success' ? 'text-emerald-600' :
                                  n.type === 'warning' ? 'text-amber-600' : 'text-blue-600'
                                }`}>{n.title}</span>
                                <span className="text-[9px] text-slate-400 font-medium">
                                  {n.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </header>

              {/* Dynamic Viewport Container */}
              <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                <PageTransition keyProp={activeTab}>
                {activeTab === "map" ? (
                  <div className="h-full min-h-[600px] w-full rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                    <InteractiveMap />
                  </div>
                ) : activeTab === "feed" ? (
                  <div className="h-full w-full rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white">
                    <CitizenFeed />
                  </div>
                ) : activeTab === "prediction" ? (
                  <div className="h-full w-full">
                    <AIPrediction />
                  </div>
                ) : (
                  <div className="h-full w-full">
                    <MyReports />
                  </div>
                )}
                </PageTransition>
              </div>
            </main>

            <ReportPollution />

            {/* Citizen Floating Toast Alert popup */}
            {citizenToast && (
              <div className="fixed bottom-6 right-6 z-50 bg-white border border-slate-200 shadow-2xl p-4 rounded-2xl flex items-center gap-3 max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-300">
                <div className={`p-2 rounded-xl shrink-0 ${
                  citizenToast.type === 'success' ? 'bg-emerald-50 text-emerald-500' :
                  citizenToast.type === 'warning' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'
                }`}>
                  {citizenToast.type === 'success' ? <CheckSquare size={18} /> : <AlertTriangle size={18} />}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide leading-none mb-1">{citizenToast.title}</h4>
                  <p className="text-xs font-semibold text-slate-500 leading-snug">{citizenToast.message}</p>
                </div>
                <button 
                  onClick={() => setCitizenToast(null)}
                  className="p-1 hover:bg-slate-100 text-slate-400 rounded-lg shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        </ReportsProvider>
      
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <LocationProvider><AqiProvider><MainRouter /></AqiProvider></LocationProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
