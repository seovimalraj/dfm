import { NextResponse } from 'next/server';
import { createServiceRole } from '@/lib/supabaseServer';
export const runtime = 'nodejs';
export async function GET(_req: Request, { params }: any){
  const supa = createServiceRole();
  const { data, error } = await supa.from('analysis_jobs').select('*').eq('id', params.id).single();
  if(error || !data) return NextResponse.json({ error: error?.message || 'Not found' }, { status:404 });
  return NextResponse.json({ job: data });
}
