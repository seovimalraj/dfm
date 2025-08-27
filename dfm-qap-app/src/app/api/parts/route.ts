import { NextRequest, NextResponse } from 'next/server';
import { createServiceRole } from '@/lib/supabaseServer';
export const runtime = 'nodejs';
export async function POST(req: NextRequest){
  const body = await req.json();
  const { userId, name, material, process, fileName } = body;
  if(!userId || !name || !fileName) return NextResponse.json({ error:'Missing fields' }, { status:400 });
  const file_key = 'cad/' + userId + '/' + crypto.randomUUID() + '/' + fileName;
  const supa = createServiceRole();
  const { data, error } = await supa.from('parts').insert({ user_id:userId, name, material, process, file_key }).select('*').single();
  if(error) return NextResponse.json({ error: error.message }, { status:500 });
  return NextResponse.json({ part: data, fileKey: file_key });
}
