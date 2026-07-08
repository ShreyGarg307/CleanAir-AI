import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from './LocationContext';

const GOOGLE_KEY = typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '') : '';
const WEATHER_KEY = typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.VITE_OPENWEATHER_API_KEY || '') : '';

export interface PollutantData {
  pm25: number;   // μg/m³
  pm10: number;   // μg/m³
  co: number;     // mg/m³
  no2: number;    // μg/m³
  o3: number;     // μg/m³
  so2: number;    // μg/m³
}

export interface WeatherData {
  temp: number;         // °C
  feelsLike: number;    // °C
  humidity: number;     // %
  windSpeed: number;    // km/h
  windDeg: number;      // degrees
  description: string;
}

export interface ForecastPoint {
  dt: number;       // Unix timestamp
  hour: string;     // Formatted label e.g. "3 PM"
  aqi: number;      // CPCB-approximate numeric AQI
  pm25: number;     // μg/m³
  pm10: number;     // μg/m³
  category: string; // "Good" | "Moderate" etc.
}

interface AqiContextType {
  aqiIndex: number;
  aqiCategory: string;
  dominantPollutant: string;
  pollutants: PollutantData | null;
  weather: WeatherData | null;
  forecast: ForecastPoint[];
  loadingAqi: boolean;
  loadingForecast: boolean;
  dataSource: string;
  lastUpdated: Date | null;
}

const AqiContext = createContext<AqiContextType | undefined>(undefined);

// OpenWeatherMap AQI (1–5) mapped to approximate CPCB-style numeric index + label
const OWM_AQI_MAP: Record<number, { label: string; index: number }> = {
  1: { label: 'Good', index: 30 },
  2: { label: 'Satisfactory', index: 75 },
  3: { label: 'Moderate', index: 150 },
  4: { label: 'Poor', index: 250 },
  5: { label: 'Very Poor', index: 350 },
};

// CPCB PM2.5 breakpoints → AQI linear interpolation
function pm25ToCpcbAqi(pm25: number): { aqi: number; category: string } {
  const bps = [
    { cL: 0,   cH: 30,  iL: 0,   iH: 50,  cat: 'Good' },
    { cL: 30,  cH: 60,  iL: 50,  iH: 100, cat: 'Satisfactory' },
    { cL: 60,  cH: 90,  iL: 100, iH: 200, cat: 'Moderate' },
    { cL: 90,  cH: 120, iL: 200, iH: 300, cat: 'Poor' },
    { cL: 120, cH: 250, iL: 300, iH: 400, cat: 'Very Poor' },
    { cL: 250, cH: 500, iL: 400, iH: 500, cat: 'Severe' },
  ];
  for (const bp of bps) {
    if (pm25 >= bp.cL && pm25 <= bp.cH) {
      const aqi = Math.round(((bp.iH - bp.iL) / (bp.cH - bp.cL)) * (pm25 - bp.cL) + bp.iL);
      return { aqi, category: bp.cat };
    }
  }
  return { aqi: 500, category: 'Severe' };
}

// Format a Unix timestamp to a short hour label
function formatHour(dt: number): string {
  const d = new Date(dt * 1000);
  return d.toLocaleTimeString([], { hour: 'numeric', hour12: true });
}

// Derive dominant pollutant by normalizing each against WHO guidelines
function getDominantPollutant(comp: Record<string, number>): string {
  const normalized = [
    { name: 'PM2.5', score: comp.pm2_5 / 15 },
    { name: 'PM10', score: comp.pm10 / 45 },
    { name: 'NO2', score: comp.no2 / 40 },
    { name: 'O3', score: comp.o3 / 100 },
    { name: 'SO2', score: comp.so2 / 20 },
    { name: 'CO', score: comp.co / 4000 },
  ].sort((a, b) => b.score - a.score);
  return normalized[0].name;
}

