import React, { useEffect, useRef, useState } from 'react';
import { Mic, Search } from 'lucide-react';

export default function LibraryVoiceSearch({ value, onChange }) {
  const recognition = useRef(null);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => () => recognition.current?.abort(), []);
  const start = () => {
    if (listening) { recognition.current?.stop(); return; }
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) { setError('Voice search is unavailable in this browser. Type a game title instead.'); return; }
    setError('');
    const instance = new Speech();
    recognition.current = instance;
    instance.lang = navigator.language || 'en-US';
    instance.onresult = e => onChange(e.results[0][0].transcript.trim());
    instance.onerror = e => { setError(e.error === 'not-allowed' ? 'Allow microphone access to search by voice.' : 'Voice search could not hear you. Try again or type a title.'); setListening(false); };
    instance.onend = () => setListening(false);
    try { instance.start(); setListening(true); } catch { setError('Unable to start voice search. Please try again.'); }
  };
  return <div className="min-w-0 flex-1">
    <div className="flex items-center rounded-lg border border-current/20 px-2">
      <Search className="h-3 w-3 shrink-0" />
      <input aria-label="Search library games" value={value} onChange={e => onChange(e.target.value)} placeholder="Search games" className="min-w-0 w-full bg-transparent p-2 text-xs outline-none" />
      <button type="button" aria-label={listening ? 'Stop voice search' : 'Search games by voice'} aria-pressed={listening} onClick={start} className="p-1"><Mic className="h-3.5 w-3.5" /></button>
    </div>
    {(error || listening) && <p role="status" className="mt-1 text-xs">{error || 'Listening…'}</p>}
  </div>;
}