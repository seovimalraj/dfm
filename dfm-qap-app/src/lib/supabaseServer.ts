import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
export function createClientServer(){
  const store: any = cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { get: (n:string)=>store.get(n)?.value, set(){}, remove(){} } });
}
export function createServiceRole(){
  const { createClient } = require('@supabase/supabase-js');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}
