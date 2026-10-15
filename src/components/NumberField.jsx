import React,{useEffect,useState} from 'react';
export default function NumberField({label,value,onChange,step=.01,min,max}){
  const [draft,setDraft]=useState(String(value));
  useEffect(()=>setDraft(String(value)),[value]);
  return <label className="number-field"><span>{label}</span><input aria-label={label} type="number" step={step} min={min} max={max} value={draft} onChange={e=>setDraft(e.target.value)} onBlur={()=>{if(draft.trim()&&Number.isFinite(Number(draft)))onChange(Number(draft));setDraft(String(value));}} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();}}/></label>;
}
