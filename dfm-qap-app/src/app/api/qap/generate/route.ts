import { NextRequest, NextResponse } from 'next/server';
import { createServiceRole } from '@/lib/supabaseServer';
import { pdf } from '@react-pdf/renderer';
import QAPDoc from '@/lib/pdf/QAP';
export const runtime = 'nodejs';
export async function POST(req: NextRequest){
  const { jobId } = await req.json();
  const supa = createServiceRole();
  const { data: job, error } = await supa.from('analysis_jobs').select('*').eq('id', jobId).single();
  if(error || !job) return NextResponse.json({ error: error?.message || 'Job not found' }, { status:404 });
  if(job.status !== 'completed') return NextResponse.json({ error: 'Job not completed' }, { status:400 });
  const qap = { sampling: { strategy: 'AQL', levels: { critical:'100%', major:'0.4', minor:'1.0' } } };
  const element = QAPDoc({ job, qap });
  const buffer = await pdf(element).toBuffer();
  const key = 'qap/' + job.part_id + '/' + job.id + '.pdf';
  const { error: upErr } = await supa.storage.from('qap').upload(key, buffer, { upsert:true, contentType:'application/pdf' });
  if(upErr) return NextResponse.json({ error: upErr.message }, { status:500 });
  const { data: row, error: qErr } = await supa.from('qap').insert({ part_id: job.part_id, job_id: job.id, qap_json: qap, pdf_key: key }).select('*').single();
  if(qErr) return NextResponse.json({ error: qErr.message }, { status:500 });
  return NextResponse.json({ qapId: row.id, pdfKey: key });
}
