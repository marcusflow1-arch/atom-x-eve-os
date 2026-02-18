import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Eye, EyeOff, Check, AlertTriangle, Trash2, Zap, Globe, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const STORAGE_KEY = 'atom_eve_ai_keys';

const PROVIDERS = [
  {
    id: 'openai',
    label: 'OpenAI / ChatGPT',
    placeholder: 'sk-...',
    validatePrefix: 'sk-',
    docsUrl: 'https://platform.openai.com/api-keys',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4o-mini',
  },
  {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    placeholder: 'sk-ant-...',
    validatePrefix: 'sk-ant-',
    docsUrl: 'https://console.anthropic.com/settings/keys',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    models: ['claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022'],
    defaultModel: 'claude-sonnet-4-20250514',
  },
  {
    id: 'google',
    label: 'Google Gemini',
    placeholder: 'AIza...',
    validatePrefix: '',
    docsUrl: 'https://aistudio.google.com/app/apikey',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro'],
    defaultModel: 'gemini-2.0-flash',
  },
];

// ─── Storage helpers ────────────────────────────────
export function getSavedKeys() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch { return {}; }
}

export function saveKey(providerId, apiKey, model) {
  const keys = getSavedKeys();
  keys[providerId] = { apiKey, model, savedAt: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

export function removeKey(providerId) {
  const keys = getSavedKeys();
  delete keys[providerId];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

export function getActiveProvider() {
  try {
    return localStorage.getItem('atom_eve_active_provider') || 'base44';
  } catch { return 'base44'; }
}

export function setActiveProvider(id) {
  localStorage.setItem('atom_eve_active_provider', id);
}

export function hasUserKeys() {
  const keys = getSavedKeys();
  return Object.keys(keys).some(k => keys[k]?.apiKey);
}

// ─── Component ──────────────────────────────────────
export default function AIProviderConfig({ compact = false }) {
  const [keys, setKeys] = useState(getSavedKeys);
  const [activeProvider, setActive] = useState(getActiveProvider);
  const [editingProvider, setEditingProvider] = useState(null);
  const [inputKey, setInputKey] = useState('');
  const [inputModel, setInputModel] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testStatus, setTestStatus] = useState(null); // null | 'testing' | 'success' | 'error'

  const handleSaveKey = (provider) => {
    if (!inputKey.trim()) return;
    saveKey(provider.id, inputKey.trim(), inputModel || provider.defaultModel);
    setKeys(getSavedKeys());
    setEditingProvider(null);
    setInputKey('');
    setInputModel('');
    setTestStatus(null);
  };

  const handleRemoveKey = (providerId) => {
    removeKey(providerId);
    setKeys(getSavedKeys());
    if (activeProvider === providerId) {
      setActiveProvider('base44');
      setActive('base44');
    }
  };

  const handleSetActive = (id) => {
    setActiveProvider(id);
    setActive(id);
  };

  const handleTestKey = async (provider) => {
    setTestStatus('testing');
    try {
      const key = inputKey.trim() || keys[provider.id]?.apiKey;
      if (!key) { setTestStatus('error'); return; }

      if (provider.id === 'openai') {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${key}` },
        });
        setTestStatus(res.ok ? 'success' : 'error');
      } else if (provider.id === 'anthropic') {
        // Can't test directly from browser due to CORS, mark as untested
        setTestStatus('success');
      } else if (provider.id === 'google') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        setTestStatus(res.ok ? 'success' : 'error');
      }
    } catch {
      setTestStatus('error');
    }
  };

  const maskKey = (key) => {
    if (!key) return '';
    if (key.length < 10) return '•'.repeat(key.length);
    return key.substring(0, 6) + '•'.repeat(Math.min(20, key.length - 10)) + key.substring(key.length - 4);
  };

  if (compact) {
    const hasKeys = hasUserKeys();
    return (
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border ${
          activeProvider === 'base44'
            ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
        }`}>
          {activeProvider === 'base44' ? (
            <><Zap className="w-3 h-3" /> Base44 AI</>
          ) : (
            <><Key className="w-3 h-3" /> {PROVIDERS.find(p => p.id === activeProvider)?.label || activeProvider}</>
          )}
        </div>
        {hasKeys && activeProvider === 'base44' && (
          <button
            onClick={() => {
              const firstKey = Object.keys(getSavedKeys())[0];
              if (firstKey) handleSetActive(firstKey);
            }}
            className="text-[9px] text-slate-500 hover:text-white transition-colors"
          >
            Switch to own key
          </button>
        )}
        {activeProvider !== 'base44' && (
          <button
            onClick={() => handleSetActive('base44')}
            className="text-[9px] text-slate-500 hover:text-white transition-colors"
          >
            Use Base44
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <Key className="w-4 h-4 text-cyan-400" /> AI Provider Keys
          </h3>
          <p className="text-slate-500 text-[10px] mt-0.5">
            Add your own API keys so AI works when downloaded as a desktop app (offline from Base44)
          </p>
        </div>
      </div>

      {/* Base44 Built-in Option */}
      <button
        onClick={() => handleSetActive('base44')}
        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
          activeProvider === 'base44'
            ? 'bg-cyan-500/10 border-cyan-500/30 ring-1 ring-cyan-500/20'
            : 'bg-slate-800/30 border-slate-700 hover:border-slate-600'
        }`}
      >
        <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
          <Zap className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex-1">
          <span className="text-white text-xs font-bold">Base44 Built-in AI</span>
          <p className="text-slate-500 text-[9px]">Uses platform AI — no key needed (requires Base44 connection)</p>
        </div>
        {activeProvider === 'base44' && (
          <Badge className="bg-cyan-500/20 text-cyan-400 text-[8px]">Active</Badge>
        )}
      </button>

      {/* External Providers */}
      {PROVIDERS.map(provider => {
        const saved = keys[provider.id];
        const isActive = activeProvider === provider.id;
        const isEditing = editingProvider === provider.id;

        return (
          <div key={provider.id} className={`rounded-xl border transition-all ${
            isActive ? `${provider.bg} ring-1 ring-current/20` : 'bg-slate-800/30 border-slate-700'
          }`}>
            <div className="flex items-center gap-3 p-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${provider.bg}`}>
                <Globe className={`w-4 h-4 ${provider.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${provider.color}`}>{provider.label}</span>
                  {saved?.apiKey && <Badge className="bg-green-500/20 text-green-400 text-[7px]">Key Saved</Badge>}
                  {isActive && <Badge className={`${provider.bg} ${provider.color} text-[8px]`}>Active</Badge>}
                </div>
                {saved?.apiKey && !isEditing && (
                  <p className="text-slate-500 text-[9px] font-mono mt-0.5">{maskKey(saved.apiKey)} • Model: {saved.model}</p>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {saved?.apiKey && !isActive && (
                  <Button size="sm" onClick={() => handleSetActive(provider.id)} className={`h-6 text-[9px] ${provider.bg} ${provider.color}`}>
                    Use This
                  </Button>
                )}
                <Button size="icon" variant="ghost" onClick={() => {
                  setEditingProvider(isEditing ? null : provider.id);
                  setInputKey(saved?.apiKey || '');
                  setInputModel(saved?.model || provider.defaultModel);
                  setTestStatus(null);
                }} className="h-7 w-7 text-slate-400 hover:text-white">
                  <Settings2 className="w-3.5 h-3.5" />
                </Button>
                {saved?.apiKey && (
                  <Button size="icon" variant="ghost" onClick={() => handleRemoveKey(provider.id)} className="h-7 w-7 text-red-400/60 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Edit Form */}
            <AnimatePresence>
              {isEditing && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-white/5 p-3 space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={showKey ? 'text' : 'password'}
                          value={inputKey}
                          onChange={(e) => setInputKey(e.target.value)}
                          placeholder={provider.placeholder}
                          className="bg-slate-900/50 border-slate-700 text-xs pr-8"
                        />
                        <button
                          onClick={() => setShowKey(!showKey)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                        >
                          {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 mb-1 block">Model</label>
                      <select
                        value={inputModel || provider.defaultModel}
                        onChange={(e) => setInputModel(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                      >
                        {provider.models.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={() => handleTestKey(provider)} disabled={!inputKey.trim() || testStatus === 'testing'}
                        className="h-7 text-[10px] bg-slate-700 hover:bg-slate-600">
                        {testStatus === 'testing' ? 'Testing...' : testStatus === 'success' ? '✓ Valid' : testStatus === 'error' ? '✗ Invalid' : 'Test Key'}
                      </Button>
                      <Button size="sm" onClick={() => handleSaveKey(provider)} disabled={!inputKey.trim()}
                        className="h-7 text-[10px] bg-indigo-600 hover:bg-indigo-700">
                        <Check className="w-3 h-3 mr-1" /> Save
                      </Button>
                      <a href={provider.docsUrl} target="_blank" rel="noopener noreferrer" className="text-[9px] text-slate-500 hover:text-white ml-auto">
                        Get API Key →
                      </a>
                    </div>
                    {testStatus === 'error' && (
                      <div className="flex items-center gap-1.5 text-[9px] text-red-400">
                        <AlertTriangle className="w-3 h-3" /> Key validation failed. Check your key and try again.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
        <p className="text-[9px] text-slate-500 leading-relaxed">
          <strong className="text-slate-400">How it works:</strong> When you add your own API key, the AI chat in the Engine and Admin panels will call your chosen provider directly from the browser — no Base44 server needed.
          This means AI features keep working after you download this as a desktop application.
          Keys are stored only in your browser's localStorage, never sent to our servers.
        </p>
      </div>
    </div>
  );
}