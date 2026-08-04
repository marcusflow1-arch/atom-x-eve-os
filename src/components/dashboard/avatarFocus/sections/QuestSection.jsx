import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Plus, Check, RotateCcw, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import SectionShell, { glassCard, EmptyState, LoadingState } from '../SectionShell';

const PRIORITY_COLOR = { high: '#f87171', medium: '#facc15', low: '#4ade80' };

// Quest Log — real UserTask backend: list, create, complete / reopen
export default function QuestSection({ accent }) {
  const { user } = useAuth();
  const [quests, setQuests] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user?.id) return;
    const rows = await base44.entities.UserTask.filter({ user_id: user.id }, '-created_date', 100);
    setQuests(rows);
  };
  useEffect(() => { load(); }, [user?.id]);

  const addQuest = async () => {
    const title = newTitle.trim();
    if (!title || saving) return;
    setSaving(true);
    await base44.entities.UserTask.create({ user_id: user.id, title, status: 'pending', priority: 'medium', created_by: 'user' });
    setNewTitle('');
    setSaving(false);
    load();
  };

  const toggle = async (q) => {
    const status = q.status === 'completed' ? 'pending' : 'completed';
    setQuests((prev) => prev.map((x) => (x.id === q.id ? { ...x, status } : x)));
    await base44.entities.UserTask.update(q.id, { status });
  };

  if (quests === null) return <LoadingState />;
  const active = quests.filter((q) => q.status !== 'completed' && q.status !== 'cancelled');
  const done = quests.filter((q) => q.status === 'completed');

  const QuestCard = ({ q, i }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
      className="p-4 flex items-center gap-3" style={glassCard(q.status === 'completed' ? 'rgba(74,222,128,0.25)' : 'rgba(250,204,21,0.25)')}
    >
      <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ background: PRIORITY_COLOR[q.priority] || PRIORITY_COLOR.medium }} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${q.status === 'completed' ? 'text-white/40 line-through' : 'text-white'}`}>{q.title}</p>
        <p className="text-white/35 text-[10px] uppercase tracking-wider mt-0.5">
          {q.priority} priority{q.created_by === 'ai' ? ' · AI issued' : ''}{q.due_date ? ` · due ${new Date(q.due_date).toLocaleDateString()}` : ''}
        </p>
      </div>
      <button
        onClick={() => toggle(q)}
        className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
          q.status === 'completed'
            ? 'border-white/15 text-white/40 hover:text-white hover:bg-white/10'
            : 'border-green-400/40 text-green-300 hover:bg-green-500/20'
        }`}
        title={q.status === 'completed' ? 'Reopen quest' : 'Complete quest'}
      >
        {q.status === 'completed' ? <RotateCcw className="w-3.5 h-3.5" /> : <Check className="w-4 h-4" />}
      </button>
    </motion.div>
  );

  return (
    <SectionShell
      title="Quest Log" accent={accent}
      subtitle="Your personal objectives across the Atom X Eve system"
      actions={
        <div className="flex items-center gap-2 px-3 py-2" style={glassCard()}>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addQuest()}
            placeholder="New quest objective..."
            className="bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none w-56"
          />
          <button onClick={addQuest} className="w-7 h-7 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/35 border border-yellow-400/40 flex items-center justify-center text-yellow-300 transition-all">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
      }
    >
      {quests.length === 0 ? (
        <EmptyState icon={Trophy} message="No quests yet — add your first objective above." />
      ) : (
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-yellow-300/80 text-[11px] font-bold uppercase tracking-[0.25em] mb-3">Active — {active.length}</h3>
            <div className="space-y-2.5">{active.map((q, i) => <QuestCard key={q.id} q={q} i={i} />)}</div>
          </div>
          <div>
            <h3 className="text-green-300/80 text-[11px] font-bold uppercase tracking-[0.25em] mb-3">Completed — {done.length}</h3>
            <div className="space-y-2.5">{done.map((q, i) => <QuestCard key={q.id} q={q} i={i} />)}</div>
          </div>
        </div>
      )}
    </SectionShell>
  );
}