import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, Wifi, WifiOff, Play, Send, Terminal, FolderOpen,
  FileCode, RefreshCw, Loader2, CheckCircle2, XCircle,
  ChevronRight, Trash2, Settings2, Copy, Download,
  HardDrive, ShieldAlert, ScanSearch, Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { showSuccess, showError, showInfo } from '@/components/error/ErrorToast';
import UnrealBridgeStatus from './UnrealBridgeStatus';

const BRIDGE_URL_KEY = 'unreal_bridge_url';
const DEFAULT_URL = 'http://localhost:5000';

const QUICK_COMMANDS = [
  { label: 'List Projects', command: 'list_projects', icon: FolderOpen, description: 'Show all Unreal projects' },
  { label: 'List Assets', command: 'list_assets', icon: FileCode, description: 'Browse project assets', params: { path: '/Game' } },
  { label: 'Engine Version', command: 'engine_info', icon: Cpu, description: 'Get Unreal Engine version' },
  { label: 'Create Blueprint', command: 'create_blueprint', icon: Play, description: 'Create a new Blueprint', params: { name: 'NewBP', folder: '/Game/Blueprints' } },
];

export default function UnrealBridgePanel() {
  const [bridgeUrl, setBridgeUrl] = useState(() => localStorage.getItem(BRIDGE_URL_KEY) || DEFAULT_URL);
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(false);
  const [bridgeInfo, setBridgeInfo] = useState(null);
  const [commandInput, setCommandInput] = useState('');
  const [commandParams, setCommandParams] = useState('{}');
  const [commandLog, setCommandLog] = useState([]);
  const [sending, setSending] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Local File System State
  const [projectHandle, setProjectHandle] = useState(null);
  const [scannedFiles, setScannedFiles] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [strictMode, setStrictMode] = useState(false);

  const logEndRef = useRef(null);

  // Auto-scroll log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [commandLog]);

  // Persist URL
  useEffect(() => {
    localStorage.setItem(BRIDGE_URL_KEY, bridgeUrl);
  }, [bridgeUrl]);

  const checkConnection = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch(`${bridgeUrl}/status`, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        setConnected(true);
        setBridgeInfo(data);
        addLog('system', `Connected to Unreal Bridge at ${bridgeUrl}`, data);
      } else {
        setConnected(false);
        setBridgeInfo(null);
        addLog('error', `Bridge responded with status ${res.status}`);
      }
    } catch (err) {
      setConnected(false);
      setBridgeInfo(null);
      // Don't show error toast on auto-check, just log it
      addLog('error', `Cannot reach bridge at ${bridgeUrl} — ${err.message}`);
    }
    setChecking(false);
  }, [bridgeUrl]);

  // Check on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const addLog = (type, message, data = null) => {
    setCommandLog(prev => [...prev.slice(-50), {
      id: Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      type, // 'system' | 'command' | 'response' | 'error'
      message,
      data,
      timestamp: new Date(),
    }]);
  };

  const sendCommand = async (command, params = {}) => {
    if (!connected) {
      showError('Not connected to Unreal Bridge');
      return;
    }
    setSending(true);
    addLog('command', `→ ${command}`, params);

    try {
      const res = await fetch(`${bridgeUrl}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, params }),
        signal: AbortSignal.timeout(30000),
      });
      const data = await res.json();
      if (res.ok) {
        addLog('response', `← ${command} completed`, data);
      } else {
        addLog('error', `← ${command} failed: ${data.error || res.statusText}`, data);
      }
    } catch (err) {
      addLog('error', `← ${command} failed: ${err.message}`);
    }
    setSending(false);
  };

  const handleCustomCommand = () => {
    if (!commandInput.trim()) return;
    let params = {};
    try {
      params = JSON.parse(commandParams);
    } catch {
      showError('Invalid JSON in params field');
      return;
    }
    sendCommand(commandInput.trim(), params);
    setCommandInput('');
  };

  const copyLog = () => {
    const text = commandLog.map(l => `[${l.type}] ${l.message}${l.data ? '\n' + JSON.stringify(l.data, null, 2) : ''}`).join('\n\n');
    navigator.clipboard.writeText(text);
    showSuccess('Log copied to clipboard');
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <Cpu className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-xs">Unreal Bridge</h3>
            <p className="text-white/30 text-[9px]">Local Engine Automation</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <UnrealBridgeStatus connected={connected} checking={checking} info={bridgeInfo} />
          <Button size="icon" variant="ghost" onClick={() => setShowSettings(!showSettings)} className="h-6 w-6">
            <Settings2 className="w-3 h-3 text-white/40" />
          </Button>
          <Button size="icon" variant="ghost" onClick={checkConnection} disabled={checking} className="h-6 w-6">
            <RefreshCw className={`w-3 h-3 text-white/40 ${checking ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-white/10"
          >
            <div className="p-3 space-y-2">
              <label className="text-white/40 text-[9px] font-bold uppercase tracking-wider">Bridge URL</label>
              <div className="flex gap-1.5">
                <Input
                  value={bridgeUrl}
                  onChange={e => setBridgeUrl(e.target.value)}
                  placeholder="http://localhost:5000"
                  className="h-7 text-xs bg-white/5 border-white/10"
                />
                <Button size="sm" onClick={checkConnection} disabled={checking} className="h-7 text-[10px]">
                  {checking ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Test'}
                </Button>
              </div>
              <p className="text-white/20 text-[9px]">
                The bridge service must be running on your PC. <a href="#setup" className="text-cyan-400 hover:underline" onClick={(e) => { e.preventDefault(); addLog('system', SETUP_GUIDE); }}>View setup guide</a>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Commands */}
      {connected && (
        <div className="p-3 border-b border-white/10">
          <p className="text-white/30 text-[9px] font-bold uppercase tracking-wider mb-2">Quick Commands</p>
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_COMMANDS.map(cmd => (
              <button
                key={cmd.command}
                onClick={() => sendCommand(cmd.command, cmd.params || {})}
                disabled={sending}
                className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12] transition-all text-left group"
              >
                <cmd.icon className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-white text-[10px] font-medium truncate">{cmd.label}</p>
                  <p className="text-white/30 text-[8px] truncate">{cmd.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Not Connected State */}
      {!connected && !checking && (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <WifiOff className="w-10 h-10 text-white/10 mx-auto" />
            <div>
              <p className="text-white/60 text-sm font-medium">Bridge Not Connected</p>
              <p className="text-white/30 text-xs mt-1 max-w-[250px]">
                Start the UnrealBridge service on your PC to connect. It listens on <code className="text-cyan-400/60">{bridgeUrl}</code>
              </p>
            </div>
            <Button size="sm" onClick={() => { setShowSettings(true); }} className="text-xs">
              <Settings2 className="w-3 h-3 mr-1" /> Configure
            </Button>
            <div className="pt-2">
              <button
                onClick={() => addLog('system', SETUP_GUIDE)}
                className="text-cyan-400/60 text-[10px] hover:text-cyan-400 transition-colors"
              >
                How to set up the bridge →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Command Log */}
      {(connected || commandLog.length > 0) && (
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0">
          {commandLog.length === 0 && (
            <div className="text-center py-8">
              <Terminal className="w-8 h-8 text-white/10 mx-auto mb-2" />
              <p className="text-white/30 text-xs">Send a command to get started</p>
            </div>
          )}
          {commandLog.map(entry => (
            <LogEntry key={entry.id} entry={entry} />
          ))}
          <div ref={logEndRef} />
        </div>
      )}

      {/* Command Input */}
      {connected && (
        <div className="p-2 border-t border-white/10 space-y-1.5">
          <div className="flex gap-1.5">
            <Input
              value={commandInput}
              onChange={e => setCommandInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCustomCommand()}
              placeholder="Command (e.g. create_blueprint)"
              className="h-7 text-xs bg-white/5 border-white/10 flex-1"
            />
            <Button size="icon" onClick={handleCustomCommand} disabled={sending || !commandInput.trim()} className="h-7 w-7">
              {sending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            </Button>
          </div>
          <Input
            value={commandParams}
            onChange={e => setCommandParams(e.target.value)}
            placeholder='Params JSON: {"name": "MyBP"}'
            className="h-6 text-[10px] bg-white/[0.03] border-white/[0.05] font-mono"
          />
          <div className="flex items-center justify-between">
            <p className="text-white/20 text-[8px]">Commands are sent to your local Unreal Bridge</p>
            <div className="flex gap-1">
              <button onClick={copyLog} className="text-white/20 hover:text-white/50 transition-colors">
                <Copy className="w-3 h-3" />
              </button>
              <button onClick={() => setCommandLog([])} className="text-white/20 hover:text-white/50 transition-colors">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LogEntry({ entry }) {
  const [expanded, setExpanded] = useState(false);
  const colors = {
    system: 'text-cyan-400/70',
    command: 'text-amber-400/70',
    response: 'text-green-400/70',
    error: 'text-red-400/70',
  };
  const icons = {
    system: CheckCircle2,
    command: ChevronRight,
    response: CheckCircle2,
    error: XCircle,
  };
  const Icon = icons[entry.type] || Terminal;

  return (
    <div
      className={`rounded-lg p-2 text-[10px] font-mono border transition-colors cursor-pointer ${
        entry.type === 'error' ? 'bg-red-500/5 border-red-500/10' :
        entry.type === 'response' ? 'bg-green-500/5 border-green-500/10' :
        entry.type === 'command' ? 'bg-amber-500/5 border-amber-500/10' :
        'bg-white/[0.02] border-white/[0.05]'
      }`}
      onClick={() => entry.data && setExpanded(!expanded)}
    >
      <div className="flex items-start gap-1.5">
        <Icon className={`w-3 h-3 flex-shrink-0 mt-0.5 ${colors[entry.type]}`} />
        <div className="flex-1 min-w-0">
          <p className={`${colors[entry.type]} break-words whitespace-pre-wrap`}>{entry.message}</p>
          <p className="text-white/15 text-[8px] mt-0.5">
            {entry.timestamp.toLocaleTimeString()}
          </p>
        </div>
        {entry.data && (
          <ChevronRight className={`w-3 h-3 text-white/20 flex-shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        )}
      </div>
      <AnimatePresence>
        {expanded && entry.data && (
          <motion.pre
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-2 p-2 rounded bg-black/30 text-white/50 text-[9px] overflow-x-auto whitespace-pre-wrap break-all"
          >
            {typeof entry.data === 'string' ? entry.data : JSON.stringify(entry.data, null, 2)}
          </motion.pre>
        )}
      </AnimatePresence>
    </div>
  );
}

const SETUP_GUIDE = `═══ UNREAL BRIDGE SETUP GUIDE ═══

The Unreal Bridge is a small local service that runs on your PC and lets this web app communicate with your Unreal Engine installation.

── ARCHITECTURE ──
Base44 Web App  →  localhost:5000  →  UnrealBridge.exe  →  Unreal Engine

── REQUIREMENTS ──
• Unreal Engine 5.x installed
• Python 3.10+ (for the bridge service)
• Unreal Python plugin enabled

── SETUP STEPS ──

1. Enable Unreal Python Plugin:
   Edit → Plugins → search "Python" → enable "Python Editor Script Plugin"
   Restart Unreal Editor

2. Enable Remote Control API:
   Edit → Plugins → search "Remote Control" → enable it
   Restart Unreal Editor

3. Install the Bridge Service:
   pip install flask unreal-bridge-service

4. Start the Bridge:
   unreal-bridge --port 5000 --project "C:/YourProject/YourProject.uproject"

5. Connect from this panel:
   Set the URL to http://localhost:5000 and click Test

── SUPPORTED COMMANDS ──
• list_projects     — List discovered Unreal projects
• list_assets       — Browse assets in a project folder  
• engine_info       — Get Unreal Engine version/config
• create_blueprint  — Create a new Blueprint asset
• run_python        — Execute Python script in Unreal Editor
• package_project   — Trigger project packaging
• export_asset      — Export an asset for use elsewhere

── SECURITY ──
The bridge only listens on localhost — it's not accessible from the internet.
All commands require the bridge to be running on your machine.`;