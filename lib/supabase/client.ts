import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/types'

/**
 * Client-side Supabase client
 * Use this in React components and client-side code
 * 
 * Security: Uses anon key which respects RLS policies
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
