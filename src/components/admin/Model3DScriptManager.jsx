import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code, Trash2, Loader2, Plus, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function Model3DScriptManager() {
  const queryClient = useQueryClient();
  const [showNewForm, setShowNewForm] = useState(false);
  const [expandedScripts, setExpandedScripts] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editCode, setEditCode] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const [newScript, setNewScript] = useState({
    name: '',
    description: '',
    model_reference: '',
    page_location: '',
    script_code: '',
    model_url: '',
    script_type: 'general',
    is_active: true
  });

  const { data: scripts = [], isLoading } = useQuery({
    queryKey: ['model3DScripts'],
    queryFn: () => base44.entities.Model3DScript.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Model3DScript.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model3DScripts'] });
      setNewScript({
        name: '', description: '', model_reference: '', page_location: '',
        script_code: '', model_url: '', script_type: 'general', is_active: true
      });
      setShowNewForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Model3DScript.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['model3DScripts'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Model3DScript.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['model3DScripts'] }),
  });

  const handleCreate = () => {
    if (!newScript.name || !newScript.model_reference || !newScript.script_code) {
      alert('Name, model reference, and script code are required');
      return;
    }
    createMutation.mutate(newScript);
  };

  const handleCopy = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const scriptTypeColors = {
    animation: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    behavior: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    shader: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    interaction: 'bg-green-500/20 text-green-400 border-green-500/30',
    general: 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  };

  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Code className="w-6 h-6 text-green-500" />
            3D Model Scripts & Code
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Manage JavaScript/Three.js code for 3D models across your app
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-slate-400 border-slate-700">
            {scripts.length} Scripts
          </Badge>
          <Button
            onClick={() => setShowNewForm(!showNewForm)}
            className="bg-green-600 hover:bg-green-700"
          >
            {showNewForm ? <ChevronUp className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {showNewForm ? 'Close' : 'New Script'}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showNewForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6 overflow-hidden"
          >
            <h3 className="font-semibold mb-4 text-white">Create New 3D Model Script</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Input
                placeholder="Script name"
                value={newScript.name}
                onChange={(e) => setNewScript({ ...newScript, name: e.target.value })}
                className="bg-slate-900 border-slate-700"
              />
              <Input
                placeholder="Model reference (e.g., 'Y Bot')"
                value={newScript.model_reference}
                onChange={(e) => setNewScript({ ...newScript, model_reference: e.target.value })}
                className="bg-slate-900 border-slate-700"
              />
            </div>
            <Textarea
              placeholder="JavaScript/Three.js code..."
              value={newScript.script_code}
              onChange={(e) => setNewScript({ ...newScript, script_code: e.target.value })}
              className="bg-slate-900 border-slate-700 mb-4 h-48 font-mono text-sm"
            />
            <div className="flex gap-3">
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Create Script
              </Button>
              <Button variant="outline" onClick={() => setShowNewForm(false)} className="border-slate-700">
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {isLoading ? (
          <div className="text-center py-12 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
            Loading scripts...
          </div>
        ) : scripts.map((script) => (
          <motion.div
            key={script.id}
            layout
            className={`bg-slate-800/50 border rounded-xl overflow-hidden ${script.is_active ? 'border-green-500/30' : 'border-slate-700'}`}
          >
            <div className="p-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-white truncate">{script.name}</h4>
                  <Badge className={scriptTypeColors[script.script_type]}>{script.script_type}</Badge>
                </div>
                <p className="text-xs text-slate-400">Model: {script.model_reference} • {script.page_location}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="ghost" onClick={() => handleCopy(script.script_code, script.id)}>
                   {copiedId === script.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Switch
                  checked={script.is_active}
                  onCheckedChange={() => updateMutation.mutate({ id: script.id, data: { is_active: !script.is_active } })}
                />
                <Button size="icon" variant="ghost" onClick={() => setExpandedScripts(prev => ({ ...prev, [script.id]: !prev[script.id] }))}>
                   {expandedScripts[script.id] ? <ChevronUp /> : <ChevronDown />}
                </Button>
                <Button size="icon" variant="ghost" className="text-red-400" onClick={() => deleteMutation.mutate(script.id)}>
                   <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <AnimatePresence>
              {expandedScripts[script.id] && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="border-t border-slate-700 p-4 bg-black/20">
                   <pre className="text-xs text-green-400 font-mono overflow-x-auto">{script.script_code}</pre>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </section>
  );
}