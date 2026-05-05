import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

/**
 * Admin Supabase client with service role key
 * BYPASSES ALL RLS POLICIES - Use with extreme caution!
 * 
 * Security:
 * - Only use in server-side code (API routes, server actions)
 * - Never expose to client
 * - Use only for administrative operations that require bypassing RLS
 * - Always validate user permissions before using
 * 
 * Use cases:
 * - Creating profiles on signup (trigger alternative)
 * - Admin operations
 * - Batch operations
 * - Audit logging
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin credentials')
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
