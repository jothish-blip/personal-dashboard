import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

let supabaseInstance: any = null;

export const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null as any;

  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // 🔥 FIX FOR BRAVE: 
        // 1. Explicitly detect session in URL only when window is ready
        detectSessionInUrl: typeof window !== 'undefined',
        // 2. Use a unique storage key to avoid collisions
        storageKey: 'nextask-auth-token',
        // 3. Bypass the buggy navigator.locks in strict privacy browsers
        ...({
          lockType: 'custom'
        } as any)
      },
    });
  }
  return supabaseInstance;
};