import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Eye,
  MessageSquare,
  Palette,
  Play,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import PagePrefabDrawer from '@/components/customization/PagePrefabDrawer';
import usePagePrefabSurfaces from '@/components/customization/usePagePrefabSurfaces';
import '@/components/customization/pagePrefab.css';

const UIContext = createContext(null);
const STORAGE_PREFIX = 'atom_x_eve_ui_customization_v2:';

const DEFAULT_ELEMENT = {
  surface: 'inherit',
  border: 'inherit',
  accent: '#7dd3fc',
  radius: 18,
  scale: 1,
  opacity: 1,
};

const PRESETS = [
  {
    id: 'graphite',
    name: 'Graphite',
    hint: 'Quiet console glass',
    accent: '#9de8f2',
    accentRgb: '157,232,242',
    surface: 'rgba(20,24,30,.58)',
    surfaceStrong: 'rgba(28,33,40,.76)',
    border: 'rgba(255,255,255,.09)',
    ambient: 'radial-gradient(circle at 18% 10%, rgba(148,163,184,.12), transparent 32%), linear-gradient(145deg, rgba(34,39,46,.32), rgba(10,13,18,.12))',
    pageBackground: '#090c11',
  },
  {
    id: 'sapphire_green',
    name: 'Sapphire Green',
    hint: 'Emerald-sapphire HUD',
    accent: '#5eead4',
    accentRgb: '94,234,212',
    surface: 'rgba(12,31,32,.54)',
    surfaceStrong: 'rgba(13,42,41,.74)',
    border: 'rgba(94,234,212,.16)',
    ambient: 'radial-gradient(circle at 20% 4%, rgba(16,185,129,.15), transparent 34%), radial-gradient(circle at 82% 32%, rgba(14,165,233,.10), transparent 30%)',
    pageBackground: '#071211',
  },
  {
    id: 'dragon_motion',
    name: 'Dragon Motion',
    hint: 'Animated ember backdrop',
    accent: '#fb7185',
    accentRgb: '251,113,133',
    surface: 'rgba(36,20,24,.54)',
    surfaceStrong: 'rgba(49,25,29,.74)',
    border: 'rgba(251,113,133,.16)',
    ambient: 'radial-gradient(circle at 18% 15%, rgba(244,63,94,.18), transparent 32%), radial-gradient(circle at 76% 74%, rgba(249,115,22,.12), transparent 30%), linear-gradient(115deg, rgba(45,13,20,.20), rgba(8,10,14,.08))',
    pageBackground: '#12090d',
    motion: true,
  },
  {
    id: 'violet_flux',
    name: 'Violet Flux',
    hint: 'Cool holographic violet',
    accent: '#c4b5fd',
    accentRgb: '196,181,253',
    surface: 'rgba(28,23,44,.52)',
    surfaceStrong: 'rgba(38,30,59,.74)',
    border: 'rgba(196,181,253,.15)',
    ambient: 'radial-gradient(circle at 72% 8%, rgba(139,92,246,.16), transparent 34%), radial-gradient(circle at 16% 70%, rgba(59,130,246,.09), transparent 28%)',
    pageBackground: '#0c0914',
  },
];

const css = `
.atom-ui-customization-root { --atom-ui-accent:#9de8f2; --atom-ui-accent-rgb:157,232,242; --atom-ui-page-bg:#090c11; --atom-ui-ambient:none; isolation:isolate; background:var(--atom-ui-page-bg); color:#fff; }
.atom-ui-customization-root::before { content:''; position:absolute; inset:0; z-index:0; pointer-events:none; background-image:var(--atom-ui-ambient); opacity:.72; }
.atom-ui-edit-mode .atom-ui-editable { outline:1px solid rgba(var(--atom-ui-accent-rgb),.58) !important; outline-offset:2px; cursor:crosshair !important; }
.atom-ui-edit-mode .atom-ui-editable:hover { outline-width:2px !important; box-shadow:0 0 0 1px rgba(var(--atom-ui-accent-rgb),.12),0 0 28px rgba(var(--atom-ui-accent-rgb),.17) !important; }
.atom-ui-edit-selected { outline:2px solid rgb(var(--atom-ui-accent-rgb)) !important; outline-offset:3px !important; }
@keyframes atomDragonDrift { 0%{transform:translate3d(-2%,0,0) scale(1.04);opacity:.62} 50%{transform:translate3d(2%,-1.5%,0) scale(1.08);opacity:.9} 100%{transform:translate3d(-2%,0,0) scale(1.04);opacity:.62} }
@keyframes atomParticleRise { 0%{transform:translate3d(0,18px,0) scale(.7);opacity:0} 20%{opacity:.42} 100%{transform:translate3d(18px,-90px,0) scale(1.15);opacity:0} }
`;

