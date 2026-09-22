import {useId,useState} from 'react';
import {SlidersHorizontal} from 'lucide-react';
import {label} from './discovery';
export default function StoreFilterRail({filters,genres,counts,update,onReset}){
 const id=useId(),[genreQuery,setGenreQuery]=useState('');
 const toggle=genre=>update('genres',filters.genres.includes(genre)?filters.genres.filter(g=>g!==genre):[...filters.genres,genre]);
 const radios=(key,items)=><div className="sf-filter-options">{items.map(([value,title])=><label key={value}><input type="radio" name={id+key} checked={filters[key]===value} onChange={()=>update(key,value)}/><span>{title}</span></label>)}</div>;
 return <div className="sf-filter-content">
  <div className="sf-filter-heading"><h2><SlidersHorizontal size={15}/>Filters</h2><button onClick={onReset}>Reset</button></div>
  <fieldset><legend>Genre</legend><input className="sf-genre-search" aria-label="Find a genre" placeholder="Find a genre…" value={genreQuery} onChange={e=>setGenreQuery(e.target.value)}/><div className="sf-genre-options">{genres.filter(g=>label(g).toLowerCase().includes(genreQuery.toLowerCase())).map(g=><label key={g}><input type="checkbox" checked={filters.genres.includes(g)} onChange={()=>toggle(g)}/><span>{label(g)}</span><small>{counts[g]}</small></label>)}</div></fieldset>
  <fieldset><legend>Price</legend>{radios('price',[['any','Any price'],['free','Free to play'],['10','Under $10'],['25','Under $25'],['50','Under $50']])}<label className="sf-filter-check"><input type="checkbox" checked={filters.onSale} onChange={e=>update('onSale',e.target.checked)}/>On sale</label></fieldset>
  <fieldset><legend>Play your way</legend>{radios('mode',[['','Any play style'],['single player','Single player'],['co op','Co-op'],['multiplayer','Multiplayer']])}</fieldset>
  <fieldset><legend>Availability</legend>{radios('availability',[['all','All games'],['available','Available now'],['soon','Coming soon']])}<label className="sf-filter-check"><input type="checkbox" checked={filters.hideOwned} onChange={e=>update('hideOwned',e.target.checked)}/>Hide games I own</label></fieldset>
 </div>;
}
