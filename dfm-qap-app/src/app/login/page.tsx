'use client';
import React, { useState } from 'react';
import { createClientBrowser } from '@/lib/supabaseClient';
export const dynamic = 'force-dynamic';
export default function Login(){
  const supa = createClientBrowser();
  const [email,setEmail] = useState('');
  const send = async ()=>{ const { error } = await supa.auth.signInWithOtp({ email }); if(error) alert(error.message); else alert('Magic link sent'); };
  return (<div className='p-8 space-y-3'><h1 className='text-2xl font-semibold'>Login</h1><input className='border p-2 w-80' placeholder='you@company.com' value={email} onChange={e=>setEmail(e.target.value)} /><button className='px-4 py-2 bg-black text-white' onClick={send}>Send Link</button></div>);
}
