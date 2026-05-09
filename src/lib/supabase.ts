import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 1. Initialize the client immediately to prevent the loading flicker
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "nextask-auth-token",
    },
  }
);

// 2. Export your original function so you DON'T have to rewrite the rest of your app!
export const getSupabaseClient = () => {
  return supabase;
};