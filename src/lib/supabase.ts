import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yniavfaxbjjpljomtsdn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InluaWF2ZmF4YmpqcGxqb210c2RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0Nzg3MjAsImV4cCI6MjA1NDA1NDcyMH0.ggxjPj02gBj-p8_L0_4ff-liL6ID3sPhlYmUYzpc420';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
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