import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

export function CrewCompletion() {
  const { reportId } = useParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const updateJobStatus = async () => {
      if (!reportId) {
        setStatus('error');
        setErrorMessage('Invalid URL: Missing Report ID');
        return;
      }

      try {
        const reportRef = doc(db, 'reports', reportId);
        await updateDoc(reportRef, {
          status: 'crew_completed'
        });
        setStatus('success');
      } catch (error: any) {
        console.error("Failed to update report status:", error);
        setStatus('error');
        setErrorMessage('Failed to update task status. Invalid ID or network error.');
      }
    };

    updateJobStatus();
  }, [reportId]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-300">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mb-6" />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Updating Task...</h1>
            <p className="text-slate-500">Please wait while we log this action.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Job Completed!</h1>
            <p className="text-slate-500 mb-8">
              Thank you! Task status updated. The municipal office has been notified in real time.
            </p>
            <button
              onClick={() => window.close()}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors shadow-md shadow-emerald-600/20"
            >
              Close Window
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Error</h1>
            <p className="text-slate-500 mb-8">{errorMessage}</p>
          </>
        )}
      </div>
    </div>
  );
}
