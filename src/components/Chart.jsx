import React from 'react';
export default function Chart({data=[],label,xLabel,yLabel,logX=false,color='#5fdbc4',yRange}){
  const finite=data.filter(p=>Number.isFinite(p[0]) && Number.isFinite(p[1]) && (!logX||p[0]>0));
  if(finite.length<2)return <p className="muted">Keine Daten für {label}.</p>;
  const stride=Math.max(1,Math.ceil(finite.length/1400));
  const sampled=finite.filter((_,i)=>i%stride===0||i===finite.length-1);
  const tx=x=>logX?Math.log10(x):x;
  const xmin=tx(finite[0][0]),xmax=tx(finite.at(-1)[0]);
  let ymin=yRange?.[0]??finite.reduce((a,p)=>Math.min(a,p[1]),Infinity),ymax=yRange?.[1]??finite.reduce((a,p)=>Math.max(a,p[1]),-Infinity);
  if(ymin===ymax){ymin--;ymax++;}
  const x=v=>52+(tx(v)-xmin)/Math.max(1e-9,xmax-xmin)*704;
  const y=v=>200-(Math.max(ymin,Math.min(ymax,v))-ymin)/(ymax-ymin)*172;
  const path=sampled.map((p,i)=>`${i?'L':'M'}${x(p[0]).toFixed(2)},${y(p[1]).toFixed(2)}`).join(' ');
  return <figure className="chart"><figcaption>{label}</figcaption><svg viewBox="0 0 800 240" role="img" aria-label={`${label}, ${xLabel}, ${yLabel}`}>
    {[0,0.25,0.5,0.75,1].map(t=><g key={t}><line x1="52" x2="756" y1={200-172*t} y2={200-172*t} stroke="#293d4d"/><text x="46" y={204-172*t} textAnchor="end">{(ymin+t*(ymax-ymin)).toFixed(1)}</text></g>)}
    <path d={path} fill="none" stroke={color} strokeWidth="1.7"/>
    {[0,0.25,0.5,0.75,1].map(t=>{const v=logX?10**(xmin+(xmax-xmin)*t):xmin+(xmax-xmin)*t;return <text key={t} x={52+704*t} y="218" textAnchor="middle">{v<10?v.toFixed(2):Math.round(v)}</text>;})}
    <text x="400" y="237" textAnchor="middle">{xLabel}</text><text x="52" y="17">{yLabel}</text>
  </svg></figure>;
}
