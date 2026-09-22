import {useMemo,useRef,useState} from 'react';
import {Search,X} from 'lucide-react';
import {suggestions,label} from '@/components/store/redesign/discovery';
export default function GameStoreSearch({games=[],value='',onChange,onSelect,onOpen,onSubmit}){
 const [open,setOpen]=useState(false),[active,setActive]=useState(-1);
 const items=useMemo(()=>value.trim()?suggestions(games,value):games.slice(0,6).map(game=>({kind:'game',id:game.id,title:game.title,game})),[games,value]);
 const root=useRef(null);
 const choose=item=>{setActive(-1);if(item.kind==='game'){setOpen(false);onSelect(item.id);}else {onChange(item.title);setOpen(true);}};
 return <div ref={root} className="relative min-w-0 w-full" onBlur={e=>{if(!root.current?.contains(e.relatedTarget))setOpen(false);}}>
  <div className="flex items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-2.5 ring-1 ring-white/10 focus-within:ring-cyan-300/60">
   <Search size={16} className="shrink-0 text-white/40"/>
   <input role="combobox" aria-label="Search the store" aria-expanded={open&&items.length>0} aria-controls="game-store-search-suggestions" aria-autocomplete="list"
    aria-activedescendant={open&&active>=0?'game-store-suggestion-'+active:undefined} value={value}
    onFocus={()=>{setOpen(true);onOpen?.();}} onClick={()=>onOpen?.()} onChange={e=>{onChange(e.target.value);setOpen(true);setActive(-1);onOpen?.();}}
    onKeyDown={e=>{
     if(e.key==='Escape'){setOpen(false);setActive(-1);}
     if(e.key==='ArrowDown'){e.preventDefault();setOpen(true);setActive(i=>Math.min(i+1,items.length-1));}
     if(e.key==='ArrowUp'){e.preventDefault();setActive(i=>Math.max(i-1,0));}
     if(e.key==='Enter'){e.preventDefault();if(open&&active>=0&&items[active])choose(items[active]);else {const first=items.find(item=>item.kind==='game');if(first)choose(first);else onSubmit?.(value);}}
    }} placeholder="Search games, genres, or a play style" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"/>
   {value&&<button aria-label="Clear search" onClick={()=>{onChange('');setOpen(false);}}><X size={14}/></button>}
  </div>
  {open&&items.length>0&&<ul id="game-store-search-suggestions" role="listbox" className="absolute inset-x-0 top-full z-[150] mt-2 overflow-hidden rounded-xl bg-slate-950 p-1 shadow-2xl ring-1 ring-white/15">
   {items.map((item,i)=><li key={item.kind+item.id} id={'game-store-suggestion-'+i} role="option" aria-selected={active===i}>
    <button type="button" tabIndex={-1} onMouseDown={e=>e.preventDefault()} onClick={()=>choose(item)} onMouseEnter={()=>setActive(i)}
      className={'flex w-full items-center gap-3 rounded-lg p-2 text-left text-sm '+(active===i?'bg-cyan-300/10':'hover:bg-white/5')}>
     {item.game?.cover_image&&<img src={item.game.cover_image} alt="" className="h-9 w-14 rounded object-cover"/>}
     <span className="min-w-0 flex-1 truncate">{item.title}</span><span className="text-xs text-white/35">{item.kind==='genre'?'Genre':label(item.game.genre)}</span>
    </button>
   </li>)}
  </ul>}
 </div>;
}
