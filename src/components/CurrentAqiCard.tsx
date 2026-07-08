import React from 'react';
import { useAqi } from '../context/AqiContext';
import { getAqiColor } from './AIPrediction';
import { Activity, Wind, Thermometer, Droplets } from 'lucide-react';

export function CurrentAqiCard() {
  const {
    aqiIndex,
    aqiCategory,
    dominantPollutant,
    pollutants,
    weather,
    loadingAqi,
    dataSource,
    lastUpdated,
  } = useAqi();

  if (loadingAqi) {
    return (
      <div className="bg-white border-b border-slate-200 px-4 py-3 animate-pulse flex flex-col sm:flex-row items-center gap-4 w-full shrink-0 relative z-20">
        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        <div className="h-10 bg-slate-200 rounded w-20"></div>
        <div className="flex gap-3 flex-1 w-full mt-2 sm:mt-0">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-10 bg-slate-100 rounded flex-1"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!aqiIndex) return null;

  const aqiColor = getAqiColor(aqiIndex);

  const pollutantList = pollutants
    ? [
        { label: 'PM2.5', value: pollutants.pm25, unit: 'μg/m³' },
        { label: 'PM10', value: pollutants.pm10, unit: 'μg/m³' },
        { label: 'NO2', value: pollutants.no2, unit: 'μg/m³' },
        { label: 'O3', value: pollutants.o3, unit: 'μg/m³' },
        { label: 'CO', value: pollutants.co, unit: 'mg/m³' },
        { label: 'SO2', value: pollutants.so2, unit: 'μg/m³' },
      ]
    : [];

  const lastUpdatedStr = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--';

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-3 shrink-0 w-full flex flex-col xl:flex-row xl:items-center justify-between gap-4 relative z-20">

      {/* Primary AQI block */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0 shrink-0">
        <div>
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Activity size={12} className="text-indigo-500" />
            Real-Time AQI
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800 tracking-tighter leading-none">
              {aqiIndex}
            </span>
            <span
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wide ${aqiColor.bg} text-white shadow-sm`}
            >
              {aqiCategory}
            </span>
          </div>
        </div>

        {/* Dominant pollutant + live source badge */}
        <div className="flex flex-col sm:border-l sm:border-slate-200 sm:pl-4 gap-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Dominant</span>
          <span className="text-xs font-bold text-slate-700">{dominantPollutant}</span>
          <div className="flex items-center gap-1 mt-1">
            <div className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </div>
            <span className="text-[9px] font-semibold text-emerald-600 truncate max-w-[140px]">
              {dataSource}
            </span>
          </div>
          {lastUpdated && (
            <span className="text-[9px] text-slate-400 font-medium">Updated {lastUpdatedStr}</span>
          )}
        </div>

        {/* Weather snapshot */}
        {weather && (
          <div className="flex items-center gap-3 sm:border-l sm:border-slate-200 sm:pl-4 text-xs text-slate-600 shrink-0">
            <span className="flex items-center gap-1 font-semibold">
              <Thermometer size={13} className="text-orange-400" />
              {weather.temp}°C
            </span>
            <span className="flex items-center gap-1 font-semibold">
              <Wind size={13} className="text-blue-400" />
              {weather.windSpeed} km/h
            </span>
            <span className="flex items-center gap-1 font-semibold">
              <Droplets size={13} className="text-sky-400" />
              {weather.humidity}%
            </span>
          </div>
        )}
      </div>

      {/* Pollutant concentration grid */}
      {pollutantList.length > 0 && (
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1 xl:pb-0">
          {pollutantList.map((p) => (
            <div
              key={p.label}
              className="flex flex-col bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 min-w-[72px] shrink-0"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase">{p.label}</span>
              <span className="text-sm font-bold text-slate-700 whitespace-nowrap">
                {p.value}{' '}
                <span className="text-[10px] text-slate-500 font-medium">{p.unit}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
