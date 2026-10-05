import { useEffect, useRef } from 'react';
import { ArrowUpRight, Check, Gem, Lock, Sparkles } from 'lucide-react';
import { format, materialCount, words } from './cardDetailModel';

export function SectionTitle({eyebrow,title,children,aside}) {
  return <header className="cdw-section-heading"><div>{eyebrow && <span className="cdw-eyebrow">{eyebrow}</span>}<h2>{title}</h2>{children && <p>{children}</p>}</div>{aside}</header>;
}
export function Empty({title,children,icon:Icon=Lock}) {
  return <div className="cdw-empty"><Icon size={30}/><h3>{title}</h3><p>{children}</p></div>;
}
export function Meter({value=0,max=1,label}) {
  return <div className="cdw-meter"><div><span>{label}</span><strong>{format(value)} / {format(max)}</strong></div><div role="progressbar" aria-label={label} aria-valuenow={Math.min(max,value)} aria-valuemin={0} aria-valuemax={Math.max(1,max)}><i style={{width:Math.min(100,Math.max(0,value/Math.max(1,max)*100))+'%'}}/></div></div>;
}
export function Costs({costs={},materials=[]}) {
  return <ul className="cdw-costs" aria-label="Required materials">{Object.entries(costs).map(([type,quantity]) => {
    const count=materialCount(materials,type);return <li key={type} data-enough={count>=quantity}><Gem size={15}/><span>{words(type)}<small>{format(count)} owned</small></span><strong>{format(quantity)}</strong>{count>=quantity?<Check size={13}/>:<Lock size={13}/>}</li>;
  })}</ul>;
}
export function PowerChange({before,after}) {
  return <div className="cdw-power-change"><span>Card power</span><strong>{format(before)}</strong><ArrowUpRight size={17}/><b>{format(after)}</b></div>;
}
export function RankTrack({value=0,max=5,label}) {
  return <ol className="cdw-rank-track" aria-label={label}>{Array.from({length:max},(_,index)=><li key={index} data-active={value>=index+1}><span>{['I','II','III','IV','V'][index] || index+1}</span></li>)}</ol>;
}
export function Action({children,reason,busy,onClick,secondary=false}) {
  return <div className="cdw-action"><button className={secondary?'cdw-button':'cdw-button cdw-primary'} disabled={Boolean(reason)||busy} onClick={onClick}>{busy?<Sparkles size={16}/>:null}{children}</button>{reason && <p>{reason}</p>}</div>;
}
export function Review({title,children,onCancel,onConfirm,busy,label='Confirm',disabled=false}) {
  const panel = useRef(null), cancel = useRef(onCancel);
  cancel.current = onCancel;
  useEffect(() => {
    const parent = panel.current?.parentElement;
    panel.current?.focus();
    return () => queueMicrotask(() => { if (document.activeElement === document.body && parent?.isConnected) parent.querySelector('.cdw-action button:not(:disabled)')?.focus(); });
  }, []);
  return <section ref={panel} tabIndex={-1} className="cdw-review" data-card-review role="region" aria-label={title} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); if (!busy) cancel.current(); } }}>
    <span className="cdw-eyebrow">Review before continuing</span><h3>{title}</h3><div>{children}</div>
    <div className="cdw-review-actions"><button className="cdw-button" disabled={busy} onClick={onCancel}>Go back</button><button className="cdw-button cdw-primary" disabled={busy||disabled} onClick={onConfirm}>{busy?'Applying…':label}</button></div>
  </section>;
}
