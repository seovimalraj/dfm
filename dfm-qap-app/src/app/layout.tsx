import './globals.css';
import React from 'react';
export default function RootLayout({ children }:{ children: React.ReactNode }){
  return (<html><body><div className='max-w-5xl mx-auto'>{children}</div></body></html>);
}
