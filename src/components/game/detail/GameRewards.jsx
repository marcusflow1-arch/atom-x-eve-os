import {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Trophy,Zap,Shield,Users,Check,ArrowRight,ChevronDown} from 'lucide-react';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/components/auth/AuthContext';
import {label} from '@/components/store/redesign/discovery';

const icons={ability:Zap,equipment:Shield,companion:Users};
export default function GameRewards({game}){
 const {user}=useAuth(),[expanded,setExpanded]=useState(false),[category,setCategory]=useState('all');
 const {data:rewards=[],isLoading,error,refetch}=useQuery({queryKey:['game-achievement-rewards',game.title],queryFn:async()=>{
  const all=[];let offset=0;
  while(true){const response=await base44.entities.Achievement.filter({game:game.title},'title',100,offset);const page=response?.data||response;if(!Array.isArray(page))throw new Error('Rewards unavailable');all.push(...page);if(page.length<100)break;offset+=page.length;}return all;
 },staleTime:60000});
 const categories=['all',...new Set(rewards.map(reward=>reward.category).filter(Boolean))];
 const filtered=rewards.filter(reward=>category==='all'||reward.category===category);
 return <section id="game-avatar-rewards" className="gd-rewards" aria-label="Achievements and avatar rewards">
  <div className="gd-section-heading"><div><span className="gd-eyebrow">The Atom XE difference</span><h2>Every achievement can be part of your story.</h2><p>Discover what this game can unlock for your AI avatar.</p></div><Trophy size={27}/></div>
  {isLoading?<p className="gd-muted" role="status">Loading achievements and rewards…</p>:error?<div role="alert"><p>Achievement rewards couldn't load.</p><button className="gd-text-button" onClick={()=>refetch()}>Try again</button></div>:!rewards.length?<p className="gd-muted">Rewards for this game haven't been published yet. Abilities, equipment, and achievement details will appear here when available.</p>:<>
   <div className="gd-reward-filters" aria-label="Reward categories">{categories.map(value=><button key={value} aria-pressed={category===value} onClick={()=>{setCategory(value);setExpanded(false);}}>{value==='all'?'All achievements':label(value)}<span>{value==='all'?rewards.length:rewards.filter(r=>r.category===value).length}</span></button>)}</div>
   <div className="gd-reward-grid">{filtered.slice(0,expanded?filtered.length:4).map(achievement=>{
    const Icon=icons[achievement.category]||Trophy,unlocked=(user?.unlocked_achievements||[]).includes(achievement.id);
    return <details key={achievement.id} className="gd-reward-card"><summary><span className="gd-reward-icon"><Icon size={20}/></span><span><small>{label(achievement.category)}{achievement.rarity?' · '+achievement.rarity:''}</small><strong>{achievement.reward?.name||achievement.title}</strong><em>{unlocked?<><Check size={12}/>Unlocked</>:achievement.reward?.name?'Earn through '+achievement.title:achievement.title}</em></span><ChevronDown className="gd-reward-chevron" size={14}/></summary><div><p>{achievement.description}</p>{achievement.unlock_condition&&<p><strong>Unlock:</strong> {achievement.unlock_condition}</p>}{achievement.reward?.description&&<p>{achievement.reward.description}</p>}{achievement.points>0&&<p>{achievement.points.toLocaleString()} XP</p>}</div></details>;
   })}</div>{filtered.length>4&&<button className="gd-text-button gd-reward-more" onClick={()=>setExpanded(value=>!value)}>{expanded?'Show fewer rewards':'Explore all '+filtered.length+' rewards'}<ArrowRight size={14}/></button>}
  </>}
 </section>;
}
