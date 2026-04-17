import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

// External Supabase project (user-owned, not Lovable Cloud)
const SUPABASE_URL = 'https://phezstkfxuoltbepbgfs.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoZXpzdGtmeHVvbHRiZXBiZ2ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNTc4NzksImV4cCI6MjA5MTgzMzg3OX0.CU9Aqko8EVAqZOQOjKC7gmZN7YhFtxyhMPi4B8EGX2g';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
