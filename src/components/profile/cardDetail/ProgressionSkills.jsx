import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function ProgressionSkills({ state, act, disabled }) {
  const p=state.progression;
  const unlocked=p.unlocked_skill_nodes;
  const active=p.active_perks;
  const perks=state.skillTree.filter(n=>n.perk && unlocked.includes(n.id));
  const drop = result => {
    if (!result.destination || disabled || result.source.droppableId===result.destination.droppableId) return;
    act('togglePerk',{nodeId:result.draggableId});
  };
  return <div className="space-y-5" data-testid="progression-skills">
    <header className="cr-panel"><p className="cr-label">The Skill Tree</p><h2 className="text-2xl mt-2">{p.skill_points} Skill Points available</h2><p className="text-sm text-muted-foreground mt-3">Unlock prerequisite nodes, then assign perks to your {p.perk_slots} slots. Drag perks between loadouts or use their buttons.</p><p className="text-xs text-muted-foreground mt-3">Card power and forge bonuses apply here; game-side active abilities and teacher effects are not connected yet.</p></header>
    <div className="grid xl:grid-cols-3 gap-5">{['Core','Forge','Avatar'].map(lane=><section key={lane} className="cr-panel"><h3 className="text-primary text-sm mb-5">{lane} branch</h3><div className="space-y-6">{state.skillTree.filter(n=>n.lane===lane).map(node=>{
      const owned=unlocked.includes(node.id);
      const allowed=p.level>=node.minLevel && p.stage>=node.minStage && p.skill_points>=node.cost && (!node.prerequisite || unlocked.includes(node.prerequisite));
      return <article className="cr-node" key={node.id} data-unlocked={owned} data-active={active.includes(node.id)}><p className="text-sm font-medium">{node.name}</p><p className="text-xs text-muted-foreground mt-2">{node.effect}</p><p className="text-xs text-muted-foreground mt-3">Level {node.minLevel} · Stage {node.minStage} · {node.cost} SP</p>{node.prerequisite && <p className="text-xs text-muted-foreground mt-2">Requires {state.skillTree.find(n=>n.id===node.prerequisite)?.name}</p>}<button className="cr-action mt-4" aria-label={`Unlock ${node.name}`} disabled={disabled || owned || !allowed} onClick={()=>act('unlockSkill',{nodeId:node.id})}>{owned?'Unlocked':'Unlock'}</button></article>;
    })}</div></section>)}</div>
    <DragDropContext onDragEnd={drop}><div className="grid md:grid-cols-2 gap-5">{['available','equipped'].map(zone=><Droppable key={zone} droppableId={zone}>{provided=><section className="cr-panel" ref={provided.innerRef} {...provided.droppableProps}><h3 className="text-sm mb-4">{zone==='available'?'Unlocked perks':`Active slots · ${active.length} / ${p.perk_slots}`}</h3>{perks.filter(n=>zone==='equipped'?active.includes(n.id):!active.includes(n.id)).map((node,index)=><Draggable draggableId={node.id} key={node.id} index={index} isDragDisabled={disabled}>{drag=><div ref={drag.innerRef} {...drag.draggableProps} {...drag.dragHandleProps} className="mb-3 rounded-lg border border-primary/30 p-3"><p className="text-sm">{node.name}</p><button className="cr-action mt-3" disabled={disabled || (zone==='available'&&active.length>=p.perk_slots)} onClick={()=>act('togglePerk',{nodeId:node.id})}>{zone==='available'?`Assign ${node.name}`:`Remove ${node.name}`}</button></div>}</Draggable>)}{provided.placeholder}<p className="text-xs text-muted-foreground">{zone==='available'?'Unlocked perk nodes appear here.':'Drop a perk here to assign it.'}</p></section>}</Droppable>)}</div></DragDropContext>
  </div>;
}