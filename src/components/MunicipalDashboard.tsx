import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Shield, LogOut, MapPin, AlertTriangle, Image as ImageIcon, Sparkles, X, Send, LayoutDashboard, ListTodo, MessageSquare, CheckSquare, Bell, BellRing, Trash2, Sun, Moon } from 'lucide-react';
import { MunicipalAnalysisTab } from './MunicipalAnalysisTab';
import { useTranslation } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface Report {
  id: string;
  category: string;
  description: string;
  imageUrl?: string;
  lat: number;
  lng: number;
  wardName: string;
  initialUpvotes: number;
  status: string;
  timestamp?: any;
  assignedDept?: string;
  assignedNumber?: string;
  crewReply?: string;
  crewReplyTime?: any;
}


export interface NotificationAlert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
  timestamp: Date;
  read: boolean;
}

export function MunicipalDashboard() {
  const { logout, currentUser } = useAuth();
  const { language, setLanguage, t } = useTranslation();
  const { theme, toggleTheme, largeText, toggleLargeText } = useTheme();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const [dispatchDept, setDispatchDept] = useState('Sanitation');
  const [departmentNumber, setDepartmentNumber] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'incidents'>('overview');
  const [statusFilter, setStatusFilter] = useState<'active' | 'pending' | 'dispatched' | 'crew_completed' | 'resolved'>('active');

  const [notifications, setNotifications] = useState<NotificationAlert[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toast, setToast] = useState<NotificationAlert | null>(null);

  // Auto-dismiss Toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    const q = query(collection(db, 'reports'), orderBy('timestamp', 'desc'));
    
    let isFirstLoad = true;
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedReports = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Report[];
      
      // Sort reports by upvotes for dashboard tables / consistency
      fetchedReports.sort((a, b) => (b.initialUpvotes || 0) - (a.initialUpvotes || 0));
      setReports(fetchedReports);
      setLoading(false);

      // Trigger notifications for new updates in real time
      if (!isFirstLoad) {
        snapshot.docChanges().forEach((change) => {
          const data = change.doc.data() as Report;
          const id = change.doc.id;
          const shortId = id.substring(0, 8).toUpperCase();

          if (change.type === 'added') {
            const newNotif: NotificationAlert = {
              id: `notif-add-${id}-${Date.now()}`,
              title: 'New Incident Reported',
              message: `${data.category} reported at ${data.wardName}.`,
              type: 'warning',
              timestamp: new Date(),
              read: false
            };
            setNotifications(prev => [newNotif, ...prev]);
            setToast(newNotif);
          } else if (change.type === 'modified') {
            let message = `Incident Job #${shortId} was updated.`;
            let type: 'info' | 'success' | 'warning' = 'info';
            
            if (data.status === 'dispatched') {
              message = `Job #${shortId} dispatched to ${data.assignedDept || 'crew'}.`;
              type = 'info';
            } else if (data.status === 'crew_completed') {
              message = `Job #${shortId} marked completed by crew via WhatsApp.`;
              type = 'warning';
            } else if (data.status === 'resolved') {
              message = `Job #${shortId} verified and resolved.`;
              type = 'success';
            }

            const newNotif: NotificationAlert = {
              id: `notif-mod-${id}-${Date.now()}`,
              title: 'Incident Updated',
              message,
              type,
              timestamp: new Date(),
              read: false
            };
            setNotifications(prev => [newNotif, ...prev]);
            setToast(newNotif);
          }
        });
      } else {
        isFirstLoad = false;
      }
    }, (error) => {
      console.error("Error fetching reports: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const s = r.status?.toLowerCase() || 'pending';
      if (statusFilter === 'active') {
        return s !== 'resolved';
      }
      if (statusFilter === 'pending') {
        return s === 'pending' || s === 'reported';
      }
      if (statusFilter === 'dispatched') {
        return s === 'dispatched' || s === 'in progress';
      }
      if (statusFilter === 'crew_completed') {
        return s === 'crew_completed';
      }
      if (statusFilter === 'resolved') {
        return s === 'resolved';
      }
      return true;
    });
  }, [reports, statusFilter]);



  const resolveIncidentTicket = async (reportId: string) => {
    try {
      const reportRef = doc(db, 'reports', reportId);
      await updateDoc(reportRef, {
        status: 'resolved'
      });
    } catch (error) {
      console.error('Error resolving ticket:', error);
    }
  };

  const formatReportTime = (timestamp: any) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date();
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }) + ', ' +
           date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const sendAutomatedWhatsApp = async (report: Report, phoneNumber: string): Promise<boolean> => {
    const phoneNumberId = import.meta.env.VITE_WHATSAPP_PHONE_NUMBER_ID?.replace(/^["']|["']$/g, '');
    const accessToken = import.meta.env.VITE_WHATSAPP_ACCESS_TOKEN?.replace(/^["']|["']$/g, '');

    if (!phoneNumberId || !accessToken) {
      console.error('WhatsApp API credentials are not configured.');
      return false;
    }

    const toPhone = phoneNumber.replace(/\D/g, '');
    const priority = report.initialUpvotes > 50 ? 'HIGH' : report.initialUpvotes > 10 ? 'MEDIUM' : 'LOW';

    const payload = {
      messaging_product: 'whatsapp',
      to: toPhone,
      type: 'template',
      template: {
        name: 'cleanair_dispatch',
        language: { code: 'en' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: report.id.substring(0, 8).toUpperCase() },
              { type: 'text', text: priority },
              { type: 'text', text: report.description.substring(0, 50) + (report.description.length > 50 ? '...' : '') },
              { type: 'text', text: report.wardName },
              { type: 'text', text: formatReportTime(report.timestamp) }
            ]
          },
          {
            type: 'button',
            sub_type: 'url',
            index: 1,
            parameters: [
              { type: 'text', text: report.id }
            ]
          }
        ]
      }
    };

    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Meta API Error:', errorData);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Network or fetch error:', error);
      return false;
    }
  };

  const simulateCrewReply = async (reportId: string) => {
    try {
      const reportRef = doc(db, 'reports', reportId);
      await updateDoc(reportRef, {
        status: 'crew_completed',
        crewReply: 'Done',
        crewReplyTime: new Date()
      });
    } catch (error) {
      console.error('Error simulating crew reply:', error);
    }
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !departmentNumber) return;

    setIsDispatching(true);
    let apiWarning = '';
    try {
      const success = await sendAutomatedWhatsApp(selectedReport, departmentNumber);
      if (!success) {
        apiWarning = '\n\nNote: Real WhatsApp API call failed (likely due to expired/invalid Meta tokens in .env.local). Falling back to local database simulation mode.';
      }

      const reportRef = doc(db, 'reports', selectedReport.id);
      await updateDoc(reportRef, {
        status: 'dispatched',
        assignedNumber: departmentNumber,
        assignedDept: dispatchDept
      });

      alert(`Crew dispatched successfully!${apiWarning}`);
      setSelectedReport(null);
      setDepartmentNumber('');
    } catch (error: any) {
      console.error('Dispatch error:', error);
      alert(`Failed to dispatch: ${error.message}`);
    } finally {
      setIsDispatching(false);
    }
  };


  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 text-slate-100 flex flex-col shrink-0 shadow-2xl">
        <div className="h-20 px-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-sm">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-none tracking-tight">CleanAir</span>
            <span className="text-xs font-semibold text-blue-400 tracking-wider">{t('command_center').toUpperCase()}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
           <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
             Navigation
           </div>
           <button 
             onClick={() => setActiveTab('overview')}
             className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
           >
             <LayoutDashboard className="w-5 h-5" />
             <span className="font-semibold text-sm">{t('overview_analytics')}</span>
           </button>
           <button 
             onClick={() => setActiveTab('incidents')}
             className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'incidents' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
           >
             <ListTodo className="w-5 h-5" />
             <span className="font-semibold text-sm">{t('live_incidents')}</span>
           </button>
           
           <div className="mt-6 px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
             Status
           </div>
            <div className="mt-6 px-3 py-3 bg-slate-800/50 rounded-lg border border-slate-700/50 flex flex-col gap-1">
             <span className="text-sm text-slate-300">{t('active_incidents')}</span>
             <span className="text-2xl font-bold text-white">{reports.filter(r => r.status?.toLowerCase() !== 'resolved').length}</span>
           </div>
         </div>

         <div className="p-4 border-t border-slate-800">
           <div className="flex items-center gap-3 px-3 py-3 bg-slate-800 rounded-xl mb-4 border border-slate-700">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                OC
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-semibold text-slate-200 truncate">{currentUser?.email || 'Admin'}</span>
                <span className="text-[10px] text-slate-500 truncate">{t('duty_officer')}</span>
              </div>
           </div>
           <button 
             onClick={logout}
             className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-semibold rounded-lg transition-colors"
           >
             <LogOut className="w-4 h-4" />
             {t('logout')}
           </button>
         </div>
       </aside>

       {/* Main Content */}
       <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-20 px-8 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-10 shrink-0">
          <h1 className="text-xl font-bold text-slate-800">
            {activeTab === 'overview' ? t('overview_analytics') : t('live_incidents')}
          </h1>

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
                  ? 'bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400' 
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
              className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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

            {/* Notification Center */}
            <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                // Mark all as read when opening dropdown
                if (!showNotifications) {
                  setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                }
              }}
              className="relative p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition-all"
            >
              {notifications.some(n => !n.read) ? (
                <BellRing className="w-5 h-5 text-blue-600 animate-bounce" />
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
                  <span className="text-xs font-bold text-slate-700">Notifications ({notifications.length})</span>
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
                    <p className="text-xs text-slate-400 italic text-center py-8">No new alerts.</p>
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

         {activeTab === 'overview' ? (
           <MunicipalAnalysisTab reports={reports} />
         ) : (
           <div className="p-8">
             {/* Incidents Filter Header */}
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
               <h3 className="text-lg font-bold text-slate-700">Live Incident Queue ({filteredReports.length})</h3>
               <div className="flex flex-wrap gap-2">
                 {[
                   { id: 'active', label: 'All Active' },
                   { id: 'pending', label: 'Pending' },
                   { id: 'dispatched', label: 'Dispatched' },
                   { id: 'crew_completed', label: 'Crew Completed' },
                   { id: 'resolved', label: 'Resolved' }
                 ].map(f => (
                   <button
                     key={f.id}
                     onClick={() => setStatusFilter(f.id as any)}
                     className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                       statusFilter === f.id
                         ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                         : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                     }`}
                   >
                     {f.label}
                   </button>
                 ))}
               </div>
             </div>

             {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
           ) : filteredReports.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm animate-in fade-in duration-200">
                <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-700">No Incidents Found</h3>
                <p className="text-slate-500">There are no reports matching this filter query.</p>
              </div>
           ) : (
             <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
               {filteredReports.map(report => {
                 const reportStatus = report.status || 'pending';

                return (
                  <div key={report.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full uppercase tracking-wider">
                          {report.category}
                        </span>
                        {reportStatus === 'pending' && (
                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md uppercase tracking-wider">
                            Pending
                          </span>
                        )}
                        {reportStatus === 'dispatched' && (
                          <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-md uppercase tracking-wider">
                            Dispatched
                          </span>
                        )}
                        {reportStatus === 'crew_completed' && (
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md uppercase tracking-wider">
                            Crew Completed
                          </span>
                        )}
                      </div>
                      {report.initialUpvotes > 50 ? (
                        <div className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded-md text-xs font-bold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {report.initialUpvotes} upvotes
                        </div>
                      ) : (
                        <div className="text-slate-500 text-xs font-bold bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                          {report.initialUpvotes} upvotes
                        </div>
                      )}
                    </div>
                    
                    <p className="text-slate-800 font-medium text-sm line-clamp-2 mb-4 flex-1">
                      {report.description}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{report.wardName}</span>
                    </div>

                    {/* Dispatched Info & Reply Simulation */}
                    {reportStatus === 'dispatched' && (
                      <div className="mb-4 bg-blue-50/50 border border-blue-100 rounded-xl p-3.5">
                        <div className="text-xs text-slate-600 space-y-1 mb-3">
                          <p><strong>Dept:</strong> {report.assignedDept || 'Waste Management'}</p>
                          <p><strong>Phone:</strong> {report.assignedNumber || '--'}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => simulateCrewReply(report.id)}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Simulate Crew 'Done' WhatsApp Reply
                        </button>
                      </div>
                    )}

                    {/* Crew Completed Verification Checklist */}
                    {reportStatus === 'crew_completed' && (
                      <div className="mb-4 bg-emerald-50/50 border border-emerald-200 p-3.5 rounded-xl">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold mb-1">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span>Crew Response: "{report.crewReply || 'Done'}"</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mb-3 font-medium">
                          Simulated via WhatsApp response listener.
                        </p>
                        <label className="flex items-center gap-2.5 cursor-pointer bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                            onChange={() => resolveIncidentTicket(report.id)}
                          />
                          <span className="text-xs font-black text-slate-700">Verify & Close Incident Ledger</span>
                        </label>
                      </div>
                    )}
                    
                    {reportStatus === 'pending' && (
                      <button 
                        onClick={() => setSelectedReport(report)}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm shadow-blue-600/10 active:scale-[0.98]"
                      >
                        Review & Dispatch
                      </button>
                    )}
                    {reportStatus === 'dispatched' && (
                      <button 
                        onClick={() => setSelectedReport(report)}
                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors border border-slate-200"
                      >
                        Re-dispatch Crew
                      </button>
                    )}
                    {reportStatus === 'crew_completed' && (
                      <button 
                        disabled
                        className="w-full py-2.5 bg-slate-50 text-slate-400 text-sm font-bold rounded-xl cursor-not-allowed border border-slate-200 text-center"
                      >
                        Awaiting Verification
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            )}
          </div>
        )}
      </main>

      {/* Dispatch Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            onClick={() => setSelectedReport(null)}
          ></div>
          <div className="relative bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Left: Evidence */}
            <div className="w-full md:w-1/2 bg-slate-50 p-6 md:p-8 overflow-y-auto border-b md:border-b-0 md:border-r border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Incident Evidence
              </h2>
              
              <div className="mb-6">
                {selectedReport.imageUrl ? (
                  <img 
                    src={selectedReport.imageUrl} 
                    alt="Pollution Evidence" 
                    className="w-full h-64 object-cover rounded-2xl shadow-sm border border-slate-200"
                  />
                ) : (
                  <div className="w-full h-64 bg-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 border border-slate-300 border-dashed">
                    <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                    <span className="text-sm font-medium">No image provided</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Citizen Description</h4>
                  <p className="text-slate-800 text-sm leading-relaxed bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    {selectedReport.description}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Location</h4>
                    <p className="text-slate-800 text-sm font-medium truncate" title={selectedReport.wardName}>
                      {selectedReport.wardName}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Coordinates</h4>
                    <p className="text-slate-800 text-sm font-mono bg-slate-100 px-2 py-1 rounded inline-block">
                      {selectedReport.lat.toFixed(4)}, {selectedReport.lng.toFixed(4)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Right: Action Center */}
            <div className="w-full md:w-1/2 bg-white p-6 md:p-8 flex flex-col overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Action Center</h2>
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* AI Strategy Block */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-indigo-500 p-1.5 rounded-lg shadow-sm">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="font-bold text-indigo-900">Gemini Mitigation Strategy</h3>
                </div>
                <p className="text-indigo-800 text-sm leading-relaxed">
                  <span className="font-semibold block mb-1">Category: {selectedReport.category}</span>
                  AI Suggests: Deploy anti-smog water gun or specialized mitigation crew to {selectedReport.wardName}. Notify local traffic authorities to reroute heavy vehicles temporarily to reduce localized PM2.5 spikes.
                </p>
              </div>

              {/* Dispatch Form */}
              <form onSubmit={handleDispatch} className="flex-1 flex flex-col">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Field Crew Dispatch Details</h3>
                
                <div className="space-y-4 mb-8">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                      Target Department
                    </label>
                    <select 
                      value={dispatchDept}
                      onChange={(e) => setDispatchDept(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Sanitation">Sanitation Dept (Water Sprayers)</option>
                      <option value="Traffic">Traffic Police</option>
                      <option value="Industrial">Industrial Compliance Board</option>
                      <option value="Waste">Waste Management Crew</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                      Department WhatsApp Number
                    </label>
                    <input 
                      type="tel"
                      value={departmentNumber}
                      onChange={(e) => setDepartmentNumber(e.target.value)}
                      placeholder="e.g. 919876543210"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="text-[10px] text-slate-500 mt-1.5">Include country code (e.g. 91 for India).</p>
                  </div>
                </div>

                <div className="mt-auto">
                  <button 
                    type="submit"
                    disabled={isDispatching}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all hover:shadow-xl hover:shadow-emerald-600/30 active:scale-[0.98]"
                  >
                    <Send className="w-5 h-5" />
                    {isDispatching ? 'Dispatching...' : 'Dispatch Crew'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* Toast Alert popup */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-slate-200 shadow-2xl p-4 rounded-2xl flex items-center gap-3 max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className={`p-2 rounded-xl shrink-0 ${
            toast.type === 'success' ? 'bg-emerald-50 text-emerald-500' :
            toast.type === 'warning' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'
          }`}>
            {toast.type === 'success' ? <CheckSquare size={18} /> : <AlertTriangle size={18} />}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide leading-none mb-1">{toast.title}</h4>
            <p className="text-xs font-semibold text-slate-500 leading-snug">{toast.message}</p>
          </div>
          <button 
            onClick={() => setToast(null)}
            className="p-1 hover:bg-slate-100 text-slate-400 rounded-lg shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
