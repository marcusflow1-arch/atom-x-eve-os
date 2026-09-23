import React, { useEffect, useState } from 'react';
import { Save, FolderOpen, Trash2, Copy, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getEquippedAXEItems } from '../axe/equipment/AXEEquipmentInventoryStore';
import { showError, showSuccess } from '@/components/error/ErrorToast';

const unwrap = (response) => response?.data ?? response ?? {};

export default function EquipmentPrefabManager() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [prefabs, setPrefabs] = useState([]);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      const response = await base44.functions.invoke('combatLoadoutPrefabs', { action: 'list', data: {} });
      const body = unwrap(response);
      if (body.error) throw new Error(body.error);
      setPrefabs(body.equipment_prefabs || []);
    } catch (error) {
      showError(error, 'Equipment Prefabs');
    }
  };

  useEffect(() => { refresh(); }, []);

  const save = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      const equipped = getEquippedAXEItems();
      const equipmentSlots = Object.fromEntries(equipped.map((item) => [
        item.slot || item.category || 'misc',
        item.instanceId || item.id,
      ]));
      const response = await base44.functions.invoke('combatLoadoutPrefabs', {
        action: 'saveEquipmentPrefab',
        data: { name: name.trim(), equipment_slots: equipmentSlots },
      });
      const body = unwrap(response);
      if (body.error) throw new Error(body.error);
      setPrefabs(body.equipment_prefabs || []);
      setName('');
      showSuccess('Equipment Prefab saved from your currently equipped gear.');
    } catch (error) {
      showError(error, 'Save Equipment Prefab');
    } finally {
      setBusy(false);
    }
  };

  const mutate = async (action, id) => {
    setBusy(true);
    try {
      const response = await base44.functions.invoke('combatLoadoutPrefabs', { action, data: { prefab_id: id } });
      const body = unwrap(response);
      if (body.error) throw new Error(body.error);
      setPrefabs(body.equipment_prefabs || []);
      showSuccess(action === 'deleteEquipmentPrefab' ? 'Equipment Prefab deleted.' : 'Equipment Prefab duplicated.');
    } catch (error) {
      showError(error, 'Equipment Prefab');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-2 border-t border-white/[0.055] pt-2">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.09em] text-cyan-100/55 hover:text-white">
        {open ? <X className="h-3 w-3" /> : <FolderOpen className="h-3 w-3" />} Equipment Prefabs
      </button>
      {open && (
        <div className="mt-2 border border-cyan-100/[0.07] bg-black/[0.12] p-2.5">
          <p className="text-[6px] leading-3 text-white/32">Save your currently equipped real item instances. Prefabs reference inventory items; they do not duplicate gear.</p>
          <div className="mt-2 flex gap-1.5">
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Prefab Name" className="h-7 min-w-0 flex-1 border border-white/[0.07] bg-black/20 px-2 text-[7px] text-white outline-none placeholder:text-white/25" />
            <button type="button" disabled={busy || !name.trim()} onClick={save} className="flex h-7 items-center gap-1 border border-cyan-100/12 px-2.5 text-[7px] font-black uppercase text-cyan-50/65 disabled:opacity-30"><Save className="h-3 w-3" />Save</button>
          </div>
          <div className="mt-2 space-y-1">
            {prefabs.length ? prefabs.map((prefab) => (
              <div key={prefab.id} className="flex items-center gap-1.5 border border-white/[0.05] px-2 py-1.5">
                <span className="min-w-0 flex-1 truncate text-[7px] text-white/60">{prefab.name}</span>
                <button type="button" disabled={busy} onClick={() => mutate('duplicateEquipmentPrefab', prefab.id)} title="Duplicate" className="text-white/35"><Copy className="h-3 w-3" /></button>
                <button type="button" disabled={busy} onClick={() => mutate('deleteEquipmentPrefab', prefab.id)} title="Delete" className="text-rose-100/35"><Trash2 className="h-3 w-3" /></button>
              </div>
            )) : <p className="text-[6px] text-white/24">No saved Equipment Prefabs.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
