import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Category = 'All Categories' | 'Construction' | 'Garbage Burning' | 'Vehicle Smoke' | 'Industrial Emission' | 'Water Pollution' | 'Dust' | 'Bad Smell' | 'Open Sewage' | 'Others';
export type Status = 'All Statuses' | 'Reported' | 'Dispatched' | 'In Progress' | 'Resolved';

export type Report = {
  id: string;
  category: string;
  status: string;
  aiVerification: number;
  userName: string;
  timestamp: string;
  wardName: string;
  locationDetails: string;
  lat: number;
  lng: number;
  description: string;
  imageUrl: string | null;
  aiDiagnostics: {
    source: string;
    aqiSpike: string;
    severity: string;
  };
  timelineStep: number;
  initialUpvotes: number;
};

const INITIAL_REPORTS: Report[] = [
  {
    id: 'rep-001',
    category: 'Vehicle Smoke',
    status: 'Dispatched',
    aiVerification: 94,
    userName: 'Aarav Sharma',
    timestamp: '4h ago',
    wardName: 'Gandhi Maidan Ward',
    locationDetails: 'Heavy traffic smog near Gandhi Maidan',
    lat: 25.618,
    lng: 85.140,
    description: 'Heavy traffic congestion causing immense smog build up. Commercial trucks idling for over 30 minutes emitting black smoke.',
    imageUrl: 'https://images.unsplash.com/photo-1621451537084-482c73073e0f?auto=format&fit=crop&w=800&q=80',
    aiDiagnostics: {
      source: 'High concentration of diesel particulate matter.',
      aqiSpike: '+45 AQI Units',
      severity: 'High Alert'
    },
    timelineStep: 2,
    initialUpvotes: 124
  },
  {
    id: 'rep-002',
    category: 'Construction',
    status: 'Reported',
    aiVerification: 88,
    userName: 'Priya Patel',
    timestamp: '6h ago',
    wardName: 'Kankarbagh Ward',
    locationDetails: 'Kankarbagh Construction Site - Cement dust',
    lat: 25.597,
    lng: 85.150,
    description: 'Heavy construction dust coming from the new site. No water sprinkling being done despite high winds, making it impossible to breathe in the area.',
    imageUrl: 'https://images.unsplash.com/photo-1541888086425-d81bb19240f5?auto=format&fit=crop&w=800&q=80',
    aiDiagnostics: {
      source: 'Construction dust & cement mixing without dust mitigation.',
      aqiSpike: '+35 AQI Units',
      severity: 'Hazardous'
    },
    timelineStep: 1,
    initialUpvotes: 89
  },
  {
    id: 'rep-003',
    category: 'Garbage Burning',
    status: 'In Progress',
    aiVerification: 91,
    userName: 'Rahul Singh',
    timestamp: '1h ago',
    wardName: 'Frazer Road',
    locationDetails: 'Frazer Road - Open garbage burning',
    lat: 25.611,
    lng: 85.138,
    description: 'Large pile of plastic and organic waste has been set on fire. Thick black smoke is spreading into the nearby commercial complex.',
    imageUrl: null,
    aiDiagnostics: {
      source: 'Combustion of mixed municipal solid waste and plastics.',
      aqiSpike: '+55 AQI Units',
      severity: 'Severe'
    },
    timelineStep: 3,
    initialUpvotes: 210
  }
];

interface ReportsContextType {
  reports: Report[];
  addReport: (report: Report) => void;
}

const ReportsContext = createContext<ReportsContextType | undefined>(undefined);

export function ReportsProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<Report[]>(INITIAL_REPORTS);

  const addReport = (newReport: Report) => {
    setReports((prev) => [newReport, ...prev]);
  };

  return (
    <ReportsContext.Provider value={{ reports, addReport }}>
      {children}
    </ReportsContext.Provider>
  );
}

export function useReports() {
  const context = useContext(ReportsContext);
  if (context === undefined) {
    throw new Error('useReports must be used within a ReportsProvider');
  }
  return context;
}
