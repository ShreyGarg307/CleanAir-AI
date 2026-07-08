import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell 
} from 'recharts';
import { AlertCircle, Clock, CheckCircle2, Truck } from 'lucide-react';

interface Report {
  id: string;
  category: string;
  status: string;
  initialUpvotes?: number;
  timestamp?: any;
  createdAt?: any;
  wardName?: string;
  city?: string;
  [key: string]: any;
}

function parseFirestoreDate(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val.toDate === 'function') {
    try {
      return val.toDate();
    } catch (e) {
      console.error("Error calling toDate() on timestamp:", e);
    }
  }
  if (val.seconds) return new Date(val.seconds * 1000);
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

export function MunicipalAnalysisTab({ reports }: { reports: Report[] }) {
  // KPIs
  const pendingCount = useMemo(() => {
    return reports.filter(r => {
      const s = r.status?.toLowerCase() || '';
      return s === 'pending' || s === 'reported';
    }).length;
  }, [reports]);

  const criticalCount = useMemo(() => {
    return reports.filter(r => (r.initialUpvotes || 0) > 10).length;
  }, [reports]);

  const solvedTodayCount = useMemo(() => {
    const now = new Date();
    return reports.filter(r => {
      const s = r.status?.toLowerCase() || '';
      if (s !== 'resolved') return false;
      
      const date = parseFirestoreDate(r.timestamp) || parseFirestoreDate(r.createdAt);
      if (!date) return false;
      
      const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      return diffHours <= 24;
    }).length;
  }, [reports]);

  const activeTeamsCount = useMemo(() => {
    return reports.filter(r => {
      const s = r.status?.toLowerCase() || '';
      return s === 'dispatched' || s === 'in progress';
    }).length;
  }, [reports]);

  const recentDispatches = useMemo(() => {
    const dispatched = reports.filter(r => {
      const s = r.status?.toLowerCase() || '';
      return s === 'dispatched' || s === 'in progress';
    });
    
    return dispatched.sort((a, b) => {
      const dateA = parseFirestoreDate(a.timestamp) || parseFirestoreDate(a.createdAt) || new Date(0);
      const dateB = parseFirestoreDate(b.timestamp) || parseFirestoreDate(b.createdAt) || new Date(0);
      return dateB.getTime() - dateA.getTime();
    }).slice(0, 2);
  }, [reports]);

  // Chart Data
  const trendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rawDate: d,
        new: 0,
        resolved: 0
      };
    });

    reports.forEach(r => {
      const date = parseFirestoreDate(r.timestamp) || parseFirestoreDate(r.createdAt);
      if (!date) return;
      
      const dayData = last7Days.find(d => 
        d.rawDate.getDate() === date.getDate() && 
        d.rawDate.getMonth() === date.getMonth() &&
        d.rawDate.getFullYear() === date.getFullYear()
      );

      if (dayData) {
        const s = r.status?.toLowerCase() || '';
        if (s === 'resolved') {
          dayData.resolved += 1;
        } else {
          dayData.new += 1;
        }
      }
    });

    return last7Days;
  }, [reports]);

  const topCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach(r => {
      const cat = r.category || 'Unknown';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [reports]);

  return (
    <div className="bg-slate-50 h-full w-full p-4 md:p-8 overflow-y-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Command Center Overview</h2>
      
      {/* Top Row: KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        
        {/* Pending */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Clock size={18} className="text-orange-500" />
            </div>
            <span className="text-sm font-semibold text-slate-600">Pending</span>
          </div>
          <span className="text-3xl font-bold text-slate-800">{pendingCount}</span>
        </div>

        {/* Critical */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertCircle size={18} className="text-red-500" />
            </div>
            <span className="text-sm font-semibold text-slate-600">Critical</span>
          </div>
          <span className="text-3xl font-bold text-slate-800">{criticalCount}</span>
        </div>

        {/* Solved Today */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <CheckCircle2 size={18} className="text-emerald-500" />
            </div>
            <span className="text-sm font-semibold text-slate-600">Solved Today</span>
          </div>
          <span className="text-3xl font-bold text-slate-800">{solvedTodayCount}</span>
        </div>

        {/* Active Teams */}
        <div className="bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-800 flex flex-col justify-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Truck size={48} />
          </div>
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <div className="p-2 bg-white/10 rounded-lg">
              <Truck size={18} className="text-blue-400" />
            </div>
            <span className="text-sm font-semibold text-slate-300">Active Teams</span>
          </div>
          <span className="text-3xl font-bold text-white relative z-10">{activeTeamsCount}</span>
        </div>

        {/* Recent Dispatches */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Recent Dispatches</h3>
          <div className="flex flex-col gap-2 flex-1 justify-center">
            {recentDispatches.length > 0 ? (
              recentDispatches.map(report => (
                <div key={report.id} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-slate-800 line-clamp-1">{report.category}</p>
                    <p className="text-[10px] text-slate-500 line-clamp-1">{report.city || report.wardName || 'Unknown location'}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No active dispatches</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        
        {/* 7-Day Resolution Trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 mb-6">7-Day Resolution Trend</h3>
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="new" 
                  name="New Reports"
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="resolved" 
                  name="Resolved"
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 mb-6">Top Categories</h3>
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCategories} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" name="Reports" radius={[0, 4, 4, 0]} barSize={24}>
                  {topCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981'][index % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
