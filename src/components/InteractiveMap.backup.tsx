import React, { useState, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Circle, Marker, InfoWindow, Autocomplete, OverlayView } from '@react-google-maps/api';
import { useRef } from 'react';
import { Search, AlertTriangle, Factory, Building2, Server, Crosshair } from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import { CurrentAqiCard } from './CurrentAqiCard';
import { useAqi } from '../context/AqiContext';
import { useReports } from '../context/ReportsContext';

const GOOGLE_KEY = typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '') : '';
const WEATHER_KEY = typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.VITE_OPENWEATHER_API_KEY || '') : '';

const LIBRARIES: ('places' | 'drawing' | 'geometry')[] = ['places', 'geometry', 'drawing'];

// SVGs for markers


export function InteractiveMap() {
  const { coordinates, refreshLocation, isLocating, permissionStatus, setManualLocation } = useLocation();
  const { aqiIndex } = useAqi();
  const { reports } = useReports();
  
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [weather, setWeather] = useState<{ speed: number; deg: number } | null>(null);

  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        
        let foundCity = 'Patna';
        if (place.address_components) {
            for (let i = 0; i < place.address_components.length; i++) {
                const types = place.address_components[i].types;
                if (types.includes('locality') || types.includes('administrative_area_level_2')) {
                    foundCity = place.address_components[i].long_name;
                    break;
                }
            }
        }
        
        setManualLocation(lat, lng, foundCity, place.formatted_address);
        
        if (map) {
          map.panTo({ lat, lng });
          map.setZoom(15);
        }
      }
    }
  };


  const [layers, setLayers] = useState({
    aqi: true,
    incidents: true,
    wind: false,
    satellite: false
  });

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'script-loader',
    googleMapsApiKey: GOOGLE_KEY,
    libraries: LIBRARIES
  });

  // Fetch Wind Data
  useEffect(() => {
    if (!WEATHER_KEY || !layers.wind || coordinates.lat === 25.611) return;
    
    const fetchWeather = async () => {
      try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${coordinates.lat}&lon=${coordinates.lng}&appid=${WEATHER_KEY}&units=metric`);
        if (!res.ok) throw new Error("Failed to fetch weather");
        const data = await res.json();
        setWeather({ speed: data.wind.speed, deg: data.wind.deg });
      } catch (err) {
        console.error("Wind data error:", err);
      }
    };
    fetchWeather();
  }, [coordinates, layers.wind]);

  // AQI zone markers — derived from real aqiIndex (backup file, unused in production)
  const ZONE_OFFSETS_B = [
    { id: 'Central Zone',  angleFrac: 0.00, radius: 0.030, offset:   0 },
    { id: 'Northern Zone', angleFrac: 0.25, radius: 0.060, offset: +15 },
    { id: 'Southern Zone', angleFrac: 0.50, radius: 0.050, offset:  -8 },
    { id: 'Eastern Zone',  angleFrac: 0.75, radius: 0.065, offset: +20 },
  ];
  const aqiMarkers = useMemo(() => {
    if (!aqiIndex) return [];
    return ZONE_OFFSETS_B.map(zone => ({
      id: zone.id,
      position: {
        lat: coordinates.lat + Math.sin(zone.angleFrac * Math.PI * 2) * zone.radius,
        lng: coordinates.lng + Math.cos(zone.angleFrac * Math.PI * 2) * zone.radius,
      },
      aqi: Math.max(10, aqiIndex + zone.offset),
    }));
  }, [aqiIndex, coordinates]);


  // Generate Wind Grid
  const windMarkers = useMemo(() => {
    if (!weather) return [];
    const markers: { id: string; position: { lat: number; lng: number } }[] = [];
    const gridSize = 3;
    const step = 0.06;
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        markers.push({
          id: `wind-${x}-${y}`,
          position: {
            lat: coordinates.lat + (x * step),
            lng: coordinates.lng + (y * step)
          }
        });
      }
    }
    return markers;
  }, [weather, coordinates]);

  const activeReport = useMemo(() => reports.find(r => r.id === activeReportId), [reports, activeReportId]);

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-slate-900 text-white p-8">
        <p>Error loading maps</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-slate-100 p-8 rounded-2xl">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 font-medium">Loading Map Engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white relative">
      <CurrentAqiCard />
      
      {/* Top Control Banner Section */}
      <div className="flex flex-col gap-4 p-4 bg-slate-50 border-b border-slate-200 z-10 shrink-0">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          
          {/* Horizontal Layer Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">Layers:</span>
            {[
              { id: 'aqi', label: 'AQI Grade Markers' },
              { id: 'incidents', label: 'Citizen Incident Pins' },
              { id: 'wind', label: 'Wind Vectors & Flow' },
              { id: 'satellite', label: 'Satellite Base Layer' }
            ].map(layer => (
              <button
                key={layer.id}
                onClick={() => setLayers(prev => ({ ...prev, [layer.id]: !prev[layer.id as keyof typeof prev] }))}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all border ${
                  layers[layer.id as keyof typeof layers]
                    ? 'bg-emerald-100 border-emerald-500 text-emerald-800 shadow-sm'
                    : 'bg-white border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50'
                }`}
              >
                {layer.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full xl:w-80 shrink-0">
            <Autocomplete
              onLoad={(auto) => { autocompleteRef.current = auto; }}
              onPlaceChanged={onPlaceChanged}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                <input 
                  type="text"
                  placeholder="Search neighborhoods, e.g. Anand Vihar..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-slate-800 placeholder-slate-400 transition-shadow"
                />
              </div>
            </Autocomplete>
          </div>
        </div>
      </div>

      {/* Map Canvas Area */}
      {isLocating && (
        <div className="absolute inset-0 z-50 bg-slate-100 flex flex-col items-center justify-center rounded-2xl">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-600 font-medium text-lg">Detecting Location...</p>
            <p className="text-slate-400 text-sm mt-2">Waiting for permission...</p>
          </div>
        </div>
      )}
      
      {permissionStatus === 'denied' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-rose-50 text-rose-600 px-4 py-2 rounded-lg border border-rose-200 shadow-md flex items-center gap-2 text-sm font-medium">
          <AlertTriangle className="w-4 h-4" />
          Location access denied. Using fallback data. Please enable location for accurate local metrics.
        </div>
      )}

      {(!GOOGLE_KEY || GOOGLE_KEY === 'YOUR_API_KEY') ? (
        <div className="relative flex-1 w-full min-h-0 bg-slate-900 text-white p-8 flex flex-col items-center justify-center">
          <div className="bg-slate-800 p-8 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-700">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center">
                <Server className="w-8 h-8 text-slate-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center mb-4">Awaiting Configuration</h2>
            <p className="text-slate-300 text-center mb-6">
              Awaiting valid VITE_GOOGLE_MAPS_API_KEY credential configuration...
            </p>
          </div>
        </div>
      ) : (
      <div className="relative flex-1 w-full min-h-0 bg-slate-100">
        <GoogleMap
          onLoad={(map) => setMap(map)}
          onUnmount={() => setMap(null)}
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={coordinates}
          zoom={11}
          options={{
            mapTypeId: layers.satellite ? 'satellite' : 'roadmap',
            disableDefaultUI: true,
          }}
        >
          {/* You Are Here Marker */}
          <Marker 
            position={coordinates} 
            title="You Are Here" 
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#3b82f6',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
          />
          {/* Pulse effect circle for the marker */}
          <Circle
            center={coordinates}
            radius={800}
            options={{
              fillColor: '#3b82f6',
              fillOpacity: 0.15,
              strokeColor: 'transparent',
              strokeOpacity: 0,
            }}
          />

          {/* AQI Overlays */}
          {layers.aqi && aqiMarkers.map((marker) => {
            let bgColor = 'bg-[#00B050]';
            let textColor = 'text-white';
            if (marker.aqi > 50) bgColor = 'bg-[#92D050]';
            if (marker.aqi > 100) { bgColor = 'bg-[#FFFF00]'; textColor = 'text-black'; }
            if (marker.aqi > 200) bgColor = 'bg-[#FF9900]';
            if (marker.aqi > 300) bgColor = 'bg-[#FF0000]';
            if (marker.aqi > 400) bgColor = 'bg-[#C00000]';
            
            return (
              <OverlayView
                key={marker.id}
                position={marker.position}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                getPixelPositionOffset={(width, height) => ({ x: -(width / 2), y: -(height / 2) })}
              >
                <div className={`flex items-center justify-center w-12 h-10 rounded-xl shadow-lg border-2 border-white font-bold text-lg ${bgColor} ${textColor}`}>
                  {marker.aqi}
                </div>
              </OverlayView>
            );
          })}

          {/* Citizen Incidents Overlays */}
          {layers.incidents && reports.map((report) => {
            let iconColor = 'text-yellow-500';
            if (report.initialUpvotes >= 10 && report.initialUpvotes < 50) iconColor = 'text-orange-500';
            if (report.initialUpvotes >= 50) iconColor = 'text-red-500';
            
            return (
              <OverlayView
                key={report.id}
                position={{ lat: report.lat, lng: report.lng }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                getPixelPositionOffset={(width, height) => ({ x: -(width / 2), y: -height })}
              >
                <div 
                  className="cursor-pointer group relative flex flex-col items-center"
                  onClick={() => setActiveReportId(report.id)}
                >
                  <div className="bg-white p-1.5 rounded-full shadow-md border border-slate-200 group-hover:scale-110 transition-transform">
                     <AlertTriangle className={`w-6 h-6 ${iconColor}`} />
                  </div>
                  {/* Small triangle pointing down */}
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white drop-shadow-md"></div>
                </div>
              </OverlayView>
            );
          })}
          
          {/* InfoWindow for Active Report */}
          {activeReportId && activeReport && (
             <InfoWindow
               position={{ lat: activeReport.lat, lng: activeReport.lng }}
               onCloseClick={() => setActiveReportId(null)}
             >
               <div className="p-2 max-w-[240px] text-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">{activeReport.category}</span>
                    <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">{activeReport.initialUpvotes} upvotes</span>
                  </div>
                  <p className="text-sm font-medium mb-2 line-clamp-3 leading-tight">{activeReport.description}</p>
                  {activeReport.imageUrl && (
                    <img src={activeReport.imageUrl} alt="Incident" className="w-full h-24 object-cover rounded-md mb-2" />
                  )}
                  <p className="text-xs text-slate-400">By {activeReport.userName}</p>
               </div>
             </InfoWindow>
          )}

          {/* Wind Vectors Overlays */}
          {layers.wind && weather && windMarkers.map((marker) => (
            <OverlayView
              key={marker.id}
              position={marker.position}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              getPixelPositionOffset={(width, height) => ({ x: -(width / 2), y: -(height / 2) })}
            >
              <div className="flex flex-col items-center pointer-events-none drop-shadow-md">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="28" height="28" viewBox="0 0 24 24"
                  style={{ transform: `rotate(${weather.deg}deg)` }}
                >
                  <path d="M12 2v20M12 2l-4 4M12 2l4 4" stroke="#3b82f6" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="mt-1 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-bold text-blue-800 border border-slate-200/50 shadow-sm">
                  {Math.round(weather.speed * 3.6)} km/h
                </div>
              </div>
            </OverlayView>
          ))}
        </GoogleMap>

        {/* Floating Locate Me Button */}
        <button 
          onClick={() => {
            refreshLocation();
            if (map) {
              map.panTo(coordinates);
              map.setZoom(11);
            }
          }}
          className="absolute bottom-6 right-4 bg-white p-3 rounded-full shadow-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors z-10"
          title="Locate Me"
        >
          <Crosshair className="w-5 h-5" />
        </button>
      </div>
      )}

      {/* Legend (Below Map) */}
      <div className="bg-slate-50 border-t border-slate-200 p-4 shrink-0">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">AQI Scale & Seriousness</h3>
        <div className="flex flex-wrap gap-8 items-center">
          <div className="flex gap-4">
            {[
              { range: '0-50', label: 'Good', color: 'bg-[#00B050]' },
              { range: '51-100', label: 'Satisfactory', color: 'bg-[#92D050]' },
              { range: '101-200', label: 'Moderate', color: 'bg-[#FFFF00] text-black' },
              { range: '201-300', label: 'Poor', color: 'bg-[#FF9900]' },
              { range: '301-400', label: 'Very Poor', color: 'bg-[#FF0000]' },
              { range: '401+', label: 'Severe', color: 'bg-[#C00000]' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                <div className={`w-4 h-4 rounded-sm flex items-center justify-center text-[8px] font-bold text-white shadow-sm ${item.color}`}></div>
                <div className="font-medium text-slate-600 hidden sm:block">{item.label}</div>
              </div>
            ))}
          </div>
          <div className="w-px h-6 bg-slate-300 hidden md:block"></div>
          <div className="flex gap-4">
             <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="hidden sm:block">&lt; 10 Upvotes</span>
             </div>
             <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="hidden sm:block">10-50 Upvotes</span>
             </div>
             <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="hidden sm:block">50+ Upvotes</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
