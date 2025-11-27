'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/utils/supabase/server'

export async function signout() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/')
}