import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Film, Maximize2, MessageSquare, Minimize2, Trash2, Upload, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ClipCard from '../gallery/ClipCard';
import MomentsTimeline from '../gallery/MomentsTimeline';
import CommunityClipsRail from '../gallery/CommunityClipsRail';
import GalleryPlayer from '../gallery/GalleryPlayer';
import GallerySocialPanel from '../gallery/GallerySocialPanel';
import { useGalleryRequests } from '../gallery/useGallerySocial';
import { chooseInitialClip, normalizeGallery } from '../gallery/galleryModel';
import '../gallery/galleryConsole.css';

export default function GallerySection({ isEditMode, galleryImages = [], onUpdateImages, onClose, user, channelId, anchorRef }) {
  const rootRef = useRef(null);
  const closeRef = useRef(null);
  const socialToggleRef = useRef(null);
  const socialRef = useRef(null);
  const ribbonRef = useRef(null);
  const inputRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const [fullscreen, setFullscreen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collection, setCollection] = useState('moments');
  const [day, setDay] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const clips = useMemo(() => normalizeGallery(galleryImages), [galleryImages]);
  const [selectedId, setSelectedId] = useState(() => chooseInitialClip(clips)?.id);
  const selected = clips.find((clip) => clip.id === selectedId) || chooseInitialClip(clips);
  const collectionClips = useMemo(() => clips.filter((clip) => clip.collection === collection), [clips, collection]);
  const filtered = useMemo(() => collectionClips.filter((clip) => day === 'all' || clip.date === day), [collectionClips, day]);
  const requests = useGalleryRequests(channelId);
  const visibleRequests = (requests.data || []).filter((request) => clips.some((clip) => clip.id === request.clip_id && (day === 'all' || clip.date === day)));

  const selectClip = (clip) => setSelectedId(clip.id);
  const selectCollection = (next) => {
    setCollection(next);
    setDay('all');
    const candidates = clips.filter((clip) => clip.collection === next);
    if (!candidates.some((clip) => clip.id === selected?.id)) setSelectedId(chooseInitialClip(candidates)?.id);
  };
  const selectDay = (next) => {
    setDay(next);
    const candidates = collectionClips.filter((clip) => next === 'all' || clip.date === next);
    if (!candidates.some((clip) => clip.id === selected?.id)) setSelectedId(candidates[0]?.id);
  };

  // Align the lower panel with the channel bar when there is room below it.
  useEffect(() => {
    const updateAnchor = () => {
      const bar = anchorRef?.current?.getBoundingClientRect();
      const bottom = bar ? Math.max(12, window.innerHeight - bar.bottom - window.innerHeight * 0.35) : 12;
      rootRef.current?.style.setProperty('--gallery-bottom', `${bottom}px`);
    };
    updateAnchor();
    window.addEventListener('resize', updateAnchor);
    window.addEventListener('scroll', updateAnchor, true);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateAnchor) : null;
    if (anchorRef?.current) observer?.observe(anchorRef.current);
    return () => { window.removeEventListener('resize', updateAnchor); window.removeEventListener('scroll', updateAnchor, true); observer?.disconnect(); };
  }, [anchorRef]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const root = rootRef.current;
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      if (root?.contains(document.activeElement) || document.activeElement === document.body) previousFocus?.focus?.({ preventScroll: true });
      if (document.fullscreenElement === root) document.exitFullscreen?.().catch(() => {});
    };
  }, []);

  const leaveFullscreen = () => {
    setFullscreen(false);
    if (document.fullscreenElement === rootRef.current) document.exitFullscreen?.().catch(() => {});
  };
  const toggleFullscreen = () => {
    if (fullscreen) { leaveFullscreen(); return; }
    setFullscreen(true);
    // Embedded Base44 previews may deny the browser API; viewport theater still works.
    if (document.fullscreenEnabled && !document.fullscreenElement) rootRef.current?.requestFullscreen?.().catch(() => {});
  };

  useEffect(() => {
    const sync = () => { if (!document.fullscreenElement) setFullscreen(false); };
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    const root = rootRef.current;
    const siblings = [...document.body.children].filter((node) => node !== root && !node.contains(root));
    const previousInert = siblings.map((node) => node.inert);
    const previousOverflow = document.body.style.overflow;
    siblings.forEach((node) => { node.inert = true; });
    document.body.style.overflow = 'hidden';
    return () => { siblings.forEach((node, index) => { node.inert = previousInert[index]; }); document.body.style.overflow = previousOverflow; };
  }, [fullscreen]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        if (fullscreen) leaveFullscreen();
        else if (drawerOpen && window.matchMedia('(max-width: 760px)').matches) setDrawerOpen(false);
        else onClose?.();
      }
      if (event.key === 'Tab' && fullscreen) {
        const focusable = [...rootRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled), [tabindex="0"]')].filter((node) => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden' && !node.closest('[inert]'));
        const first = focusable[0];
        const last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });

  // Hidden drawers cannot retain keyboard focus or expose off-screen form controls.
  useEffect(() => {
    const updateDrawer = () => {
      const hidden = !drawerOpen && (fullscreen || window.matchMedia('(max-width: 760px)').matches);
      if (hidden && socialRef.current?.contains(document.activeElement)) socialToggleRef.current?.focus();
      if (socialRef.current) socialRef.current.inert = hidden;
    };
    updateDrawer();
    window.addEventListener('resize', updateDrawer);
    return () => window.removeEventListener('resize', updateDrawer);
  }, [drawerOpen, fullscreen]);

  useEffect(() => {
    const card = [...(ribbonRef.current?.querySelectorAll('[data-clip-id]') || [])].find((node) => node.dataset.clipId === selected?.id);
    card?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest', inline: 'nearest' });
  }, [selected?.id, collection, day, reducedMotion]);

  const handleRibbonKey = (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const buttons = [...ribbonRef.current.querySelectorAll('button')];
    const index = buttons.indexOf(document.activeElement);
    if (index < 0) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : Math.max(0, Math.min(buttons.length - 1, index + (event.key === 'ArrowRight' ? 1 : -1)));
    buttons[next]?.focus();
    buttons[next]?.click();
  };

  const upload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length || !isEditMode || uploading) return;
    setUploading(true);
    setUploadError('');
    const additions = [];
    const failures = [];
    for (const file of files) {
      if (!/^(image|video)\//.test(file.type)) { failures.push(file.name); continue; }
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        if (!file_url) throw new Error('Upload returned no URL');
        additions.push({ id: crypto.randomUUID(), url: file_url, type: file.type.startsWith('video/') ? 'video' : 'image', title: file.name.replace(/\.[^.]+$/, ''), game: 'Stream Highlight', category: 'SAVED', date: new Date().toISOString().slice(0, 10), time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) });
      } catch { failures.push(file.name); }
    }
    if (additions.length) { onUpdateImages?.([...galleryImages, ...additions]); setCollection('moments'); setDay('all'); setSelectedId(additions[0].id); }
    if (failures.length) setUploadError(`Could not upload: ${failures.join(', ')}. Try again.`);
    setUploading(false);
  };

  return <motion.section ref={rootRef} id="stream-gallery-console" role="dialog" aria-modal={fullscreen || undefined} aria-label="Gallery media center" className={`gallery-console ${fullscreen ? 'is-fullscreen' : ''} ${drawerOpen ? 'social-open' : ''}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.24 }}>
    <motion.div className="gallery-top-fade bg-gradient-to-b from-slate-950/95 via-slate-950/70 to-transparent backdrop-blur-md" initial={{ y: -40 }} animate={{ y: 0 }} exit={{ y: -40 }} aria-hidden="true" />
    <header className="gallery-toolbar">
      <div className="gallery-brand"><Film size={19} /><div><span className="gallery-eyebrow">Aura / Media center</span><h2>Gallery<span> / {fullscreen ? 'Theater' : 'Moments'}</span></h2></div></div>
      <div className="gallery-toolbar-actions">
        {isEditMode && <><input ref={inputRef} type="file" accept="image/*,video/*" multiple hidden onChange={upload} /><button type="button" className="gallery-text-button" disabled={uploading} onClick={() => inputRef.current?.click()}><Upload size={14} /><span>{uploading ? 'Uploading…' : 'Add clip'}</span></button></>}
        <button ref={socialToggleRef} type="button" className="gallery-icon-button gallery-social-toggle" aria-label="Toggle discussion drawer" aria-expanded={drawerOpen} aria-controls="gallery-social" onClick={() => setDrawerOpen(!drawerOpen)}><MessageSquare size={17} /></button>
        <button type="button" className="gallery-text-button" aria-label={fullscreen ? 'Exit full screen' : 'Full screen'} onClick={toggleFullscreen}>{fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}<span>{fullscreen ? 'Exit theater' : 'Full screen'}</span></button>
        <button ref={closeRef} type="button" className="gallery-icon-button" aria-label="Close Gallery" onClick={onClose}><X size={19} /></button>
      </div>
    </header>

    <motion.div className="gallery-player-frame" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -30, opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.35 }}><GalleryPlayer key={selected?.id} clip={selected} fullscreen={fullscreen} /></motion.div>
    <div className="gallery-theater-caption"><span className="gallery-eyebrow">{selected?.game} / {selected?.isSample ? 'Sample moment' : 'Now playing'}</span><h2>{selected?.title}</h2><p>{selected?.description}</p></div>
    <aside ref={socialRef} id="gallery-social" className="gallery-social" aria-label="Clip details and discussion"><GallerySocialPanel key={`${channelId}:${selected?.id}`} clip={selected} channelId={channelId} user={user} /></aside>

    <motion.section className="gallery-hub bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent backdrop-blur-md" aria-label="Clip hub" initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.38 }}>
      <div className="gallery-hub-top"><div><span className="gallery-eyebrow">The moments that stay with you</span><h3>Your highlight reel</h3></div><span className="gallery-hub-hint">Browse. Relive. Share.</span></div>
      <MomentsTimeline clips={collectionClips} selectedDay={day} onSelectDay={selectDay} />
      <div className="gallery-ribbon-heading"><div role="tablist" aria-label="Gallery collections" className="gallery-collection-tabs">{[['moments', 'My Moments'], ['community', 'Community Highlights']].map(([value, label]) => <button key={value} id={`gallery-tab-${value}`} type="button" role="tab" aria-selected={collection === value} aria-controls="gallery-clip-ribbon" tabIndex={collection === value ? 0 : -1} onClick={() => selectCollection(value)} onKeyDown={(event) => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); const next = event.key === 'Home' ? 'moments' : event.key === 'End' ? 'community' : value === 'moments' ? 'community' : 'moments'; selectCollection(next); document.getElementById(`gallery-tab-${next}`)?.focus(); } }}>{label}</button>)}</div><div className="gallery-ribbon-navigation"><span>{filtered.length} moments{collection === 'community' && visibleRequests.length ? ` · ${visibleRequests.length} requests` : ''}</span><button type="button" className="gallery-icon-button" aria-label="Scroll clips left" onClick={() => ribbonRef.current?.scrollBy({ left: -440, behavior: reducedMotion ? 'auto' : 'smooth' })}><ChevronLeft size={16} /></button><button type="button" className="gallery-icon-button" aria-label="Scroll clips right" onClick={() => ribbonRef.current?.scrollBy({ left: 440, behavior: reducedMotion ? 'auto' : 'smooth' })}><ChevronRight size={16} /></button></div></div>
      <div ref={ribbonRef} id="gallery-clip-ribbon" role="tabpanel" aria-labelledby={`gallery-tab-${collection}`} className="gallery-clip-ribbon" onKeyDown={handleRibbonKey}>
        {collection === 'community' ? <CommunityClipsRail clips={filtered} requests={visibleRequests} selectedId={selected?.id} onSelectClip={selectClip} onSelectRequest={(request) => { const clip = clips.find((item) => item.id === request.clip_id); if (clip) { selectClip(clip); setDrawerOpen(true); } }} /> : filtered.map((clip) => <ClipCard key={clip.id} clip={clip} selected={selected?.id === clip.id} onSelect={selectClip} />)}
        {!filtered.length && !visibleRequests.length && <p className="gallery-empty-copy">No moments on this date. <button type="button" onClick={() => selectDay('all')}>Browse all dates</button></p>}
      </div>
      {collection === 'community' && requests.isError && <p className="gallery-inline-error">Community requests could not load. <button type="button" onClick={() => requests.refetch()}>Retry</button></p>}
      {isEditMode && <div className="gallery-edit-status"><span>Save your profile to keep Gallery changes.</span>{selected?.uploadIndex !== undefined && <button type="button" disabled={uploading} onClick={() => onUpdateImages?.(galleryImages.filter((_, index) => index !== selected.uploadIndex))}><Trash2 size={12} />Remove selected upload</button>}</div>}
      {uploadError && <p className="gallery-inline-error" role="alert">{uploadError}</p>}
    </motion.section>
  </motion.section>;
}
