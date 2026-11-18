const SUPABASE_CONFIG = {
  url: 'https://yalrvfcmpbrymdqlzncg.supabase.co',
  googleClientId: '503147002819-bgsfj7egrt3779ee26l4m9e8sfm6b53g.apps.googleusercontent.com',
  anonKey: 'sb_publishable_jdhiWQBl8KkO4-DF7ePyTA_ienwPnmf'
};

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
