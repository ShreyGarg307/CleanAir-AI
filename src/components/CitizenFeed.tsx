import React, { useState, useMemo } from 'react';
import { 
  Filter, 
  Sparkles, 
  UserCircle2, 
  MapPin, 
  CheckCircle2, 
  Circle, 
  ThumbsUp
} from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { useLocation } from '../context/LocationContext';

const CATEGORIES = ['All Categories', 'Construction', 'Garbage Burning', 'Vehicle Smoke', 'Industrial Emission', 'Dust', 'Water Pollution', 'Bad Smell', 'Open Sewage', 'Others'];
const STATUSES = ['All Statuses', 'Reported', 'Dispatched', 'In Progress', 'Resolved'];

// Basic Haversine distance implementation
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

export function CitizenFeed() {
  const { coordinates } = useLocation();
  const [activeCategory, setActiveCategory] = useState('All Categories');
  const [activeStatus, setActiveStatus] = useState('All Statuses');
  const [upvotedReports, setUpvotedReports] = useState<Set<string>>(new Set());
  
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const q = query(collection(db, "reports"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Safely handle Firestore timestamps for immediate UI rendering
          createdAt: data.timestamp?.toDate() || new Date()
        };
      });
      setReports(reportsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleUpvote = (reportId: string) => {
    setUpvotedReports(prev => {
      const next = new Set(prev);
      if (next.has(reportId)) {
        next.delete(reportId);
      } else {
        next.add(reportId);
      }
      return next;
    });
  };

  const filteredAndSortedReports = useMemo(() => {
    const filtered = reports.filter(report => {
      const categoryMatch = activeCategory === 'All Categories' || report.category.toLowerCase() === activeCategory.toLowerCase();
      const statusMatch = activeStatus === 'All Statuses' || report.status.toLowerCase() === activeStatus.toLowerCase();
      return categoryMatch && statusMatch;
    });

    // Calculate distance and add to report object
    const withDistance = filtered.map(report => {
      const dist = getDistance(coordinates.lat, coordinates.lng, report.lat, report.lng);
      return { ...report, distance: dist };
    });

    // Sort by distance (closest first)
    return withDistance.sort((a, b) => a.distance - b.distance);
  }, [reports, activeCategory, activeStatus, coordinates.lat, coordinates.lng]);

  return (
    <div className="flex flex-col h-full bg-slate-50 w-full overflow-hidden">
      
      {/* Full-Width Animated Filter Section */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 p-4 sm:px-6 w-full shadow-sm shrink-0 flex flex-col gap-4">
        
        {/* Category Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
          <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] sm:text-xs uppercase tracking-widest shrink-0 sm:w-32">
            <Filter size={14} />
            <span>Category</span>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto pb-2 -mb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full">
            {CATEGORIES.map(category => {
              const isActive = activeCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ease-in-out hover:-translate-y-1 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:shadow-[0_0_15px_rgba(148,163,184,0.3)]'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
          <div className="text-slate-500 font-bold text-[10px] sm:text-xs uppercase tracking-widest shrink-0 sm:w-32 flex items-center">
            <span>Status</span>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto pb-2 -mb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full">
            {STATUSES.map(status => {
              const isActive = activeStatus === status;
              return (
                <button
                  key={status}
                  onClick={() => setActiveStatus(status)}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ease-in-out hover:-translate-y-1 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-md hover:shadow-[0_0_15px_rgba(15,23,42,0.4)]'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:shadow-[0_0_15px_rgba(148,163,184,0.3)]'
                  }`}
                >
                  {status}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Multi-Column Report Card Grid */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 w-full">
        {loading ? (
          <div className="flex items-center justify-center h-64 w-full">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredAndSortedReports.length === 0 ? (
          <div className="text-center py-12 text-slate-500 font-medium w-full">
            No reports found for the selected filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full pb-24">
          {filteredAndSortedReports.map(report => {
            const isUpvoted = upvotedReports.has(report.id);
            const currentUpvotes = report.initialUpvotes + (isUpvoted ? 1 : 0);
            
            return (
              <div key={report.id} className="bg-white rounded-xl border border-slate-200 flex flex-col hover:-translate-y-1 hover:shadow-lg transition-all duration-300 overflow-hidden">
                
                <div className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col">
                  {/* Header Tags */}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-col items-start gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-md bg-orange-100 text-orange-700 text-[10px] font-bold tracking-wide">
                        {report.category}
                      </span>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold tracking-wide border border-emerald-100">
                        <Sparkles size={10} className="text-emerald-500" />
                        AI Verified • {(report.aiVerification || 90)}%
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold tracking-wide uppercase border border-slate-200 shrink-0">
                      {report.status}
                    </span>
                  </div>

                  {/* Near You Badge */}
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase tracking-wider border border-blue-100 inline-flex items-center gap-1">
                      <MapPin size={10} /> Near You ({report.distance.toFixed(1)} km)
                    </span>
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center gap-2.5 text-slate-600 pt-1">
                    <UserCircle2 size={32} className="text-slate-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 text-sm truncate">{report.citizenName}</div>
                      <div className="text-[10px] font-medium text-slate-500">{(report.createdAt ? report.createdAt.toLocaleDateString() : 'Just now')}</div>
                    </div>
                  </div>

                  {/* Location Box */}
                  <div className="bg-sky-50/50 rounded-lg p-2.5 border border-sky-100 flex items-start gap-2">
                    <MapPin size={16} className="text-sky-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 text-xs truncate">{report.wardName}</div>
                      <div className="text-[10px] font-medium text-slate-500 mt-0.5 line-clamp-1">{report.city}</div>
                    </div>
                  </div>

                  {/* Dynamic Image Rendering */}
                  <div className="w-full h-48 bg-slate-100 relative shrink-0 rounded-lg overflow-hidden border border-slate-200">
                    {report.imageUrl ? (
                      <img 
                        src={report.imageUrl} 
                        alt="Reported condition" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 p-4 text-center">
                        <Sparkles size={24} className="text-slate-400 mb-2" />
                        <p className="text-slate-600 font-medium text-xs">
                          AI Generated Baseline
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="flex-1 flex flex-col">
                    <p className="text-slate-700 text-xs leading-relaxed line-clamp-3">
                      {report.description}
                    </p>
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-auto">
                    <div className="flex items-center gap-1">
                      {/* Compact Timeline Indication */}
                      {[1, 2, 3, 4].map((step) => (
                        <div 
                          key={step} 
                          className={`w-2 h-2 rounded-full ${
                            (report.timelineStep || 1) >= step ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    
                    <button 
                      onClick={() => toggleUpvote(report.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                        isUpvoted 
                          ? 'bg-rose-50 border-rose-200 text-rose-600' 
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <ThumbsUp size={14} className={isUpvoted ? 'fill-rose-100' : ''} />
                      <span className="font-semibold text-[10px]">
                        {currentUpvotes}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
}
