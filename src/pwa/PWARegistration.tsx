"use client";
import { useEffect } from 'react';

export default function PWARegistration() {
  useEffect(() => {
    // 1. Only run in production (SWs interfere with Dev Refresh)
    // 2. Check if browser supports it
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      
      const handleLoad = () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          // This stops the InvalidStateError by waiting for 'load'
          console.error('SW Registration failed:', err);
        });
      };

      // If already loaded, register now. Otherwise, wait.
      if (document.readyState === 'complete') {
        handleLoad();
      } else {
        window.addEventListener('load', handleLoad);
        return () => window.removeEventListener('load', handleLoad);
      }
    }
  }, []);

  return null;
}