import { useEffect, useRef, useState } from 'react';
import { Mic, Search } from 'lucide-react';

export default function LibraryVoiceSearch({ value, onChange, subject = 'games', label, placeholder, VoiceIcon = Mic }) {
  const recognition = useRef(null), changeRef = useRef(onChange);
  changeRef.current = onChange;
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => () => {
    const current = recognition.current;
    if (current) { current.onresult = null; current.onerror = null; current.onend = null; current.abort(); }
  }, []);
  const start = () => {
    if (listening) { recognition.current?.stop(); return; }
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) { setError('Voice search is unavailable in this browser. You can type your search.'); return; }
    setError('');
    const instance = new Speech();
    recognition.current = instance;
    instance.lang = navigator.language || 'en-US';
    instance.onresult = (event) => changeRef.current(event.results[0][0].transcript.trim());
    instance.onerror = (event) => { setError(event.error === 'not-allowed' ? 'Allow microphone access to search by voice.' : 'Voice search could not hear you. Try again or type a name.'); setListening(false); };
    instance.onend = () => setListening(false);
    try { instance.start(); setListening(true); } catch { setError('Unable to start voice search. Please try again.'); }
  };
  return <div className="ll-voice-search">
    <div className="ll-search-line"><Search aria-hidden="true" /><input type="search" aria-label={label || `Search library ${subject}`} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder || `Search ${subject}`} autoComplete="off" /><button type="button" title={listening ? 'Stop voice search' : 'Voice search'} aria-label={listening ? 'Stop voice search' : `Search ${subject} by voice`} aria-pressed={listening} onClick={start}><VoiceIcon size={14} /></button></div>
    {(error || listening) && <p role="status" className="ll-search-note">{error || 'Listening…'}</p>}
  </div>;
}