import React, { useState, useEffect } from 'react';
import { TrendingUp, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { showSuccess, showError } from '@/components/error/ErrorToast';

const CURVE_TYPES = [
  { value: 'linear', label: 'Linear', desc: 'EXP = base × level' },
  { value: 'exponential', label: 'Exponential', desc: 'EXP = base × level^exponent' },
  { value: 'custom', label: 'Custom Table', desc: 'Manually define EXP per level' },
];

export default function ExpProgressionAdmin() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [settingsId, setSettingsId] = useState(null);

  const { data: allSettings = [], isLoading } = useQuery({
    queryKey: ['game-settings'],
    queryFn: () => base44.entities.GameSettings.list(),
  });

  // Load or initialize settings
  useEffect(() => {
    if (allSettings.length > 0) {
      const s = allSettings[0];
      setSettingsId(s.id);
      setSettings({
        name: s.name || 'default',
        exp_per_enemy_kill: s.exp_per_enemy_kill ?? 50,
        exp_per_boss_kill: s.exp_per_boss_kill ?? 500,
        exp_per_quest: s.exp_per_quest ?? 300,
        exp_per_assist: s.exp_per_assist ?? 25,
        exp_multiplier: s.exp_multiplier ?? 1.0,
        level_curve_type: s.level_curve_type || 'exponential',
        level_curve_base: s.level_curve_base ?? 100,
        level_curve_exponent: s.level_curve_exponent ?? 1.5,
        max_level: s.max_level ?? 50,
        custom_level_table: s.custom_level_table || [
          { level: 1, exp_required: 100 },
          { level: 2, exp_required: 250 },
          { level: 3, exp_required: 500 },
          { level: 4, exp_required: 900 },
          { level: 5, exp_required: 1500 },
        ],
      });
    } else if (!isLoading) {
      // No settings exist yet — provide defaults
      setSettings({
        name: 'default',
        exp_per_enemy_kill: 50,
        exp_per_boss_kill: 500,
        exp_per_quest: 300,
        exp_per_assist: 25,
        exp_multiplier: 1.0,
        level_curve_type: 'exponential',
        level_curve_base: 100,
        level_curve_exponent: 1.5,
        max_level: 50,
        custom_level_table: [
          { level: 1, exp_required: 100 },
          { level: 2, exp_required: 250 },
          { level: 3, exp_required: 500 },
          { level: 4, exp_required: 900 },
          { level: 5, exp_required: 1500 },
        ],
      });
    }
  }, [allSettings, isLoading]);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      if (settingsId) {
        await base44.entities.GameSettings.update(settingsId, settings);
      } else {
        const created = await base44.entities.GameSettings.create(settings);
        setSettingsId(created.id);
      }
      queryClient.invalidateQueries({ queryKey: ['game-settings'] });
      showSuccess('EXP & Progression settings saved');
    } catch (e) {
      showError(e, 'Save Settings');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const addTableRow = () => {
    const table = [...(settings.custom_level_table || [])];
    const lastLevel = table.length > 0 ? table[table.length - 1].level : 0;
    const lastExp = table.length > 0 ? table[table.length - 1].exp_required : 0;
    table.push({ level: lastLevel + 1, exp_required: Math.round(lastExp * 1.5) || 100 });
    updateField('custom_level_table', table);
  };

  const removeTableRow = (idx) => {
    const table = [...settings.custom_level_table];
    table.splice(idx, 1);
    updateField('custom_level_table', table);
  };

  const updateTableRow = (idx, field, value) => {
    const table = [...settings.custom_level_table];
    table[idx] = { ...table[idx], [field]: value };
    updateField('custom_level_table', table);
  };

  // Preview curve
  const previewLevels = () => {
    if (!settings) return [];
    const levels = [];
    for (let i = 1; i <= Math.min(settings.max_level, 10); i++) {
      let exp = 0;
      if (settings.level_curve_type === 'linear') {
        exp = Math.round(settings.level_curve_base * i);
      } else if (settings.level_curve_type === 'exponential') {
        exp = Math.round(settings.level_curve_base * Math.pow(i, settings.level_curve_exponent));
      } else {
        const row = (settings.custom_level_table || []).find(r => r.level === i);
        exp = row ? row.exp_required : '—';
      }
      levels.push({ level: i, exp });
    }
    return levels;
  };

  if (isLoading || !settings) {
    return (
      <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-center py-12 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </section>
    );
  }

  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
            <TrendingUp className="w-6 h-6 text-green-500" />
            Experience &amp; Progression
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Configure how characters gain EXP, level up, and grow stats. These values are used at runtime for combat calculations.
          </p>
        </div>
        <Badge variant="outline" className="text-slate-400 border-slate-700">
          Max Level: {settings.max_level}
        </Badge>
      </div>

      {/* Global EXP Rules */}
      <div className="mb-6">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Global EXP Awards</label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { key: 'exp_per_enemy_kill', label: 'Enemy Kill' },
            { key: 'exp_per_boss_kill', label: 'Boss Kill' },
            { key: 'exp_per_quest', label: 'Quest' },
            { key: 'exp_per_assist', label: 'Assist' },
            { key: 'exp_multiplier', label: 'Multiplier', step: 0.1 },
          ].map(f => (
            <div key={f.key}>
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">{f.label}</label>
              <Input
                type="number"
                step={f.step || 1}
                value={settings[f.key]}
                onChange={(e) => updateField(f.key, parseFloat(e.target.value) || 0)}
                className="bg-slate-900 border-slate-700"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Level Curve */}
      <div className="mb-6">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 block">Level Curve</label>
        <div className="flex gap-2 mb-4">
          {CURVE_TYPES.map(ct => (
            <button
              key={ct.value}
              onClick={() => updateField('level_curve_type', ct.value)}
              className={`flex-1 p-3 rounded-lg text-left border transition-all ${
                settings.level_curve_type === ct.value
                  ? 'bg-green-500/15 border-green-500/40 text-green-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <div className="font-semibold text-sm">{ct.label}</div>
              <div className="text-[10px] mt-0.5 opacity-70">{ct.desc}</div>
            </button>
          ))}
        </div>

        {/* Curve parameters */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Base EXP</label>
            <Input
              type="number"
              value={settings.level_curve_base}
              onChange={(e) => updateField('level_curve_base', parseInt(e.target.value) || 100)}
              className="bg-slate-900 border-slate-700"
            />
          </div>
          {settings.level_curve_type === 'exponential' && (
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Exponent</label>
              <Input
                type="number" step="0.1"
                value={settings.level_curve_exponent}
                onChange={(e) => updateField('level_curve_exponent', parseFloat(e.target.value) || 1.5)}
                className="bg-slate-900 border-slate-700"
              />
            </div>
          )}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Max Level</label>
            <Input
              type="number"
              value={settings.max_level}
              onChange={(e) => updateField('max_level', parseInt(e.target.value) || 50)}
              className="bg-slate-900 border-slate-700"
            />
          </div>
        </div>

        {/* Custom Table */}
        {settings.level_curve_type === 'custom' && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase">Custom Level Table</span>
              <Button size="sm" variant="outline" onClick={addTableRow}>
                <Plus className="w-3 h-3 mr-1" /> Add Level
              </Button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(settings.custom_level_table || []).map((row, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-cyan-400 text-xs font-mono w-12">Lv {row.level}</span>
                  <Input
                    type="number"
                    value={row.exp_required}
                    onChange={(e) => updateTableRow(idx, 'exp_required', parseInt(e.target.value) || 0)}
                    className="bg-slate-900 border-slate-700 flex-1 h-8 text-xs"
                    placeholder="EXP Required"
                  />
                  <span className="text-slate-500 text-xs">EXP</span>
                  <button onClick={() => removeTableRow(idx)} className="p-1 text-red-400 hover:text-red-300">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-3">
          <span className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Curve Preview (First 10 Levels)</span>
          <div className="flex gap-2 flex-wrap">
            {previewLevels().map(lv => (
              <div key={lv.level} className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center min-w-[60px]">
                <div className="text-cyan-400 text-[10px] font-mono">Lv {lv.level}</div>
                <div className="text-white text-xs font-bold">{lv.exp}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save */}
      <Button onClick={handleSave} disabled={saving} className="w-full bg-green-600 hover:bg-green-700 py-3 text-base">
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Save EXP &amp; Progression Settings
      </Button>
    </section>
  );
}