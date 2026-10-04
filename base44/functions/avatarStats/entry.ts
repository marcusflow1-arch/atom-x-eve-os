import { createClientFromRequest } from 'npm:@base44/sdk@0.8.51';
import { ATTRIBUTE_KEYS, allocationState, COMBAT_RULES } from '../../shared/combatStats.ts';
import { loadCombatProfile } from '../../shared/combatProfile.ts';
import { ensureAvatarProgression, commitStatChange } from '../../shared/avatarProgressionState.ts';
import { hasLivePvpMatch } from '../../shared/matchLock.ts';
const json = (body:any,status=200)=>Response.json(body,{status});
const branches = new Set(['combat_reasoning','tactical_planning','social_intelligence','exploration','memory_recall','creative_synthesis']);
function knowledgeReward(level:number) { return level===1 ? 1 : level%50===0 ? 4 : level%25===0 ? 3 : level%10===0 ? 2 : level%5===0 ? 1 : 0; }
Deno.serve(async(req)=>{
  try {
    const client=createClientFromRequest(req), user=await client.auth.me();
    if(!user) return json({error:'Unauthorized'},401);
    const {action='getState',data={}}=await req.json().catch(()=>({}));
    if(!['getState','allocate','allocateBatch','allocateKnowledge','claimKnowledge'].includes(action)) return json({error:'Unknown stat action'},400);
    const svc=client.asServiceRole.entities;
    let record=await ensureAvatarProgression(svc,user.id);
    if(action!=='getState'){
      const requestId=String(data.request_id || '');
      if(!/^[a-zA-Z0-9:_-]{8,100}$/.test(requestId)) return json({error:'A valid request ID is required'},400);
      const signature=JSON.stringify([action,data.stat || '',data.points ?? 1,data.branch || '',data.level ?? null,data.allocations || null]);
      const previous=(record.stat_requests || []).find((r:any)=>r.id===requestId);
      if(previous && previous.signature!==signature) return json({error:'Request ID was already used for a different change'},409);
      if(!previous){
        if(data.expected_revision!==Number(record.stat_revision || 0)) return json({error:'Your avatar changed. Refresh and try again.'},409);
        if((action==='allocate' || action==='allocateBatch') && await hasLivePvpMatch(svc,user.id)) return json({error:'Finish your match before allocating combat stats'},409);
        const patch:any={};
        if(action==='allocate'){
          if(!(ATTRIBUTE_KEYS as readonly string[]).includes(data.stat)) return json({error:'Unknown combat attribute'},400);
          const count=data.points ?? 1, points=allocationState(record);
          if(!Number.isSafeInteger(count)||count<1||count>points.available) return json({error:'Not enough available stat points'},400);
          patch.stat_allocations={...points.allocations,[data.stat]:points.allocations[data.stat]+count};
        }else if(action==='allocateBatch'){
          const requested=data.allocations;
          if(!requested || typeof requested!=='object' || Array.isArray(requested)) return json({error:'Stat allocations are required'},400);
          const points=allocationState(record), next={...points.allocations};
          let total=0;
          for(const [key,raw] of Object.entries(requested)){
            if(!(ATTRIBUTE_KEYS as readonly string[]).includes(key)) return json({error:`Unknown combat attribute: ${key}`},400);
            const count=Number(raw || 0);
            if(!Number.isSafeInteger(count)||count<0||count>200) return json({error:'Invalid stat allocation amount'},400);
            if(count>0){ total+=count; next[key]=Number(next[key] || 0)+count; }
          }
          if(total<1) return json({error:'Choose at least one stat point before confirming'},400);
          if(total>points.available) return json({error:'Not enough available stat points'},400);
          patch.stat_allocations=next;
        }else if(action==='allocateKnowledge'){
          const branch=String(data.branch || ''),rank=Number(record.skill_allocations?.[branch] || 0);
          if(!branches.has(branch)||rank>=5||Number(record.available_skill_points || 0)<1) return json({error:'This knowledge node cannot be unlocked'},400);
          patch.skill_allocations={...(record.skill_allocations || {}),[branch]:rank+1};
          patch.available_skill_points=Number(record.available_skill_points || 0)-1;
        }else{
          const level=data.level,claimed=record.claimed_knowledge_rewards || [];
          if(!Number.isSafeInteger(level)||level<1||level>Math.min(300,Number(record.knowledge_level || 1))||!knowledgeReward(level)||claimed.includes(level)) return json({error:'Knowledge reward is not claimable'},400);
          patch.claimed_knowledge_rewards=[...claimed,level].sort((a,b)=>a-b);
          patch.available_skill_points=Number(record.available_skill_points || 0)+knowledgeReward(level);
        }
        record=await commitStatChange(svc,user.id,record,patch,{id:requestId,signature});
      }
    }
    const state=await loadCombatProfile(svc,user.id,record);
    return json({success:true,...state,rules:COMBAT_RULES,allocation_locked:await hasLivePvpMatch(svc,user.id)});
  }catch(error:any){console.error('avatarStats',error);return json({error:error?.message || 'Unable to load avatar stats'},Number(error?.status || 500));}
});
