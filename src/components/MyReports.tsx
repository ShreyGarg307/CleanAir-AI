import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Clock, Truck, CheckCircle2 } from 'lucide-react';

export function MyReports() {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "reports"),
      where("userId", "==", currentUser.uid),
      
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().timestamp?.toDate() || new Date()
      }));
      reportsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setReports(reportsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <div className="h-full w-full rounded-2xl overflow-y-auto bg-white p-6 shadow-sm border border-slate-200">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">Your Submitted Reports</h2>
        <p className="text-slate-500 text-sm">
          {currentUser?.displayName || "Verified Citizen"}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 text-slate-500 font-medium">
          You haven't submitted any pollution reports yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
          {reports.map((report) => {
            let badgeColor = 'bg-slate-100 text-slate-600 border-slate-200';
            if (report.status === 'dispatched' || report.status === 'In Progress') {
              badgeColor = 'bg-blue-50 text-blue-600 border-blue-200';
            } else if (report.status === 'resolved' || report.status === 'Resolved') {
              badgeColor = 'bg-emerald-50 text-emerald-600 border-emerald-200';
            }

            return (
              <div key={report.id} className="bg-slate-50 rounded-xl border border-slate-200 flex flex-col overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                <div className="p-4 flex-1 flex flex-col space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-orange-100 text-orange-700 text-[10px] font-bold tracking-wide">
                      {report.category}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border shrink-0 ${badgeColor}`}>
                      {report.status || 'Pending'}
                    </span>
                  </div>

                  {report.imageUrl && (
                    <div className="w-full h-32 bg-slate-200 rounded-lg overflow-hidden shrink-0">
                      <img
                        src={report.imageUrl}
                        alt="Report thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <p className="text-slate-700 text-xs leading-relaxed line-clamp-3">
                    {report.description}
                  </p>
                  
                  <div className="mt-auto pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] font-medium text-slate-500">
                     <span>{report.city || report.wardName}</span>
                     <span>{report.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
