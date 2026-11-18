/**
 * BD22 Fire System & Builders Inc.
 * Supabase Client Configuration & Shared Client Instance
 */

const SUPABASE_CONFIG = {
  url: 'https://yalrvfcmpbrymdqlzncg.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhbHJ2ZmNtcGJyeW1kcWx6bmNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyNDY0OTgsImV4cCI6MjEwNzgyMjQ5OH0.Y2ZpFZmZ0byJAzOB43YCjRhkX_qsTDof3BzFNuL5blw'
};

// Initialize Supabase client globally
if (typeof window !== 'undefined') {
  if (window.supabase && typeof window.supabase.createClient === 'function') {
    window.supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: window.localStorage
      }
    });
  } else {
    console.error('Supabase SDK not loaded. Ensure @supabase/supabase-js is included in <head>.');
  }
}
