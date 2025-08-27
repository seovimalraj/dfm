'use client';
import React from 'react';
import { createClientBrowser } from '@/lib/supabaseClient';
export const dynamic = 'force-dynamic';
export default function Upload(){
  const supa = createClientBrowser();
  const [file,setFile] = React.useState<File|null>(null);
  const [form,setForm] = React.useState({ name:'', material:'', process:'cnc_3axis', certification:'ISO 9001', toleranceClass:'General (ISO 2768-mK)', postProcess:'Anodize', criticality:'Standard' });
  const [jobId,setJobId] = React.useState<string|undefined>();
  const [status,setStatus] = React.useState<string>('idle');
  async function start(e: any){
    e.preventDefault();
    const { data:{ user } } = await supa.auth.getUser();
    if(!user) return alert('Login required');
    if(!file) return alert('Select STL');
    const pr = await fetch('/api/parts',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ userId:user.id, name:form.name, material:form.material, process:form.process, fileName:file.name }) });
    const pj = await pr.json(); if(!pr.ok) return alert(pj.error||'parts failed');
    const up = await supa.storage.from('cad').upload(pj.fileKey, file, { upsert:true, contentType:file.type||'application/octet-stream' }); if(up.error) return alert(up.error.message);
    const ar = await fetch('/api/dfm/analyze',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ partId: pj.part.id, certification:form.certification, toleranceClass:form.toleranceClass, postProcess:form.postProcess, criticality:form.criticality }) });
    const aj = await ar.json(); if(!ar.ok) return alert(aj.error||'analyze failed');
    setJobId(aj.jobId); setStatus('pending');
  }
  React.useEffect(()=>{ if(!jobId) return; const t = setInterval(async()=>{ const r = await fetch('/api/jobs/' + jobId); const j = await r.json(); if(r.ok){ setStatus(j.job.status); if(j.job.status==='completed') clearInterval(t); } }, 2000); return ()=>clearInterval(t); }, [jobId]);
  async function gen(){ const r = await fetch('/api/qap/generate',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ jobId }) }); const j = await r.json(); if(!r.ok) alert(j.error); else alert('QAP ready: ' + j.pdfKey); }
  return (<div className='p-6 space-y-3'><h1 className='text-2xl font-semibold'>Upload CAD</h1><form onSubmit={start} className='space-y-2'><input className='border p-2 w-full' placeholder='Part name' value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/><input className='border p-2 w-full' placeholder='Material (e.g., Al6061)' value={form.material} onChange={e=>setForm({...form, material:e.target.value})}/><select className='border p-2 w-full' value={form.certification} onChange={e=>setForm({...form, certification:e.target.value})}><option>ISO 9001</option><option>ISO 13485</option><option>IATF 16949</option><option>AS9100</option></select><select className='border p-2 w-full' value={form.toleranceClass} onChange={e=>setForm({...form, toleranceClass:e.target.value})}><option>General (ISO 2768-mK)</option><option>Tight</option><option>Very Tight</option></select><select className='border p-2 w-full' value={form.postProcess} onChange={e=>setForm({...form, postProcess:e.target.value})}><option>Anodize</option><option>Hard Anodize</option><option>Bead-blast</option><option>Passivation</option></select><select className='border p-2 w-full' value={form.criticality} onChange={e=>setForm({...form, criticality:e.target.value})}><option>Standard</option><option>Performance</option><option>Critical</option></select><input type='file' accept='.stl' className='border p-2 w-full' onChange={e=>setFile(e.target.files?.[0]||null)} /><button className='px-4 py-2 bg-black text-white'>Start Analysis</button></form><div>Status: {status}</div>{status==='completed' && <button className='px-4 py-2 bg-green-600 text-white' onClick={gen}>Generate QAP</button>}</div>);
}
