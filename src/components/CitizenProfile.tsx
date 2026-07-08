import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CitizenProfileProps {
  onLogout: () => void;
  userType: 'citizen' | 'municipal' | null;
  activeTab?: string;
  onProfileClick?: () => void;
}

export function CitizenProfile({ onLogout, userType, activeTab, onProfileClick }: CitizenProfileProps) {
  const { currentUser } = useAuth();
  
  const userName = userType === 'citizen' ? (currentUser?.displayName || "Verified Citizen") : 'Officer Command';
  const initials = userType === 'citizen' ? (currentUser?.displayName?.[0] || 'V') : 'O';

  const isMyReportsActive = activeTab === 'my-reports';

  return (
    <div className="flex flex-col gap-4">
      <div className={`flex items-center space-x-3 px-4 py-3 rounded-xl border transition-all ${isMyReportsActive ? 'bg-slate-800 border-slate-700 shadow-sm' : 'bg-transparent border-transparent hover:bg-slate-800/50 hover:border-slate-800/50'}`}>
        <button
          onClick={userType === 'citizen' ? onProfileClick : undefined}
          className="flex flex-1 items-center space-x-3 text-left focus:outline-none"
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${userType === 'citizen' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
            {initials}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-semibold text-slate-200 truncate">
              {userName}
            </span>
          </div>
        </button>
        <button
          onClick={onLogout}
          className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-md transition-colors text-slate-400 shrink-0"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}