export function AqiProvider({ children }: { children: ReactNode }) {
  const { coordinates, isLocating } = useLocation();

  const [aqiIndex, setAqiIndex] = useState<number>(0);
  const [aqiCategory, setAqiCategory] = useState<string>('Loading...');
  const [dominantPollutant, setDominantPollutant] = useState<string>('--');
  const [pollutants, setPollutants] = useState<PollutantData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [loadingAqi, setLoadingAqi] = useState(true);
  const [loadingForecast, setLoadingForecast] = useState(true);
  const [dataSource, setDataSource] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (isLocating || !coordinates.lat || !coordinates.lng) return;

    const fetchAllData = async () => {
      setLoadingAqi(true);
      setLoadingForecast(true);
      let resolvedSource = '';

      // ── Step 1: OpenWeatherMap — Weather + Air Pollution + Forecast (parallel) ──
      if (WEATHER_KEY) {
        try {
          const [weatherRes, airRes, forecastRes] = await Promise.all([
            fetch(
              `https://api.openweathermap.org/data/2.5/weather?lat=${coordinates.lat}&lon=${coordinates.lng}&appid=${WEATHER_KEY}&units=metric`
            ),
            fetch(
              `https://api.openweathermap.org/data/2.5/air_pollution?lat=${coordinates.lat}&lon=${coordinates.lng}&appid=${WEATHER_KEY}`
            ),
            fetch(
              `https://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${coordinates.lat}&lon=${coordinates.lng}&appid=${WEATHER_KEY}`
            ),
          ]);

          if (weatherRes.ok) {
            const w = await weatherRes.json();
            setWeather({
              temp: Math.round(w.main.temp),
              feelsLike: Math.round(w.main.feels_like),
              humidity: w.main.humidity,
              windSpeed: Math.round((w.wind?.speed ?? 0) * 3.6), // m/s → km/h
              windDeg: w.wind?.deg ?? 0,
              description: w.weather?.[0]?.description ?? '',
            });
          }

          if (airRes.ok) {
            const air = await airRes.json();
            const comp = air.list?.[0]?.components as Record<string, number> | undefined;
            const owmAqi = air.list?.[0]?.main?.aqi as number | undefined;

            if (comp) {
              setPollutants({
                pm25: Math.round(comp.pm2_5 * 10) / 10,
                pm10: Math.round(comp.pm10 * 10) / 10,
                // OWM returns CO in μg/m³; divide by ~1150 to get mg/m³
                co: Math.round((comp.co / 1150) * 100) / 100,
                no2: Math.round(comp.no2 * 10) / 10,
                o3: Math.round(comp.o3 * 10) / 10,
                so2: Math.round(comp.so2 * 10) / 10,
              });
              setDominantPollutant(getDominantPollutant(comp));
            }

            // Use OWM AQI as baseline — will be overridden by Google if available
            if (owmAqi && OWM_AQI_MAP[owmAqi]) {
              const mapped = OWM_AQI_MAP[owmAqi];
              setAqiIndex(mapped.index);
              setAqiCategory(mapped.label);
              resolvedSource = 'OpenWeatherMap';
            }
          }

          // ── 24-Hour Air Pollution Forecast (OWM) ──────────────────────────────
          if (forecastRes.ok) {
            const fData = await forecastRes.json();
            const list: any[] = fData.list ?? [];
            // Take next 24 hourly points
            const points: ForecastPoint[] = list.slice(0, 24).map((item: any) => {
              const comp = item.components as Record<string, number>;
              const { aqi, category } = pm25ToCpcbAqi(comp.pm2_5 ?? 0);
              return {
                dt: item.dt,
                hour: formatHour(item.dt),
                aqi,
                pm25: Math.round((comp.pm2_5 ?? 0) * 10) / 10,
                pm10: Math.round((comp.pm10 ?? 0) * 10) / 10,
                category,
              };
            });
            setForecast(points);
          }
          setLoadingForecast(false);
        } catch (e) {
          console.warn('[AqiContext] OpenWeatherMap fetch failed:', e);
          setLoadingForecast(false);
        }
      } else {
        setLoadingForecast(false);
      }

      // ── Step 2: Google Air Quality API — Best AQI (overrides OWM) ────────────
      if (GOOGLE_KEY) {
        try {
          const res = await fetch(
            `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${GOOGLE_KEY}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                location: { latitude: coordinates.lat, longitude: coordinates.lng },
                extraComputations: [
                  'HEALTH_RECOMMENDATIONS',
                  'POLLUTANT_CONCENTRATION',
                  'DOMINANT_POLLUTANT_CONCENTRATION',
                ],
                languageCode: 'en',
              }),
            }
          );

          if (res.ok) {
            const data = await res.json();
            const indexes: any[] = data.indexes ?? [];

            // Prefer India CPCB index → Universal AQI → first available
            const best =
              indexes.find((i: any) => i.code === 'ind_cpcb') ||
              indexes.find((i: any) => i.code === 'uaqi') ||
              indexes[0];

            if (best) {
              setAqiIndex(best.aqi ?? 0);
              setAqiCategory(best.category ?? 'Unknown');
              setDominantPollutant(
                (best.dominantPollutant ?? '--')
                  .replace(/_/g, ' ')
                  .toUpperCase()
              );
              resolvedSource = 'Google Air Quality (CPCB)';
            }

            // Override pollutant concentrations with Google's more precise values
            const gPollutants: any[] = data.pollutants ?? [];
            if (gPollutants.length > 0) {
              const getVal = (code: string) => {
                const p = gPollutants.find((p: any) => p.code === code);
                return Math.round((p?.concentration?.value ?? 0) * 10) / 10;
              };
              setPollutants({
                pm25: getVal('pm25'),
                pm10: getVal('pm10'),
                co: Math.round((getVal('co') / 1000) * 100) / 100, // μg/m³ → mg/m³
                no2: getVal('no2'),
                o3: getVal('o3'),
                so2: getVal('so2'),
              });
            }
          }
        } catch (e) {
          console.warn('[AqiContext] Google Air Quality API failed:', e);
        }
      }

      setDataSource(resolvedSource || 'Unavailable');
      setLastUpdated(new Date());
      setLoadingAqi(false);
    };

    fetchAllData();
  }, [coordinates.lat, coordinates.lng, isLocating]);

  return (
    <AqiContext.Provider
      value={{
        aqiIndex,
        aqiCategory,
        dominantPollutant,
        pollutants,
        weather,
        forecast,
        loadingAqi,
        loadingForecast,
        dataSource,
        lastUpdated,
      }}
    >
      {children}
    </AqiContext.Provider>
  );
}

export function useAqi() {
  const context = useContext(AqiContext);
  if (context === undefined) {
    throw new Error('useAqi must be used within an AqiProvider');
  }
  return context;
}
