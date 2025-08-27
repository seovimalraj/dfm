'use client';
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
const styles = StyleSheet.create({ page:{ padding:24 }, h1:{ fontSize:18, marginBottom:8 }, box:{ marginTop:8, padding:8, borderWidth:1 } });
export default function QAPDoc({ job, qap }: any){
  return (<Document><Page size='A4' style={styles.page}><Text style={styles.h1}>Quality Assurance Plan</Text><View style={styles.box}><Text>Part: {job.part_id}</Text><Text>Certification: {job.certification}</Text><Text>Criticality: {job.criticality}</Text></View><View style={styles.box}><Text>Sampling: {qap.sampling.strategy}</Text></View></Page></Document>);
}
