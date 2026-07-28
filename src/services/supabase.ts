import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hnkcxtsnqfapnulkhsao.supabase.co';

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhua2N4dHNucWZhcG51bGtoc2FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMjU4NTQsImV4cCI6MjEwMDgwMTg1NH0.CuBXLLyeubYryTcO05WvMw-PB_qSh-8o4zZfIiwOHIY';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    'Supabase URL/anon key missing — check your .env file and that ' +
      'react-native-config is set up correctly on both platforms.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
