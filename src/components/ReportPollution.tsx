import React, { useState, useRef } from 'react';
import { 
  Plus, 
  X, 
  Flame, 
  Cloud, 
  Hammer, 
  Factory, 
  Car, 
  Droplet, 
  Frown, 
  Waves, 
  Folder,
  UploadCloud,
  Mic,
  MapPin,
  RefreshCcw,
  Image as ImageIcon,
  CheckCircle2,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useReports } from '../context/ReportsContext';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const CATEGORIES = [
  { id: 'garbage', label: 'GARBAGE BURNING', icon: Flame, text: 'Garbage Burning' },
  { id: 'dust', label: 'DUST', icon: Cloud, text: 'Dust' },
  { id: 'construction', label: 'CONSTRUCTION', icon: Hammer, text: 'Construction' },
  { id: 'industrial', label: 'INDUSTRIAL EMISSION', icon: Factory, text: 'Industrial Emission' },
  { id: 'vehicle', label: 'VEHICLE SMOKE', icon: Car, text: 'Vehicle Smoke' },
  { id: 'water', label: 'WATER POLLUTION', icon: Droplet, text: 'Water Pollution' },
  { id: 'smell', label: 'BAD SMELL', icon: Frown, text: 'Bad Smell' },
  { id: 'sewage', label: 'OPEN SEWAGE', icon: Waves, text: 'Open Sewage' },
  { id: 'others', label: 'OTHERS', icon: Folder, text: 'Others' },
];

