import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'hi';

const TRANSLATIONS = {
  en: {
    // Nav & Sidebar (Citizen)
    citizen_feed: 'Citizen Feed',
    interactive_map: 'Interactive Map',
    ai_prediction: '24-Hour AI Prediction',
    my_reports: 'My Reports',
    profile: 'My Profile',
    logout: 'Secure Logout',
    authenticating: 'Authenticating...',
    
    // Command Center (Municipal)
    command_center: 'Command Center',
    overview_analytics: 'Overview Analytics',
    live_incidents: 'Live Incidents',
    active_incidents: 'Active Incidents',
    duty_officer: 'Duty Officer',
    verified_close: 'Verify & Close Incident Ledger',
    sim_reply: "Simulate Crew 'Done' WhatsApp Reply",
    crew_response: 'Crew Response',
    awaiting_verif: 'Awaiting Verification',
    review_dispatch: 'Review & Dispatch',
    redispatch: 'Re-dispatch Crew',
    no_incidents: 'No Incidents Found',
    live_queue: 'Live Incident Queue',
    action_center: 'Action Center',
    incident_evidence: 'Incident Evidence',
    citizen_desc: 'Citizen Description',
    location: 'Location',
    coordinates: 'Coordinates',
    dispatch_dept: 'Target Department',
    dispatch_phone: 'Department WhatsApp Number',
    dispatch_crew: 'Dispatch Crew',
    dispatching: 'Dispatching...',
    dispatch_success: 'Crew dispatched successfully!',
    gemini_strategy: 'Gemini Mitigation Strategy',
    ai_suggests: 'AI Suggests',
    no_image: 'No image provided',

    // KPIs & Analytics
    pending: 'Pending',
    critical: 'Critical',
    solved_today: 'Solved Today',
    active_teams: 'Active Teams',
    recent_dispatches: 'Recent Dispatches',
    no_dispatches: 'No active dispatches',
    resolution_trend: '7-Day Resolution Trend',
    top_categories: 'Top Categories',
    new_reports: 'New Reports',
    resolved: 'Resolved',

    // AQI & Current Card
    realtime_aqi: 'Real-Time AQI',
    dominant: 'Dominant',
    updated: 'Updated',
    loading_aqi: 'Loading AQI...',
    good: 'Good',
    satisfactory: 'Satisfactory',
    moderate: 'Moderate',
    poor: 'Poor',
    very_poor: 'Very Poor',
    severe: 'Severe',
    temp: 'Temp',
    wind: 'Wind',
    humidity: 'Humidity',

    // Citizen Feed & Filters
    feed_title: 'Citizen Feed Queue',
    all_categories: 'All Categories',
    all_statuses: 'All Statuses',
    reported: 'Reported',
    dispatched: 'Dispatched',
    in_progress: 'In Progress',
    resolved_lbl: 'Resolved',
    upvotes: 'upvotes',
    anonymous: 'Anonymous Citizen',
    reported_by: 'Reported by',
    near_you: 'near you',
    mitigation_strategy: 'Mitigation Strategy',
    no_strategy: 'No strategy selected',
    upvote: 'Upvote',
    upvoted: 'Upvoted',

    // Report Modal
    report_incident: 'Report Air & Street Pollution',
    select_category: 'Select Category',
    describe_issue: 'Describe the issue...',
    drag_image: 'Click or drag image to upload evidence (optional)',
    detecting_location: 'Detecting live coordinates...',
    submit_report: 'Submit Report to Municipal Ledger',
    submitting: 'Submitting...',
    anon_label: 'Report anonymously',

    // Notifications
    notifications: 'Notifications',
    my_notifications: 'My Notifications',
    clear_all: 'Clear All',
    no_alerts: 'No new status updates.',
    toast_new_rep: 'New Incident Reported',
    toast_rep_updated: 'Incident Updated'
  },
  hi: {
    // Nav & Sidebar (Citizen)
    citizen_feed: 'नागरिक फीड',
    interactive_map: 'इंटरएक्टिव मानचित्र',
    ai_prediction: '24-घंटे एआई पूर्वानुमान',
    my_reports: 'मेरी रिपोर्ट',
    profile: 'मेरी प्रोफाइल',
    logout: 'सुरक्षित लॉगआउट',
    authenticating: 'प्रमाणित किया जा रहा है...',
    
    // Command Center (Municipal)
    command_center: 'कमांड सेंटर',
    overview_analytics: 'विश्लेषण अवलोकन',
    live_incidents: 'सक्रिय घटनाएं',
    active_incidents: 'सक्रिय मामले',
    duty_officer: 'ड्यूटी ऑफिसर',
    verified_close: 'सत्यापित करें और मामला बंद करें',
    sim_reply: "क्रू का 'हो गया' व्हाट्सएप जवाब सिम्युलेट करें",
    crew_response: 'क्रू प्रतिक्रिया',
    awaiting_verif: 'सत्यापन की प्रतीक्षा है',
    review_dispatch: 'समीक्षा और प्रेषण',
    redispatch: 'क्रू को पुन: भेजें',
    no_incidents: 'कोई घटना नहीं मिली',
    live_queue: 'सक्रिय घटना सूची',
    action_center: 'कार्रवाई केंद्र',
    incident_evidence: 'घटना साक्ष्य',
    citizen_desc: 'नागरिक विवरण',
    location: 'स्थान',
    coordinates: 'निर्देशांक',
    dispatch_dept: 'लक्षित विभाग',
    dispatch_phone: 'विभाग का व्हाट्सएप नंबर',
    dispatch_crew: 'क्रू प्रेषित करें',
    dispatching: 'प्रेषित किया जा रहा है...',
    dispatch_success: 'क्रू को सफलतापूर्वक भेज दिया गया!',
    gemini_strategy: 'जेमिनी शमन रणनीति',
    ai_suggests: 'एआई सुझाव',
    no_image: 'कोई फोटो नहीं दी गई',

    // KPIs & Analytics
    pending: 'लंबित',
    critical: 'गंभीर',
    solved_today: 'आज हल किए गए',
    active_teams: 'सक्रिय टीमें',
    recent_dispatches: 'हाल ही के प्रेषण',
    no_dispatches: 'कोई सक्रिय प्रेषण नहीं',
    resolution_trend: '7-दिवसीय समाधान प्रवृत्ति',
    top_categories: 'शीर्ष श्रेणियां',
    new_reports: 'नई रिपोर्ट',
    resolved: 'समाधान हुआ',

    // AQI & Current Card
    realtime_aqi: 'वास्तविक समय एक्यूआई',
    dominant: 'मुख्य प्रदूषक',
    updated: 'अपडेट किया गया',
    loading_aqi: 'एक्यूआई लोड हो रहा है...',
    good: 'अच्छा',
    satisfactory: 'संतोषजनक',
    moderate: 'मध्यम',
    poor: 'खराब',
    very_poor: 'बहुत खराब',
    severe: 'गंभीर',
    temp: 'तापमान',
    wind: 'हवा',
    humidity: 'आर्द्रता',

    // Citizen Feed & Filters
    feed_title: 'नागरिक फीड सूची',
    all_categories: 'सभी श्रेणियां',
    all_statuses: 'सभी स्थितियाँ',
    reported: ' सूचित किया गया',
    dispatched: 'प्रेषित किया गया',
    in_progress: 'कार्य जारी है',
    resolved_lbl: 'समाधान हुआ',
    upvotes: 'वोट',
    anonymous: 'अनाम नागरिक',
    reported_by: 'द्वारा रिपोर्ट किया गया',
    near_you: 'आपके पास',
    mitigation_strategy: 'शमन रणनीति',
    no_strategy: 'कोई रणनीति चयनित नहीं',
    upvote: 'वोट दें',
    upvoted: 'वोट दिया',

    // Report Modal
    report_incident: 'वायु और सड़क प्रदूषण की रिपोर्ट करें',
    select_category: 'श्रेणी चुनें',
    describe_issue: 'समस्या का वर्णन करें...',
    drag_image: 'साक्ष्य अपलोड करने के लिए क्लिक करें या फोटो खींचे (वैकल्पिक)',
    detecting_location: 'लाइव निर्देशांक का पता लगाया जा रहा है...',
    submit_report: 'नगर निगम बहीखाते में सबमिट करें',
    submitting: 'सबमिट किया जा रहा है...',
    anon_label: 'गुमनाम रूप से रिपोर्ट करें',

    // Notifications
    notifications: 'सूचनाएं',
    my_notifications: 'मेरी सूचनाएं',
    clear_all: 'सभी साफ़ करें',
    no_alerts: 'कोई नया स्टेटस अपडेट नहीं है।',
    toast_new_rep: 'नई घटना की सूचना मिली',
    toast_rep_updated: 'घटना को अपडेट किया गया'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof TRANSLATIONS.en) => string;
}

const LanguageContext = React.createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('cleanair_lang');
    return (saved === 'hi' ? 'hi' : 'en') as Language;
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('cleanair_lang', lang);
  };

  const t = (key: keyof typeof TRANSLATIONS.en) => {
    return TRANSLATIONS[language][key] || TRANSLATIONS.en[key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
