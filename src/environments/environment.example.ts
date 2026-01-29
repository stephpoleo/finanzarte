// Copy this file to environment.ts and environment.prod.ts
// Fill in your Supabase credentials from .env file or Supabase dashboard

export const environment = {
  production: false,
  // Set to true to bypass login and use mock data for development
  devMode: false,
  supabase: {
    // Get these from .env file or Supabase dashboard -> Settings -> API
    url: 'YOUR_SUPABASE_PROJECT_URL',      // e.g., https://xxxxx.supabase.co
    anonKey: 'YOUR_SUPABASE_ANON_KEY'      // The "anon" public key
  }
};
