import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://phezstkfxuoltbepbgfs.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoZXpzdGtmeHVvbHRiZXBiZ2ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTc4NzksImV4cCI6MjA5MTgzMzg3OX0.CU9Aqko8EVAqZOQOjKC7gmZN7YhFtxyhMPi4B8EGX2g';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