export function ReportPollution() {
  const { addReport } = useReports();
  const { coordinates, locationString, isLocating, refreshLocation } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [description, setDescription] = useState('');
  const [name, setName] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLButtonElement | HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLButtonElement | HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLButtonElement | HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFile = (uploadedFile: File) => {
    setFile(uploadedFile);
    if (uploadedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(uploadedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!selectedCategory) {
      setError("Please select a category");
      return;
    }
    if (!coordinates.lat || !coordinates.lng) {
      setError("Location is required. Please allow location access.");
      return;
    }

    setIsSubmitting(true);
    
    try {
      let imageUrl = null;
      if (file) {
        const storage = getStorage();
        const imageRef = ref(storage, `reports/${Date.now()}_${file.name}`);
        await uploadBytes(imageRef, file);
        imageUrl = await getDownloadURL(imageRef);
      }
      
      const categoryText = CATEGORIES.find(c => c.id === selectedCategory)?.text || 'Others';
      const userName = isAnonymous ? 'Anonymous Citizen' : (name.trim() || 'Anonymous Citizen');

      await addDoc(collection(db, "reports"), {
        userId: currentUser?.uid || 'anonymous',
        citizenName: currentUser?.displayName || userName,
        category: categoryText,
        description: description.trim() || 'No description provided.',
        location: coordinates,
        city: locationString || "Unknown",
        wardName: locationString || "Unknown",
        imageUrl: imageUrl,
        status: "pending",
        initialUpvotes: 0,
        timestamp: serverTimestamp(),
        lat: coordinates.lat,
        lng: coordinates.lng
      });
      
      setIsOpen(false);
      setSelectedCategory(null);
      setDescription('');
      setName('');
      setIsAnonymous(false);
      setFile(null);
      setPreviewUrl(null);
      setShowToast(true);
      
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
      
    } catch (err: any) {
      console.error("Error submitting report:", err);
      setError(err.message || 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Toast Notification */}
      <div 
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 transform ${
          showToast ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 font-semibold text-sm">
          <CheckCircle2 size={18} className="text-emerald-400" />
          Pollution report submitted successfully.
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 md:bottom-8 md:right-8 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-4 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 z-40 group flex items-center justify-center"
        aria-label="Report Pollution"
      >
        <Plus size={32} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div 
            className="w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-4 duration-300"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                  <AlertTriangle className="text-rose-500 w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">Report Pollution</h2>
                  <p className="text-sm font-medium text-slate-500">Help clear the streets in 30 seconds</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="overflow-y-auto p-4 sm:p-6 space-y-8 flex-1">
              
              {/* Step 1: Category */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  1. SELECT CATEGORY <span className="text-rose-500">*</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 ${
                          isSelected 
                            ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm' 
                            : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <Icon size={24} className={`mb-2 ${isSelected ? 'text-rose-500' : 'text-slate-400'}`} />
                        <span className={`text-[10px] sm:text-xs font-bold tracking-wide text-center leading-tight ${isSelected ? 'text-rose-700' : 'text-slate-600'}`}>
                          {cat.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Step 2 & 3 Flex Container (Desktop) / Stack (Mobile) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Photo Upload */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    2. UPLOAD PHOTO (OPTIONAL)
                  </h3>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="image/*,video/*" 
                    className="hidden" 
                  />
                  {!file ? (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      className={`w-full h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors ${
                        isDragging 
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-600' 
                          : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 text-slate-500'
                      }`}
                    >
                      <UploadCloud size={32} className={isDragging ? 'text-emerald-500' : 'text-slate-400'} />
                      <span className="text-sm font-medium px-4 text-center">
                        {isDragging ? 'Drop file here' : 'Drag & Drop or Click to Upload Photo/Video'}
                      </span>
                    </button>
                  ) : (
                    <div className="w-full h-32 rounded-2xl border border-slate-200 bg-slate-50 p-2 relative overflow-hidden group">
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeFile(); }}
                        className="absolute top-2 right-2 p-1 bg-slate-900/50 hover:bg-rose-500 text-white rounded-full transition-colors z-10"
                        title="Remove file"
                      >
                        <X size={16} />
                      </button>
                      {previewUrl ? (
                        <div className="w-full h-full rounded-xl overflow-hidden bg-black/5">
                          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-full h-full rounded-xl flex flex-col items-center justify-center bg-emerald-50 text-emerald-600">
                          <ImageIcon size={32} className="mb-2" />
                          <span className="text-xs font-bold text-center px-4 truncate max-w-full">
                            {file.name}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Voice Report */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    3. VOICE REPORT (OPTIONAL)
                  </h3>
                  <div className="w-full h-32 rounded-2xl border-2 border-slate-100 bg-slate-50 flex flex-col items-center justify-center gap-3">
                    <button 
                      onClick={() => setIsRecording(!isRecording)}
                      className={`p-4 rounded-full shadow-lg transition-all duration-300 ${
                        isRecording 
                          ? 'bg-rose-500 text-white animate-pulse scale-110 shadow-rose-200' 
                          : 'bg-white text-rose-500 hover:scale-105'
                      }`}
                    >
                      <Mic size={24} />
                    </button>
                    <span className="text-xs font-medium text-slate-500">
                      {isRecording ? 'Recording...' : 'Tap to Speak (Simulate Voice Reporting)'}
                    </span>
                  </div>
                </div>

              </div>

              {/* GPS Location Indicator Card */}
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 flex items-start sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600 mt-1 sm:mt-0">
                    {isLocating ? <Loader2 size={20} className="animate-spin" /> : <MapPin size={20} />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-700 mb-1">
                      GPS CAPTURED AUTOMATICALLY
                    </h4>
                    {isLocating ? (
                      <p className="text-sm font-medium text-slate-600">Fetching GPS...</p>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-slate-800">
                          {locationString}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Coordinates: {coordinates.lat.toFixed(5)}° N, {coordinates.lng.toFixed(5)}° E
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <button 
                  onClick={refreshLocation}
                  disabled={isLocating}
                  className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors disabled:opacity-50"
                >
                  <RefreshCcw size={14} className={isLocating ? 'animate-spin' : ''} />
                  <span className="hidden sm:inline">Refresh Location</span>
                </button>
              </div>

              {/* Step 4: Description */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  4. DESCRIPTION (WHAT DO YOU SEE?)
                </h3>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Thick smoke from dry burning plastic, causing severe throat irritation..."
                  className="w-full h-28 p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none text-sm font-medium text-slate-800 placeholder-slate-400"
                />
              </div>

              {/* Footer Actions Area */}
              <div className="pt-4 border-t border-slate-100 space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                      isAnonymous 
                        ? 'bg-rose-500 border-rose-500 text-white' 
                        : 'bg-white border-slate-300 group-hover:border-rose-400'
                    }`}>
                      {isAnonymous && (
                        <svg className="w-3 h-3 pointer-events-none" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2.5 7L5.5 10L11.5 4" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-bold text-slate-700 select-none">
                      Report Anonymously
                    </span>
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                    />
                  </label>

                  {!isAnonymous && (
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Name (Optional)"
                      className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm font-medium w-full sm:w-64"
                    />
                  )}
                </div>

                {error && <div className="p-3 bg-rose-50 text-rose-700 text-sm rounded-xl font-medium mb-3">{error}</div>}
                <button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-lg shadow-xl shadow-slate-200 hover:shadow-md transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  {isSubmitting ? 'Submitting...' : 'Report Pollution in 30s'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
