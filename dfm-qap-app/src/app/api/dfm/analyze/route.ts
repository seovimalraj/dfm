import { NextRequest, NextResponse } from 'next/server';
import { createServiceRole } from '@/lib/supabaseServer';
export const runtime = 'nodejs';
export async function POST(req: NextRequest){
  const b = await req.json();
  const supa = createServiceRole();
  const { data: part, error: pErr } = await supa.from('parts').select('*').eq('id', b.partId).single();
  if(pErr || !part) return NextResponse.json({ error: pErr?.message || 'Part not found' }, { status:404 });
  const { data: signed, error: sErr } = await supa.storage.from('cad').createSignedUrl(part.file_key, 3600);
  if(sErr) return NextResponse.json({ error: sErr.message }, { status:500 });
  const payload = { part_id: b.partId, certification: b.certification, tolerance_class: b.toleranceClass, post_process: b.postProcess, criticality: b.criticality, input_url: signed.signedUrl, status: 'pending' };
  const { data: job, error: jErr } = await supa.from('analysis_jobs').insert(payload).select('*').single();
  if(jErr) return NextResponse.json({ error: jErr.message }, { status:500 });
  return NextResponse.json({ jobId: job.id });
}
