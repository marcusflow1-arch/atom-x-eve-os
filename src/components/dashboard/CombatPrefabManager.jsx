import { useEffect, useMemo, useState } from 'react';
import { Copy, FolderOpen, Save, Trash2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import useSkillBookLoadout from '@/components/luna/hooks/useSkillBookLoadout';
import { showError, showSuccess } from '@/components/error/ErrorToast';

const unwrap = (response) => response?.data ?? response ?? {};

export default function CombatPrefabManager() {
  const { skillSets, isSaving } = useSkillBookLoadout();
  const [prefabs, setPrefabs] = useState([]);
  const [name, setName] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const response = await base44.functions.invoke('combatLoadoutPrefabs', { action: 'list', data: {} });
      const body = unwrap(response);
      if (body.error) throw new Error(body.error);
      setPrefabs(body.skill_prefabs || []);
    } catch (error) {
      showError(error, 'Skill Prefabs');
    }
  };

  useEffect(() => { load(); }, []);

  const rows = useMemo(() => [...(skillSets || [])].sort((a, b) => Number(a.skill_set_order || 0) - Number(b.skill_set_order || 0)).slice(0, 3), [skillSets]);

  const savePrefab = async () => {
    const trimmed = name.trim();
    if (!trimmed || busy || isSaving) return;
    setBusy(true);
    try {
      const response = await base44.functions.invoke('combatLoadoutPrefabs', {
        action: 'saveSkillPrefab',
        data: { name: trimmed },
      });
      const body = unwrap(response);
      if (body.error) throw new Error(body.error);
      setPrefabs(body.skill_prefabs || []);
      setName('');
      showSuccess('Skill Prefab saved.');
    } catch (error) {
      showError(error, 'Save Skill Prefab');
    } finally {
      setBusy(false);
    }
  };

  const loadPrefab = async (id) => {
    setBusy(true);
    try {
      const response = await base44.functions.invoke('combatLoadoutPrefabs', { action: 'loadSkillPrefab', data: { prefab_id: id } });
      const body = unwrap(response);
      if (body.error) throw new Error(body.error);
      window.location.reload();
    } catch (error) {
      showError(error, 'Load Skill Prefab');
      setBusy(false);
    }
  };

  const mutatePrefab = async (action, id) => {
    setBusy(true);
    try {
      const response = await base44.functions.invoke('combatLoadoutPrefabs', { action, data: { prefab_id: id } });
      const body = unwrap(response);
      if (body.error) throw new Error(body.error);
      setPrefabs(body.skill_prefabs || []);
      showSuccess(action === 'deleteSkillPrefab' ? 'Skill Prefab deleted.' : 'Skill Prefab duplicated.');
    } catch (error) {
      showError(error, 'Skill Prefab');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mt-3 border border-cyan-100/[0.08] bg-cyan-100/[0.018] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[7px] font-black uppercase tracking-[0.16em] text-cyan-100/55">Combat Loadouts</p>
          <h3 className="mt-1 text-[11px] font-semibold text-white">Skill Prefabs</h3>
          <p className="mt-0.5 text-[7px] text-white/38">Save the three 4-slot rows as one reusable Skill Prefab. Cards remain references to your real owned skills.</p>
        </div>
        <button type="button" onClick={() => setOpen((value) => !value)} className="flex h-7 items-center gap-1.5 border border-white/[0.07] px-2.5 text-[7px] font-black uppercase tracking-[0.08em] text-white/65">
          {open ? <X className="h-3 w-3" /> : <FolderOpen className="h-3 w-3" />}
          {open ? 'Close' : 'Manage'}
        </button>
      </div>

      {open && (
        <div className="mt-3 grid grid-cols-[1.1fr_.9fr] gap-3">
          <div>
            <div className="grid grid-cols-3 gap-1.5">
              {rows.map((row, index) => (
                <div key={row.skill_set_id || index} className="border border-white/[0.055] bg-black/[0.12] p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[6px] font-black uppercase tracking-[0.1em] text-cyan-100/45">Row {index + 1}</span>
                    <span className="text-[6px] text-white/28">{row.skill_set_name || 'Row ' + (index + 1)}</span>
                  </div>
                  <div className="mt-1.5 grid grid-cols-4 gap-1">
                    {[0, 1, 2, 3].map((slot) => {
                      const card = row?.slots?.find((entry) => Number(entry.index) === slot)?.card;
                      return <div key={slot} className="min-w-0 border border-white/[0.05] bg-white/[0.018] px-1 py-1.5 text-center">
                        <span className="block text-[5px] text-white/25">{slot + 1}</span>
                        <span className="mt-0.5 block truncate text-[5.5px] text-white/58">{card?.card_name || 'Empty'}</span>
                      </div>;
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-1.5">
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Prefab Name" className="h-8 min-w-0 flex-1 border border-white/[0.07] bg-black/20 px-2.5 text-[7px] text-white outline-none placeholder:text-white/25" />
              <button type="button" disabled={busy || isSaving || !name.trim()} onClick={savePrefab} className="flex h-8 items-center gap-1.5 border border-cyan-100/14 bg-cyan-100/[0.045] px-3 text-[7px] font-black uppercase tracking-[0.08em] text-cyan-50/70 disabled:opacity-30"><Save className="h-3 w-3" />Save</button>
            </div>
          </div>

          <div className="border-l border-white/[0.055] pl-3">
            <p className="text-[6px] font-black uppercase tracking-[0.13em] text-white/32">Saved Prefabs</p>
            <div className="mt-1.5 max-h-32 space-y-1 overflow-y-auto">
              {prefabs.length ? prefabs.map((prefab) => (
                <div key={prefab.id} className="flex items-center gap-1.5 border border-white/[0.05] bg-white/[0.012] px-2 py-1.5">
                  <span className="min-w-0 flex-1 truncate text-[7px] text-white/70">{prefab.name}</span>
                  <button type="button" disabled={busy} onClick={() => loadPrefab(prefab.id)} title="Load" className="text-cyan-100/55"><FolderOpen className="h-3 w-3" /></button>
                  <button type="button" disabled={busy} onClick={() => mutatePrefab('duplicateSkillPrefab', prefab.id)} title="Duplicate" className="text-white/38"><Copy className="h-3 w-3" /></button>
                  <button type="button" disabled={busy} onClick={() => mutatePrefab('deleteSkillPrefab', prefab.id)} title="Delete" className="text-rose-100/40"><Trash2 className="h-3 w-3" /></button>
                </div>
              )) : <p className="text-[6px] text-white/25">No saved Skill Prefabs yet.</p>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
