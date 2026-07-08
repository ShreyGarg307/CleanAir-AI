import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';

type Coordinates = {
  lat: number;
  lng: number;
};

interface LocationContextType {
  setManualLocation: (lat: number, lng: number, newCity: string, address?: string) => void;
  coordinates: Coordinates;
  locationString: string;
  isLocating: boolean;
  permissionStatus: string;
  city: string | null;
  refreshLocation: () => void;
}

const DEFAULT_COORDINATES = { lat: 25.611, lng: 85.144 };
const DEFAULT_LOCATION_STRING = "Patna, Bihar, India";
const GOOGLE_KEY = typeof import.meta !== 'undefined' && import.meta.env ? (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '') : '';

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [coordinates, setCoordinates] = useState<Coordinates>(DEFAULT_COORDINATES);
  const [locationString, setLocationString] = useState<string>('Locating...');
  const [isLocating, setIsLocating] = useState<boolean>(true);
  const [permissionStatus, setPermissionStatus] = useState<string>('prompt');
  const [city, setCity] = useState<string | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_KEY,
    id: 'google-map-script',
    libraries: ['places', 'geometry', 'drawing']
  });

  const fetchLocation = () => {
    setIsLocating(true);
    
    if (!navigator.geolocation) {
      setFallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        setPermissionStatus('granted');
        
        if (isLoaded && window.google) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                    setLocationString(results[0].formatted_address);
                    
                    // Find city
                    let foundCity = 'Patna';
                    for (let i = 0; i < results[0].address_components.length; i++) {
                        const types = results[0].address_components[i].types;
                        if (types.includes('locality') || types.includes('administrative_area_level_2')) {
                            foundCity = results[0].address_components[i].long_name;
                            break;
                        }
                    }
                    setCity(foundCity);
                } else {
                    setLocationString(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
                    setCity('Patna');
                }
                setIsLocating(false);
            });
        } else {
            setLocationString(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
            setCity('Patna');
            setIsLocating(false);
        }
      },
      (error) => {
        console.warn("Geolocation Error Code:", error.code, error.message);
        setPermissionStatus('denied');
        setFallback();
      },
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 60000
      }
    );
  };

  const setManualLocation = (lat: number, lng: number, newCity: string, address?: string) => {
    setCoordinates({ lat, lng });
    setCity(newCity);
    setLocationString(address || newCity);
    setIsLocating(false);
  };

  const setFallback = () => {
    setCoordinates(DEFAULT_COORDINATES);
    setLocationString(DEFAULT_LOCATION_STRING);
    setCity('Patna');
    setIsLocating(false);
  };

  // Re-run reverse geocoding if script loads after position is found
  useEffect(() => {
    if (isLoaded && !isLocating && coordinates.lat !== DEFAULT_COORDINATES.lat) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: coordinates }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
                setLocationString(results[0].formatted_address);
                let foundCity = city || 'Patna';
                for (let i = 0; i < results[0].address_components.length; i++) {
                    const types = results[0].address_components[i].types;
                    if (types.includes('locality') || types.includes('administrative_area_level_2')) {
                        foundCity = results[0].address_components[i].long_name;
                        break;
                    }
                }
                setCity(foundCity);
            }
        });
    }
  }, [isLoaded]);

  useEffect(() => {
    fetchLocation();
  }, []);

  return (
    <LocationContext.Provider value={{ coordinates, locationString, isLocating, permissionStatus, city, refreshLocation: fetchLocation, setManualLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
