import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, Coins, Lock, RefreshCw, Scale, ShoppingBag } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Action, Empty, Review, SectionTitle } from './CardDetailPrimitives';
import { format, marketBlock } from './cardDetailModel';

const MARKETS=[{id:'trading_post',label:'Trading Post',description:'A public listing. Players can buy at your asking price or open a trade negotiation.',route:'trading',icon:Scale},{id:'black_market',label:'Buy Market',description:'A fixed-price listing in the Black Market. Your seller identity is hidden from other buyers.',route:'blackmarket',icon:ShoppingBag}];
export default function CardExchangePanel({detail,item}) {
  const {state,busy,act}=detail,u=state?.userCard;
  const [market,setMarket]=useState('trading_post'),[price,setPrice]=useState(''),[review,setReview]=useState(null),[listings,setListings]=useState([]),[loading,setLoading]=useState(false),[error,setError]=useState('');
  const alive=useRef(false),version=useRef(0);
  const load=useCallback(async()=>{
    if(!u?.id)return;
    const seq=++version.current;setLoading(true);setError('');
    try {
      const responses=await Promise.all(MARKETS.map(async m=>{
        const response=await base44.functions.invoke('tradePostMarket',{action:'getState',payload:{market:m.id}});
        const data=response?.data||response;
        if(data?.error||!data?.success)throw new Error(data?.error||'Listings could not be loaded.');
        return (data.listings||[]).filter(l=>l.card_id===u.id&&l.seller_id===data.userId).map(l=>({...l,market:m.id}));
      }));
      if(alive.current&&seq===version.current)setListings(responses.flat());
    }catch(e){if(alive.current&&seq===version.current)setError(e?.response?.data?.error||e.message||'Listings could not be loaded.');}
    finally{if(alive.current&&seq===version.current)setLoading(false);}
  },[u?.id]);
  useEffect(()=>{alive.current=true;load();return()=>{alive.current=false;version.current+=1;};},[load,u?.trade_status]);
  useEffect(()=>setReview(null),[u?.trade_status]);
  const chosen=MARKETS.find(m=>m.id===market),amount=Number(price);
  const priceValid=/^\d+$/.test(price)&&Number.isSafeInteger(amount)&&amount>=1&&amount<=1000000000;
  const reason=marketBlock(u)||(!priceValid?'Enter a whole-number price from 1 to 1,000,000,000 AGP.':'');
  return <><SectionTitle eyebrow="The player economy" title="A place in the exchange.">Choose where to list your card. Review the price and reservation before publishing.</SectionTitle>
    <div className="cdw-market-options">{MARKETS.map(m=><button key={m.id} aria-pressed={market===m.id} onClick={()=>{setMarket(m.id);setReview(null);}}><m.icon size={24}/><h3>{m.label}</h3><p>{m.description}</p><span>{market===m.id?<Check size={14}/>:<ArrowUpRight size={14}/>} {market===m.id?'Selected market':'Select market'}</span></button>)}</div>
    {!u?<Empty icon={Lock} title="Collect this card before listing">You can browse available cards in either market. Only owned, unequipped and unreserved cards can be listed.</Empty>:<>
    {error&&<div className="cdw-notice" role="alert"><span>{error}</span><button className="cdw-button" onClick={load}>Retry listings</button></div>}
    {listings.length>0?<section className="cdw-panel"><div className="cdw-line-heading"><h3>Your active listing</h3><Lock size={15}/></div>{listings.map(l=><div className="cdw-active-listing" key={l.id}><div><span>{MARKETS.find(m=>m.id===l.market)?.label}</span><strong>{format(l.asking_price)} AGP</strong><small>The card is reserved while this listing is active.</small></div>{review?.cancel===l.id?<Review title="Cancel this listing?" onCancel={()=>setReview(null)} busy={busy} label="Cancel listing" onConfirm={async()=>{if(await act('cancelListing',{listingId:l.id,market:l.market},'tradePostMarket')){setReview(null);load();}}}><p>Remove the offer and return the card to your available inventory.</p></Review>:<button className="cdw-button" disabled={busy} onClick={()=>setReview({cancel:l.id})}>Review cancellation</button>}</div>)}</section>:<section className="cdw-panel">
      <div className="cdw-line-heading"><h3>Create a listing</h3><Coins size={19}/></div>
      <label className="cdw-price-label">Asking price <span>AGP</span><input aria-label="Asking price in AGP" inputMode="numeric" pattern="[0-9]*" maxLength={10} placeholder="Enter your price" value={price} disabled={Boolean(marketBlock(u))||busy} onChange={e=>{setPrice(e.target.value);setReview(null);}}/></label>
      <dl className="cdw-listing-summary"><div><dt>Card</dt><dd>{item.title}</dd></div><div><dt>Listing type</dt><dd>Fixed price · {chosen.label}</dd></div><div><dt>Seller visibility</dt><dd>{market==='black_market'?'Anonymous':'Your player profile'}</dd></div><div><dt>Inventory entry</dt><dd>{u.quantity??1} {(u.quantity??1)>1?'stacked copies':'copy'}</dd></div></dl>
      <p>The entire inventory entry is reserved and transferred with the sale, including stacked copies. Upgrades are unavailable while listed. You can cancel an unsold listing.</p>
      {review?.publish?<Review title="Publish this card listing?" busy={busy} disabled={Boolean(reason)||loading||Boolean(error)} onCancel={()=>setReview(null)} label="Publish listing" onConfirm={async()=>{if(await act('listCard',{price:amount,market},'tradePostMarket')){setReview(null);load();}}}><p><b>{item.title}</b> · {u.quantity??1} {(u.quantity??1)>1?'copies':'copy'}</p><p>{chosen.label} · <b>{format(amount)} AGP total</b></p><p>Publishing reserves this inventory entry immediately.</p></Review>:<Action busy={busy} reason={reason||(loading?'Checking your active listings…':error?'Reload listings before publishing.':'')} onClick={()=>setReview({publish:true})}>Review listing</Action>}
    </section>}
    {loading&&<p className="cdw-footnote" role="status">Checking your active listings…</p>}
    </>}
    <div className="cdw-exchange-links">{MARKETS.map(m=><a className="cdw-button" key={m.id} href={'/Store?mode='+m.route}>Browse {m.label}<ArrowUpRight size={14}/></a>)}{u&&<button className="cdw-icon-button" aria-label="Refresh listings" disabled={loading||busy} onClick={load}><RefreshCw size={15}/></button>}</div>
  </>;
}
