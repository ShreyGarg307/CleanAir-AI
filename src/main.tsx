
const originalConsoleError = console.error;
console.error = function (...args) {
  if (typeof args[0] === 'string' && (
      args[0].includes('BillingNotEnabledMapError') || 
      args[0].includes('You must enable Billing on the Google Cloud Project') ||
      args[0].includes('Geolocation Error Code')
  )) {
    console.warn(...args);
    return;
  }
  originalConsoleError.apply(console, args);
};

(window as any).gm_authFailure = function() {
  console.warn("Google Maps Authentication or Billing Failed. Some map features will be disabled.");
};

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './ErrorBoundary.tsx';
import './index.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CrewCompletion } from './components/CrewCompletion';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/complete-job/:reportId" element={<CrewCompletion />} />
          <Route path="*" element={<App />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