function masterPage(pathname = '') {
  const path = pathname.toLowerCase();
  if (path.includes('/lunatemplate') || path === '/home') return 'luna';
  if (path.includes('/clan')) return 'clan';
  if (path.includes('/community') || path.includes('/forum')) return 'forum';
  if (path.includes('/genremastery') || path.includes('/achievements') || path.includes('/cards')) return 'cards';
  if (path.includes('/aura') || path.includes('/streaminghome') || path.includes('/discover')) return 'aura';
  if (path.includes('/store') || path.includes('/gamedetail')) return 'store';
  const segment = path.split('/').filter(Boolean)[0];
  return segment || 'platform';
}

function viewName(location, page) {
  const path = location.pathname.toLowerCase();
  const params = new URLSearchParams(location.search);
  const explicit = params.get('subview') || params.get('mode') || params.get('panel') || params.get('tab') || params.get('view');
  if (explicit) return explicit;
  if (page === 'aura') {
    if (path.includes('/discover')) return 'discover';
    if (path.includes('/streaminghome')) return 'home';
    return 'aura';
  }
  if (page === 'store') return path.includes('/gamedetail') ? 'game-detail' : 'store';
  return 'main';
}

function safeRead(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function hexToRgb(hex) {
  const clean = String(hex || '').replace('#', '');
  if (clean.length !== 6) return '125,211,252';
  const n = Number.parseInt(clean, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}

function slug(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'module';
}

function targetLabel(element) {
  return element?.dataset?.uiCustomizable
    || element?.getAttribute?.('aria-label')
    || element?.querySelector?.('h1,h2,h3,h4,[data-title]')?.textContent?.trim()
    || element?.textContent?.trim()?.slice(0, 42)
    || element?.tagName?.toLowerCase()
    || 'UI module';
}

function targetKey(element) {
  if (!element) return '';
  const explicit = element.dataset.uiCustomizationKey || element.id || element.dataset.uiCustomizable || element.getAttribute('aria-label');
  if (explicit) return `named:${slug(explicit)}`;
  const parent = element.parentElement;
  const siblings = parent ? Array.from(parent.children).filter((node) => node.tagName === element.tagName) : [];
  const index = Math.max(0, siblings.indexOf(element));
  return `${element.tagName.toLowerCase()}:${slug(targetLabel(element))}:${index}`;
}

function applyElementStyle(element, setting) {
  if (!element || !setting) return;
  const rgb = hexToRgb(setting.accent);
  element.style.setProperty('--atom-element-accent', setting.accent || DEFAULT_ELEMENT.accent);
  element.style.setProperty('--atom-element-accent-rgb', rgb);
  element.style.borderRadius = `${Number(setting.radius ?? 18)}px`;
  element.style.scale = String(Number(setting.scale ?? 1));
  element.style.opacity = String(Number(setting.opacity ?? 1));

  if (setting.surface === 'glass') {
    element.style.background = 'rgba(15,23,32,.48)';
    element.style.backdropFilter = 'blur(22px) saturate(145%)';
    element.style.webkitBackdropFilter = 'blur(22px) saturate(145%)';
  } else if (setting.surface === 'matte') {
    element.style.background = 'rgba(19,23,29,.92)';
    element.style.backdropFilter = 'none';
    element.style.webkitBackdropFilter = 'none';
  } else if (setting.surface === 'clear') {
    element.style.background = 'transparent';
    element.style.backdropFilter = 'none';
    element.style.webkitBackdropFilter = 'none';
  } else if (setting.surface === 'holo') {
    element.style.background = `linear-gradient(135deg,rgba(${rgb},.10),rgba(255,255,255,.025) 45%,rgba(${rgb},.04))`;
    element.style.backdropFilter = 'blur(24px) saturate(170%)';
    element.style.webkitBackdropFilter = 'blur(24px) saturate(170%)';
  }

  if (setting.border === 'none') {
    element.style.borderColor = 'transparent';
    element.style.boxShadow = 'none';
  } else if (setting.border === 'soft') {
    element.style.border = `1px solid rgba(${rgb},.24)`;
    element.style.boxShadow = '0 12px 34px rgba(0,0,0,.20)';
  } else if (setting.border === 'glow') {
    element.style.border = `1px solid rgba(${rgb},.58)`;
    element.style.boxShadow = `0 0 0 1px rgba(${rgb},.10),0 0 28px rgba(${rgb},.22),0 16px 42px rgba(0,0,0,.24)`;
  }
}

function ThemeAmbient({ preset }) {
  return (
    <div data-ui-editor-ignore="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute -inset-[6%]" style={{ backgroundImage: preset.ambient, animation: preset.motion ? 'atomDragonDrift 11s ease-in-out infinite' : undefined }} />
      {preset.motion && Array.from({ length: 10 }).map((_, index) => (
        <span
          key={index}
          className="absolute h-1 w-1 rounded-full bg-orange-200/60 blur-[.3px]"
          style={{
            left: `${8 + ((index * 9) % 84)}%`,
            bottom: `${4 + ((index * 13) % 28)}%`,
            animation: `atomParticleRise ${5 + (index % 4)}s linear ${index * .55}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

export function UICustomizationProvider({ children, pathname }) {
  const location = useLocation();
  const page = masterPage(pathname || location.pathname);
  const scope = `${page}:${viewName(location, page)}`;
  const storageKey = `${STORAGE_PREFIX}${scope}`;
  const local = useMemo(() => safeRead(storageKey), [storageKey]);
  const [config, setConfig] = useState(() => ({ ...(local || { presetId: 'graphite', elementSettings: {}, updatedAt: 0 }), scope }));
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState(null);
  const [syncReady, setSyncReady] = useState(false);
  const rootRef = useRef(null);
  const saveTimerRef = useRef(null);
  const preset = PRESETS.find((item) => item.id === config.presetId) || PRESETS[0];
  usePagePrefabSurfaces(rootRef, Boolean(config.updatedAt) && config.scope === scope, scope, config.elementSettings);

  useEffect(() => {
    const nextLocal = { ...(safeRead(storageKey) || { presetId: 'graphite', elementSettings: {}, updatedAt: 0 }), scope };
    setConfig(nextLocal);
    setEditMode(false);
    setSelected(null);
    setSyncReady(false);
    let cancelled = false;

    (async () => {
      try {
        const response = await base44.functions.invoke('uiCustomization', { action: 'getState', payload: { pageScope: scope } });
        const remote = response?.data?.state || response?.state;
        if (!cancelled && remote && Number(remote.updatedAt || 0) > Number(nextLocal.updatedAt || 0)) {
          setConfig({ presetId: remote.presetId || 'graphite', elementSettings: remote.elementSettings || {}, updatedAt: Number(remote.updatedAt || 0), scope });
        }
      } catch (error) {
        console.warn('UI customization profile sync unavailable', error);
      } finally {
        if (!cancelled) setSyncReady(true);
      }
    })();

    return () => { cancelled = true; };
  }, [scope, storageKey]);

  useEffect(() => {
    if (config.scope !== scope) return;
    try { localStorage.setItem(storageKey, JSON.stringify(config)); } catch {}
    if (!syncReady || !config.updatedAt) return undefined;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      base44.functions.invoke('uiCustomization', {
        action: 'saveState',
        payload: { pageScope: scope, presetId: config.presetId, elementSettings: config.elementSettings, updatedAt: config.updatedAt },
      }).catch((error) => console.warn('UI customization save unavailable', error));
    }, 700);
    return () => clearTimeout(saveTimerRef.current);
  }, [config, scope, storageKey, syncReady]);

  // Preset variables stay within this page; global navigation keeps its own theme.

  const scan = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    root.querySelectorAll('.atom-ui-editable').forEach((element) => element.classList.remove('atom-ui-editable'));
    root.querySelectorAll('.atom-ui-edit-selected').forEach((element) => element.classList.remove('atom-ui-edit-selected'));

    const candidates = Array.from(root.querySelectorAll(
      '[data-ui-customizable],section,article,.rounded-xl,.rounded-2xl,.rounded-3xl,.rounded-\\[24px\\],.rounded-\\[30px\\]'
    )).filter((element) => {
      if (element.closest('[data-ui-editor-ignore="true"]')) return false;
      const rect = element.getBoundingClientRect();
      return rect.width >= 120 && rect.height >= 48 && rect.width <= window.innerWidth * .97 && rect.height <= window.innerHeight * .92;
    }).slice(0, 180);

    candidates.forEach((element) => {
      const key = targetKey(element);
      element.dataset.uiEditableRuntime = key;
      const setting = config.elementSettings?.[key];
      if (setting) applyElementStyle(element, setting);
      if (editMode) element.classList.add('atom-ui-editable');
      if (selected?.key === key) element.classList.add('atom-ui-edit-selected');
    });
  }, [config.elementSettings, editMode, selected?.key]);

  useEffect(() => {
    let frame = requestAnimationFrame(scan);
    const root = rootRef.current;
    if (!root) return () => cancelAnimationFrame(frame);
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(scan);
    });
    observer.observe(root, { childList: true, subtree: true });
    window.addEventListener('resize', scan);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', scan);
    };
  }, [scan]);

  useEffect(() => {
    if (!editMode) return undefined;
    const root = rootRef.current;
    if (!root) return undefined;
    const onClick = (event) => {
      if (event.target.closest('[data-ui-editor-ignore="true"]')) return;
      const target = event.target.closest('[data-ui-editable-runtime]');
      if (!target || !root.contains(target)) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      setSelected({ key: target.dataset.uiEditableRuntime, label: targetLabel(target) });
    };
    root.addEventListener('click', onClick, true);
    return () => root.removeEventListener('click', onClick, true);
  }, [editMode]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      if (selected) setSelected(null);
      else if (editMode) setEditMode(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editMode, selected]);

  const applyPreset = useCallback((presetId) => setConfig((current) => ({ ...current, presetId, updatedAt: Date.now() })), []);
  const updateElement = useCallback((patch) => {
    if (!selected?.key) return;
    setConfig((current) => ({
      ...current,
      updatedAt: Date.now(),
      elementSettings: {
        ...(current.elementSettings || {}),
        [selected.key]: { ...DEFAULT_ELEMENT, ...(current.elementSettings?.[selected.key] || {}), ...patch },
      },
    }));
  }, [selected?.key]);
  const resetElement = useCallback(() => {
    if (!selected?.key) return;
    setConfig((current) => {
      const next = { ...(current.elementSettings || {}) };
      delete next[selected.key];
      return { ...current, elementSettings: next, updatedAt: Date.now() };
    });
    setSelected(null);
  }, [selected?.key]);

  const contextValue = useMemo(() => ({
    page,
    scope,
    preset,
    presets: PRESETS,
    config,
    editMode,
    selected,
    setSelected,
    setEditMode,
    applyPreset,
    updateElement,
    resetElement,
  }), [page, scope, preset, config, editMode, selected, applyPreset, updateElement, resetElement]);

  return (
    <UIContext.Provider value={contextValue}>
      <style>{css}</style>
      <div
        ref={rootRef}
        className={`atom-ui-customization-root relative h-full w-full overflow-hidden ${editMode ? 'atom-ui-edit-mode' : ''}`}
        data-ui-page-theme={preset.id}
        style={{ '--atom-ui-accent': preset.accent, '--atom-ui-accent-rgb': preset.accentRgb, '--atom-ui-page-bg': preset.pageBackground || '#090c11', '--atom-ui-ambient': preset.ambient, '--glass-bg': preset.surface, '--glass-bg-strong': preset.surfaceStrong, '--glass-border': preset.border, '--forum-accent': preset.accent, '--forum-accent-rgb': preset.accentRgb }}
      >
        <ThemeAmbient preset={preset} />
        <div className="relative z-[1] h-full w-full">{children}</div>
      </div>
      {selected && <ElementEditor />}
    </UIContext.Provider>
  );
}

function ElementEditor() {
  const { selected, setSelected, config, updateElement, resetElement, preset } = useUICustomization();
  const setting = { ...DEFAULT_ELEMENT, ...(config.elementSettings?.[selected.key] || {}) };
  const panel = (
    <div data-ui-editor-ignore="true" className="fixed inset-0 z-[300] pointer-events-none">
      <div className="pointer-events-auto absolute right-5 top-1/2 w-[min(360px,calc(100vw-32px))] -translate-y-1/2 overflow-hidden rounded-[28px] bg-[#11161d]/94 p-5 text-white shadow-[0_28px_90px_rgba(0,0,0,.58),inset_0_1px_0_rgba(255,255,255,.08)] backdrop-blur-3xl">
        <div className="flex items-start justify-between gap-4">
          <div><span className="text-[8px] font-black uppercase tracking-[.22em] text-white/30">Layout Edit</span><h3 className="mt-1 text-lg font-black">{selected.label}</h3></div>
          <button type="button" onClick={() => setSelected(null)} className="grid h-9 w-9 place-items-center rounded-xl bg-white/[0.05] text-white/45 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <EditorChoice label="Surface" value={setting.surface} options={['inherit', 'glass', 'matte', 'clear', 'holo']} onChange={(surface) => updateElement({ surface })} />
        <EditorChoice label="Border" value={setting.border} options={['inherit', 'none', 'soft', 'glow']} onChange={(border) => updateElement({ border })} />
        <div className="mt-5 grid grid-cols-[1fr_auto] items-center gap-4">
          <div><span className="text-[9px] font-black uppercase tracking-[.16em] text-white/35">Accent</span><p className="mt-1 text-[10px] text-white/25">Tint for this module</p></div>
          <input type="color" value={setting.accent || preset.accent} onChange={(event) => updateElement({ accent: event.target.value })} className="h-9 w-12 cursor-pointer rounded-lg border-0 bg-transparent" />
        </div>
        <EditorRange label="Corner radius" value={setting.radius} min={0} max={48} step={1} suffix="px" onChange={(radius) => updateElement({ radius })} />
        <EditorRange label="Scale" value={setting.scale} min={.75} max={1.25} step={.01} onChange={(scale) => updateElement({ scale })} />
        <EditorRange label="Opacity" value={setting.opacity} min={.35} max={1} step={.01} onChange={(opacity) => updateElement({ opacity })} />
        <button type="button" onClick={resetElement} className="mt-5 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white/[0.055] text-[9px] font-black uppercase tracking-[.14em] text-white/55 hover:bg-white/[0.08] hover:text-white"><RotateCcw className="h-3.5 w-3.5" />Reset module</button>
      </div>
    </div>
  );
  return typeof document !== 'undefined' ? createPortal(panel, document.body) : panel;
}

function EditorChoice({ label, value, options, onChange }) {
  return (
    <div className="mt-5">
      <span className="text-[9px] font-black uppercase tracking-[.16em] text-white/35">{label}</span>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {options.map((option) => <button key={option} type="button" onClick={() => onChange(option)} className={`rounded-xl px-2 py-2 text-[9px] font-bold capitalize transition ${value === option ? 'bg-white text-slate-950' : 'bg-white/[0.045] text-white/45 hover:text-white'}`}>{option}</button>)}
      </div>
    </div>
  );
}

function EditorRange({ label, value, min, max, step, suffix = '', onChange }) {
  return (
    <label className="mt-5 block">
      <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[.14em] text-white/35"><span>{label}</span><span className="text-white/60">{Number(value).toFixed(step < .1 ? 2 : 0)}{suffix}</span></div>
      <input className="mt-2 w-full accent-white" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

export function useUICustomization() {
  const context = useContext(UIContext);
  if (!context) throw new Error('UICustomization components must be inside UICustomizationProvider');
  return context;
}

function RailButton({ icon: Icon, label, active, onClick, play = false, compact = false }) {
  return (
    <button
      type="button"
      data-ui-editor-ignore="true"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`group relative grid ${compact ? 'h-9 w-9 rounded-xl' : 'h-11 w-11 rounded-[15px]'} place-items-center transition-all duration-200 ${
        play
          ? 'bg-gradient-to-br from-cyan-300/95 via-cyan-400/90 to-emerald-400/90 text-[#061116] shadow-[0_0_24px_rgba(34,211,238,.22),inset_0_1px_0_rgba(255,255,255,.48)] hover:scale-[1.04]'
          : active
            ? 'bg-white/[0.14] text-white shadow-[0_0_24px_rgba(var(--atom-ui-accent-rgb),.20),inset_0_1px_0_rgba(255,255,255,.12)]'
            : 'border border-white/[0.10] bg-white/[0.035] text-white/45 shadow-[inset_0_1px_0_rgba(255,255,255,.05),0_10px_24px_rgba(0,0,0,.16)] hover:border-white/[0.18] hover:bg-white/[0.075] hover:text-white'
      }`}
    >
      <Icon className={compact ? 'h-3.5 w-3.5' : 'h-[17px] w-[17px]'} />
      <span className="pointer-events-none absolute left-[calc(100%+9px)] z-[340] hidden whitespace-nowrap rounded-lg bg-[#11161d]/95 px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[.12em] text-white/65 shadow-xl backdrop-blur-xl group-hover:block">{label}</span>
    </button>
  );
}

function useLegacyPrimaryAction(page) {
  const legacyPlayRef = useRef(null);
  const hiddenRef = useRef([]);

  useEffect(() => {
    let disposed = false;
    const hide = (element) => {
      if (!element || hiddenRef.current.some((entry) => entry.element === element)) return;
      hiddenRef.current.push({ element, display: element.style.display });
      element.style.display = 'none';
    };
    const locate = () => {
      if (disposed) return;
      const buttons = Array.from(document.querySelectorAll('button'));
      const play = buttons.find((candidate) => {
        if (candidate.closest('[data-atom-customization-midpoint="true"]')) return false;
        return candidate.textContent?.trim() === 'Play' && (candidate.className?.includes('cyan') || candidate.className?.includes('green'));
      }) || buttons.find((candidate) => !candidate.closest('[data-atom-customization-midpoint="true"]') && candidate.textContent?.trim() === 'Play');
      if (play) {
        legacyPlayRef.current = play;
        hide(play);
      }

      if (page === 'luna') {
        buttons.forEach((candidate) => {
          const text = candidate.textContent?.trim();
          if (text === 'Top Widget' || text === 'Bottom Widget') hide(candidate);
        });
      }
    };
    locate();
    const observer = new MutationObserver(locate);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      disposed = true;
      observer.disconnect();
      hiddenRef.current.forEach(({ element, display }) => {
        if (element?.isConnected) element.style.display = display;
      });
      hiddenRef.current = [];
      legacyPlayRef.current = null;
    };
  }, [page]);

  return legacyPlayRef;
}

export function UICustomizationControls({ className = '' }) {
  const navigate = useNavigate();
  const { page, scope, preset, presets, applyPreset, editMode, setEditMode } = useUICustomization();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const legacyPlayRef = useLegacyPrimaryAction(page);

  const play = () => {
    if (legacyPlayRef.current) {
      legacyPlayRef.current.click();
      return;
    }
    window.dispatchEvent(new CustomEvent('atomPlayRequested', { detail: { source: page, scope } }));
    navigate(createPageUrl('GameView'));
  };
  const quickForum = () => window.dispatchEvent(new CustomEvent('openForumDirectory'));
  const roster = () => window.dispatchEvent(new Event('toggleClanRoster'));
  const quickChat = () => window.dispatchEvent(new Event('openClanChatOverlay'));
  const watched = () => window.dispatchEvent(new Event('openAuraStreamsDrawer'));

  const action = (key) => {
    if (key === 'play') return { label: 'Play', icon: Play, action: play, play: true };
    if (key === 'roster') return { label: 'Roster', icon: Users, action: roster };
    if (key === 'chat') return { label: 'Quick Chat', icon: MessageSquare, action: quickChat };
    if (key === 'forum') return { label: 'Quick Forum', icon: MessageSquare, action: quickForum };
    return { label: 'Recently Streamed', icon: Eye, action: watched };
  };

  const sequence = page === 'clan'
    ? ['play', 'roster', 'chat']
    : page === 'forum'
      ? ['forum', 'play']
      : page === 'aura'
        ? ['play', 'watched']
        : ['play'];

  const showEdit = page !== 'clan';
  const drawer = drawerOpen ? <PagePrefabDrawer scope={scope} preset={preset} presets={presets} onSelect={applyPreset} onClose={() => setDrawerOpen(false)} /> : null;

  return (
    <>
      <div data-atom-customization-midpoint="true" data-ui-editor-ignore="true" className={`flex flex-col items-center gap-2 ${className}`}>
        <RailButton icon={Palette} label="UI Prefabs" active={drawerOpen} onClick={() => setDrawerOpen((value) => !value)} />
        {sequence.map((key, index) => {
          const item = action(key);
          return <RailButton key={`${key}-${index}`} icon={item.icon} label={item.label} onClick={item.action} play={item.play} compact={page === 'clan' && key === 'chat'} />;
        })}
        {showEdit && <RailButton icon={SlidersHorizontal} label={editMode ? 'Exit Layout Edit' : 'Layout Edit'} active={editMode} onClick={() => setEditMode((value) => !value)} />}
      </div>
      {typeof document !== 'undefined' && drawer ? createPortal(drawer, document.body) : drawer}
    </>
  );
}

// Backward-compatible export. It is intentionally only the midpoint control stack,
// never the full sidebar/rail container.
export function UICustomizationRail(props) {
  return <UICustomizationControls {...props} />;
}