import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Crown, Search, Shield, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { CLAN_FOCUS, CREST_SHAPES, CREST_SYMBOLS, CREST_PATTERNS, crestDataUri, normalizeCrest } from '../../../base44/shared/clanCrest';
import './clan-intro.css';

const initial = () => ({
  name: '', tag: '', motto: '', description: '', playstyles: [], genres: [], gameTags: [], activities: [],
  recruitmentStatus: 'Public', sizeLimit: '100', enableStronghold: true, customRoles: [], searchTags: [],
  emblemDesign: normalizeCrest(),
});
const dataOf = response => { const data = response?.data || response; if (!data?.success) throw new Error(data?.error || 'The clan action could not be completed.'); return data; };
const genres = ['RPG', 'Shooter', 'Strategy', 'MMO', 'Adventure', 'Fighting', 'Horror', 'Racing', 'Simulation'];

function Choices({ label, values, selected, onToggle }) {
  return <fieldset className="clan-intro-choices"><legend>{label}</legend><div>{values.map(value => <button key={value} type="button" aria-pressed={selected.includes(value)} onClick={() => onToggle(value)}>{selected.includes(value) && <Check size={12} />}{value}</button>)}</div></fieldset>;
}
export default function ClanIntro({ onClanCreated, onClanJoined }) {
  const { user } = useAuth();
  const client = useQueryClient();
  const [mode, setMode] = useState('create');
  const [draft, setDraft] = useState(initial);
  const [query, setQuery] = useState('');
  const [focus, setFocus] = useState('All');
  const [notice, setNotice] = useState('');
  const [applied, setApplied] = useState([]);
  const clanQuery = useQuery({ queryKey: ['allClans'], enabled: Boolean(user?.id), queryFn: async () => (await base44.entities.Division.list('name', 500)).filter(clan => !clan.is_development) });
  const memberQuery = useQuery({ queryKey: ['myClanMemberships', user?.id], enabled: Boolean(user?.id), queryFn: () => base44.entities.ClanMember.filter({ user_id: user.id }) });
  const gameQuery = useQuery({ queryKey: ['allGamesClanIntro'], enabled: Boolean(user?.id) && mode === 'create', queryFn: () => base44.entities.Game.list('title', 1000), staleTime: 60000 });
  const enter = (data, created = false) => {
    client.invalidateQueries({ queryKey: ['myClanMemberships'] }); client.invalidateQueries({ queryKey: ['allClans'] });
    (created ? onClanCreated : onClanJoined)?.(data.clanId);
  };
  const create = useMutation({
    mutationFn: async () => dataOf(await base44.functions.invoke('clanSystem', { action: 'create_clan', data: { ...draft, name: draft.name.trim(), tag: draft.tag.trim().toUpperCase(), icon: crestDataUri(draft.emblemDesign), primaryColor: draft.emblemDesign.primary, secondaryColor: draft.emblemDesign.accent } })),
    onSuccess: data => enter(data, true),
  });
  const join = useMutation({
    mutationFn: async clan => ({ ...dataOf(await base44.functions.invoke('clanSystem', { action: clan.isPrivate || clan.recruitmentStatus === 'Request to Join' ? 'request_join' : 'join_clan', data: { divisionId: clan.id } })), requested: clan.isPrivate || clan.recruitmentStatus === 'Request to Join', clanId: clan.id }),
    onSuccess: data => { if (data.requested) { setApplied(ids => [...ids, data.clanId]); setNotice('Application sent. The clan leader will review your request.'); } else enter(data); },
  });
  const change = (key, value) => setDraft(old => ({ ...old, [key]: value }));
  const crest = (key, value) => setDraft(old => ({ ...old, emblemDesign: { ...old.emblemDesign, [key]: value } }));
  const toggle = (key, value) => setDraft(old => ({ ...old, [key]: old[key].includes(value) ? old[key].filter(item => item !== value) : [...old[key], value] }));
  const clans = useMemo(() => (clanQuery.data || []).filter(clan => {
    const matches = [clan.name, clan.tag, clan.description, ...(clan.gameTags || [])].join(' ').toLowerCase().includes(query.toLowerCase().trim());
    return matches && (focus === 'All' || (clan.playstyles || clan.focusTags || []).includes(focus));
  }), [clanQuery.data, query, focus]);
  const error = create.error || join.error;
  return <main className="clan-intro">
    <div className="clan-intro-inner">
      <header className="clan-intro-heading"><Link to="/LunaTemplate"><ArrowLeft size={15} />Luna Dashboard</Link><span><Shield size={14} /> Clan strongholds</span></header>
      <div className="clan-intro-lead"><span>Build a place to belong</span><h1>Your people. Your banner.</h1><p>Bring your squad together, or find a community that plays your way.</p></div>
      <div className="clan-intro-paths" role="group" aria-label="Choose your clan path">
        <button type="button" aria-pressed={mode === 'create'} onClick={() => setMode('create')}><Crown size={26} /><span><small>Start your stronghold</small><strong>Create New Clan</strong><p>Design a crest and set your focus.</p></span><ArrowRight size={18} /></button>
        <button type="button" aria-pressed={mode === 'find'} onClick={() => setMode('find')}><Users size={26} /><span><small>Find your people</small><strong>Find Existing Clan</strong><p>Explore communities and join the right one.</p></span><ArrowRight size={18} /></button>
      </div>
      {!user && <p role="status" className="clan-intro-notice">Sign in to create a clan or apply to one.</p>}
      {(memberQuery.data || []).length > 0 && <div className="clan-intro-notice">{memberQuery.data.map(member => <button key={member.id} onClick={() => onClanJoined?.(member.clan_id)}>Return to {(clanQuery.data || []).find(clan => clan.id === member.clan_id)?.name || 'your clan'} <ArrowRight size={13} /></button>)}</div>}
      {error && <p className="clan-intro-notice" role="alert">{error?.response?.data?.error || error.message}</p>}
      {notice && <p className="clan-intro-notice" role="status">{notice}</p>}
      {mode === 'create' ? <form className="clan-intro-create" onSubmit={event => { event.preventDefault(); create.mutate(); }}>
        <section className="clan-intro-form">
          <div className="clan-intro-section-title"><span>01</span><div><h2>Give your clan an identity</h2><p>Your name and crest appear across your stronghold, roster and events.</p></div></div>
          <div className="clan-intro-fields"><label>Clan name<input required minLength={2} maxLength={40} value={draft.name} onChange={event => change('name', event.target.value)} placeholder="Your clan name" /></label><label>Clan tag<input required minLength={2} maxLength={6} pattern="[A-Za-z0-9]{2,6}" value={draft.tag} onChange={event => change('tag', event.target.value.toUpperCase())} placeholder="AXE" /></label></div>
          <label>Motto<input maxLength={100} value={draft.motto} onChange={event => change('motto', event.target.value)} placeholder="A few words your squad lives by" /></label>
          <label>About your clan<textarea rows={3} maxLength={1200} value={draft.description} onChange={event => change('description', event.target.value)} placeholder="Tell players what to expect when they join." /></label>
          <Choices label="Choose your focus" values={CLAN_FOCUS} selected={draft.playstyles} onToggle={value => toggle('playstyles', value)} />
          <div className="clan-intro-fields"><label>Recruitment<select value={draft.recruitmentStatus} onChange={event => change('recruitmentStatus', event.target.value)}>{['Public','Request to Join','Invite Only'].map(value => <option key={value}>{value}</option>)}</select></label><label>Member limit<select value={draft.sizeLimit} onChange={event => change('sizeLimit', event.target.value)}>{[10,25,50,100,250].map(value => <option key={value}>{value}</option>)}</select></label></div>
          <details><summary>Games & community options</summary><Choices label="Preferred genres" values={genres} selected={draft.genres} onToggle={value => toggle('genres', value)} /><label>Games<select multiple aria-label="Clan games" value={draft.gameTags} onChange={event => change('gameTags', Array.from(event.target.selectedOptions, option => option.value))}>{(gameQuery.data || []).map(game => <option key={game.id} value={game.title}>{game.title}</option>)}</select></label><p className="clan-intro-help">Use Ctrl or Command to select more than one game.</p><label>Custom roles<input value={draft.customRoles.join(', ')} onChange={event => change('customRoles', event.target.value.split(',').map(value => value.trim()))} placeholder="Raid leader, Scout, Recruiter" /></label><label className="clan-intro-check"><input type="checkbox" checked={draft.enableStronghold} onChange={event => change('enableStronghold', event.target.checked)} />Enable the 3D stronghold</label></details>
          <button className="clan-intro-submit" type="submit" disabled={!user || create.isPending}>{create.isPending ? 'Creating your clan…' : 'Create clan'}<ArrowRight size={16} /></button>
        </section>
        <aside className="clan-intro-crest"><div className="clan-intro-section-title"><span>02</span><div><h2>Make your mark</h2><p>Your crest updates as you customize.</p></div></div>
          <div className="clan-intro-banner"><img src={crestDataUri(draft.emblemDesign)} alt="Live clan crest preview" /><strong>{draft.name || 'Your clan name'}</strong><small>{draft.tag ? '[' + draft.tag + ']' : '[TAG]'}</small><p>{draft.motto || 'Your banner. Your story.'}</p></div>
          <div className="clan-intro-fields">{[['shape','Shape',CREST_SHAPES],['symbol','Emblem',CREST_SYMBOLS],['pattern','Cloth pattern',CREST_PATTERNS]].map(([key,label,values]) => <label key={key}>{label}<select value={draft.emblemDesign[key]} onChange={event => crest(key,event.target.value)}>{values.map(value => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></label>)}</div>
          <div className="clan-intro-fields"><label>Cloth color<input type="color" value={draft.emblemDesign.primary} onChange={event => crest('primary',event.target.value)} /></label><label>Emblem color<input type="color" value={draft.emblemDesign.accent} onChange={event => crest('accent',event.target.value)} /></label></div>
        </aside>
      </form> : <section className="clan-intro-find">
        <div className="clan-intro-find-controls"><label><Search size={17} /><input aria-label="Search clans" placeholder="Search clans, games or tags" value={query} onChange={event => setQuery(event.target.value)} /></label><select aria-label="Filter clans by focus" value={focus} onChange={event => setFocus(event.target.value)}>{['All',...CLAN_FOCUS].map(value => <option key={value}>{value}</option>)}</select></div>
        {clanQuery.isLoading ? <p role="status">Finding communities…</p> : clanQuery.isError ? <p role="alert">Clans could not load. <button onClick={() => clanQuery.refetch()}>Try again</button></p> : clans.length ? <div className="clan-intro-results">{clans.map(clan => {
          const member = (memberQuery.data || []).some(row => row.clan_id === clan.id);
          const inviteOnly = clan.recruitmentStatus === 'Invite Only';
          const full = Number(clan.memberCount || 0) >= Number(clan.sizeLimit || 100);
          return <article key={clan.id}><img src={clan.icon || crestDataUri(clan.emblemDesign || {})} alt="" /><div><h3>{clan.name} <small>{clan.tag ? '[' + clan.tag + ']' : ''}</small></h3><p>{clan.motto || clan.description || 'A new community is taking shape.'}</p><div className="clan-intro-tags">{(clan.playstyles || clan.focusTags || []).map(value => <span key={value}>{value}</span>)}</div><small>{clan.memberCount || 1} / {clan.sizeLimit || 100} members · {clan.recruitmentStatus || 'Public'}</small></div><button type="button" disabled={!user || join.isPending || (!member && (inviteOnly || full || applied.includes(clan.id)))} onClick={() => member ? onClanJoined?.(clan.id) : join.mutate(clan)}>{member ? 'Enter clan' : applied.includes(clan.id) ? 'Application sent' : inviteOnly ? 'Invite only' : full ? 'Full' : clan.isPrivate || clan.recruitmentStatus === 'Request to Join' ? 'Apply to join' : 'Join clan'}</button></article>;
        })}</div> : <div className="clan-intro-empty"><Shield size={30} /><h3>No matching clans</h3><p>Try another focus or name, or start your own.</p><button onClick={() => { setQuery(''); setFocus('All'); }}>Clear filters</button></div>}
      </section>}
    </div>
  </main>;
}
