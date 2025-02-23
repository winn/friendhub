import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: {
      getItem: (key) => {
        try {
          const storedSession = globalThis.localStorage.getItem(key);
          return storedSession;
        } catch {
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          globalThis.localStorage.setItem(key, value);
        } catch {}
      },
      removeItem: (key) => {
        try {
          globalThis.localStorage.removeItem(key);
        } catch {}
      }
    }
  }
});