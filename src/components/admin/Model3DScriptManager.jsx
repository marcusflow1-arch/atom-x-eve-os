import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Code, Trash2, Play, Loader2, Box, FileCode, Eye, Plus, ChevronDown, ChevronUp } from 'lucide-react';
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
        name: '',
        description: '',
        model_reference: '',
        page_location: '',
        script_code: '',
        model_url: '',
        script_type: 'general',
        is_active: true
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

  const toggleActive = (script) => {
    updateMutation.mutate({ id: script.id, data: { is_active: !script.is_active } });
  };

  const deleteScript = (id) => {
    if (confirm('Are you sure you want to delete this script?')) {
      deleteMutation.mutate(id);
    }
  };

  const toggleExpanded = (id) => {
    setExpandedScripts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const startEditing = (script) => {
    setEditingId(script.id);
    setEditCode(script.script_code);
  };

  const saveEdit = (id) => {
    updateMutation.mutate({ id, data: { script_code: editCode } });
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditCode('');
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
          <Badge variant="outline" className="text-slate-400">
            {scripts.length} Scripts
          </Badge>
          <Button
            onClick={() => setShowNewForm(!showNewForm)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Script
          </Button>
        </div>
      </div>

      {/* New Script Form */}
      <AnimatePresence>
        {showNewForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6"
          >
            <h3 className="font-semibold mb-4">Create New 3D Model Script</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Input
                placeholder="Script name"
                value={newScript.name}
                onChange={(e) => setNewScript({ ...newScript, name: e.target.value })}
                className="bg-slate-900 border-slate-700"
              />
              <Input
                placeholder="Model reference (e.g., 'Y Bot', 'Luna Dashboard')"
                value={newScript.model_reference}
                onChange={(e) => setNewScript({ ...newScript, model_reference: e.target.value })}
                className="bg-slate-900 border-slate-700"
              />
              <Input
                placeholder="Page location (e.g., 'LunaTemplate', 'Dashboard')"
                value={newScript.page_location}
                onChange={(e) => setNewScript({ ...newScript, page_location: e.target.value })}
                className="bg-slate-900 border-slate-700"
              />
              <Input
                placeholder="Model URL (optional)"
                value={newScript.model_url}
                onChange={(e) => setNewScript({ ...newScript, model_url: e.target.value })}
                className="bg-slate-900 border-slate-700"
              />
            </div>
            <Textarea
              placeholder="Description..."
              value={newScript.description}
              onChange={(e) => setNewScript({ ...newScript, description: e.target.value })}
              className="bg-slate-900 border-slate-700 mb-4 h-20"
            />
            <div className="flex items-center gap-4 mb-4">
              <select
                value={newScript.script_type}
                onChange={(e) => setNewScript({ ...newScript, script_type: e.target.value })}
                className="bg-slate-900 border border-slate-700 text-white rounded-md px-3 py-2 text-sm"
              >
                <option value="general">General</option>
                <option value="animation">Animation</option>
                <option value="behavior">Behavior</option>
                <option value="shader">Shader</option>
                <option value="interaction">Interaction</option>
              </select>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">Active:</span>
                <Switch
                  checked={newScript.is_active}
                  onCheckedChange={(checked) => setNewScript({ ...newScript, is_active: checked })}
                />
              </div>
            </div>
            <Textarea
              placeholder="JavaScript/Three.js code..."
              value={newScript.script_code}
              onChange={(e) => setNewScript({ ...newScript, script_code: e.target.value })}
              className="bg-slate-900 border-slate-700 mb-4 h-64 font-mono text-sm"
            />
            <div className="flex gap-3">
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                <Plus className="w-4 h-4 mr-2" /> Create Script
              </Button>
              <Button variant="outline" onClick={() => setShowNewForm(false)}>
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scripts List */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
          Loading scripts...
        </div>
      ) : scripts.length === 0 ? (
        <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
          <Code className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No 3D model scripts created yet</p>
          <p className="text-sm">Click "New Script" to add your first script</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {scripts.map((script) => {
              const isExpanded = expandedScripts[script.id];
              return (
                <motion.div
                  key={script.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`bg-slate-800/50 border rounded-xl overflow-hidden ${
                    script.is_active ? 'border-green-500/30' : 'border-slate-700'
                  }`}
                >
                  {/* Header */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-white truncate">{script.name}</h4>
                        <Badge className={scriptTypeColors[script.script_type]}>
                          {script.script_type}
                        </Badge>
                        {script.is_active && (
                          <Badge className="bg-green-600 text-white text-xs">Active</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>Model: {script.model_reference}</span>
                        {script.page_location && (
                          <>
                            <span>•</span>
                            <span>Page: {script.page_location}</span>
                          </>
                        )}
                      </div>
                      {script.description && (
                        <p className="text-slate-500 text-sm mt-1 line-clamp-1">{script.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => toggleExpanded(script.id)}
                        className="text-slate-400 hover:text-white"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={script.is_active}
                          onCheckedChange={() => toggleActive(script)}
                        />
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => deleteScript(script.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Code View */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-700"
                      >
                        <div className="p-4 bg-slate-900/50">
                          {script.model_url && (
                            <div className="mb-3">
                              <p className="text-xs text-slate-400 mb-1">Model URL:</p>
                              <a 
                                href={script.model_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-400 hover:text-blue-300 break-all"
                              >
                                {script.model_url}
                              </a>
                            </div>
                          )}
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-slate-400">Script Code:</p>
                            {editingId === script.id ? (
                              <div className="flex gap-2">
                                <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                                <Button size="sm" onClick={() => saveEdit(script.id)} className="bg-green-600 hover:bg-green-700">Save Changes</Button>
                              </div>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => startEditing(script)}>Edit Code</Button>
                            )}
                          </div>
                          {editingId === script.id ? (
                            <Textarea
                              value={editCode}
                              onChange={(e) => setEditCode(e.target.value)}
                              className="bg-black/40 border-slate-700 font-mono text-xs text-green-400 min-h-[300px]"
                            />
                          ) : (
                            <pre className="bg-black/40 border border-slate-700 rounded-lg p-4 overflow-x-auto text-xs text-green-400 font-mono max-h-96 overflow-y-auto">
                              {script.script_code}
                            </pre>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
}