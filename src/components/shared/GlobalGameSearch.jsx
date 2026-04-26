import React, { useRef } from 'react';
import { Search } from 'lucide-react';

/**
 * GlobalGameSearch — a lightweight search pill that, when clicked/focused,
 * fires a global event to open the LunaBottomNav Library panel (with the full
 * Gaming Studios top panel + game grid) on whichever page it's on.
 *
 * The optional `searchTerm` prop is forwarded so LunaBottomNav can pre-filter
 * the library to the typed query.
 */
export default function GlobalGameSearch() {
  const inputRef = useRef(null);

  const handleFocus = () => {
    // Tell LunaBottomNav to open its library tab
    window.dispatchEvent(new CustomEvent('globalSearchOpen'));
    // Immediately blur so the real search input inside LunaBottomNav takes over
    inputRef.current?.blur();
  };

  const handleChange = (e) => {
    const value = e.target.value;
    // Forward typed text to LunaBottomNav's search filter
    window.dispatchEvent(new CustomEvent('globalSearchChange', { detail: { value } }));
    // Also open the panel if not already open
    window.dispatchEvent(new CustomEvent('globalSearchOpen'));
    inputRef.current?.blur();
  };

  return (
    <div className="relative flex-shrink-0">
      <div
        className="flex items-center gap-2 rounded-full px-3 py-1.5 cursor-pointer transition-all hover:border-white/25 focus-within:border-white/25"
        style={{
          background: 'rgba(0,0,0,0.30)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.10)',
          minWidth: '200px',
        }}
        onClick={handleFocus}
      >
        <Search className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search games..."
          onChange={handleChange}
          onFocus={handleFocus}
          className="bg-transparent border-none outline-none text-xs text-white placeholder:text-white/30 w-full cursor-pointer"
        />
      </div>
    </div>
  );
}