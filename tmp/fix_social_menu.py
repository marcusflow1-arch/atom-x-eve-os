from pathlib import Path

p = Path('src/components/dashboard/FocusModePanel.jsx')
s = p.read_text()

if "FriendTradePanel from '@/components/streaming/FriendTradePanel'" not in s:
    s = s.replace("import LiveIntelligenceFeed from './LiveIntelligenceFeed';\n", "import LiveIntelligenceFeed from './LiveIntelligenceFeed';\nimport FriendTradePanel from '@/components/streaming/FriendTradePanel';\n")

start = s.index('// Friend Reference - clickable friends that show join/invite options')
end = s.index('\nfunction HomeReference', start)
new = r'''// Friend Reference - clickable friends that show join/invite options
function FriendReference({ friend, isActive, isFriend, requestState, dashboardInviteState, partyInviteState, joining, onClick, onAddFriend, onMessage, onJoin, onInvite, onPartyInvite, onTrade }) {
  const anchorRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const placeMenu = (x, y) => {
    if (typeof window === 'undefined') return { top: 0, left: 0 };
    const width = 212;
    const height = 286;
    return {
      left: Math.max(8, Math.min(window.innerWidth - width - 8, x)),
      top: Math.max(8, Math.min(window.innerHeight - height - 8, y)),
    };
  };

  const openMenu = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    const rect = anchorRef.current?.getBoundingClientRect?.();
    const x = Number.isFinite(event?.clientX) && event.clientX > 0
      ? event.clientX
      : (rect ? rect.left + rect.width + 8 : 24);
    const y = Number.isFinite(event?.clientY) && event.clientY > 0
      ? event.clientY
      : (rect ? rect.top : 80);
    setMenuPosition(placeMenu(x, y));
    onClick(friend);
  };

  useEffect(() => {
    if (!isActive || typeof window === 'undefined') return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClick(null);
    };
    window.addEventListener('keydown', closeOnEscape, true);
    return () => window.removeEventListener('keydown', closeOnEscape, true);
  }, [isActive, onClick]);

  const actionHandlers = (action) => ({
    onPointerDown: (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
    },
    onMouseDown: (event) => {
      event.preventDefault();
      event.stopPropagation();
    },
    onClick: (event) => {
      event.preventDefault();
      event.stopPropagation();
      action?.(friend);
    },
  });

  const menuButton = 'pointer-events-auto cursor-pointer w-full rounded-lg px-3 py-2 text-left text-[10px] font-semibold text-white/72 transition-colors hover:bg-white/[0.09] focus-visible:bg-white/[0.09] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45';

  const menu = isActive && typeof document !== 'undefined' ? createPortal(
    <>
      <div
        className="fixed inset-0 pointer-events-auto"
        style={{ zIndex: 2147482998 }}
        onPointerDown={(event) => { event.preventDefault(); event.stopPropagation(); onClick(null); }}
        onContextMenu={(event) => { event.preventDefault(); event.stopPropagation(); onClick(null); }}
        data-luna-social-menu-backdrop="true"
      />
      <motion.div
        initial={{ opacity: 0, y: -5, scale: .96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -5, scale: .96 }}
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        onContextMenu={(event) => event.preventDefault()}
        className="fixed w-[212px] rounded-2xl border border-white/12 bg-[#090c11]/98 p-2 text-white shadow-2xl backdrop-blur-2xl pointer-events-auto"
        style={{ top: menuPosition.top, left: menuPosition.left, zIndex: 2147483000 }}
        data-luna-social-menu={friend.id}
        data-social-menu-ready="invite-join-message-friend-trade-party"
      >
        <div className="mb-1 border-b border-white/[0.06] px-2 py-2">
          <p className="truncate text-[10px] font-black text-white/90">{friend.name}</p>
          <p className="mt-0.5 text-[7px] uppercase tracking-[.16em] text-white/34">{isFriend ? 'Friend · online dashboard' : 'Online player'}</p>
        </div>

        <button type="button" disabled={dashboardInviteState === 'sending' || dashboardInviteState === 'sent'} {...actionHandlers(onInvite)} className={menuButton} data-social-action="invite-dashboard">
          {dashboardInviteState === 'sending' ? 'Sending Invite…' : dashboardInviteState === 'sent' ? 'Dashboard Invite Sent' : dashboardInviteState === 'error' ? 'Invite Failed · Retry' : 'Invite to Dashboard'}
        </button>
        <button type="button" disabled={joining} {...actionHandlers(onJoin)} className={`${menuButton} hover:bg-purple-400/[0.16]`} data-social-action="join-dashboard">
          {joining ? 'Joining Dashboard…' : 'Join Dashboard'}
        </button>
        <button type="button" {...actionHandlers(onMessage)} className={menuButton} data-social-action="message-player">
          Message
        </button>
        <button type="button" disabled={isFriend || requestState === 'sending' || requestState === 'sent' || requestState === 'friend'} {...actionHandlers(onAddFriend)} className={menuButton} data-social-action="add-friend">
          {isFriend || requestState === 'friend' ? 'Already Friends' : requestState === 'sending' ? 'Sending Request…' : requestState === 'sent' ? 'Friend Request Sent' : requestState === 'error' ? 'Request Failed · Retry' : 'Add as Friend'}
        </button>
        <button type="button" {...actionHandlers(onTrade)} className={`${menuButton} hover:bg-cyan-300/[0.12]`} data-social-action="trade-player">
          Trade
        </button>
        <button type="button" disabled={partyInviteState === 'sending' || partyInviteState === 'sent'} {...actionHandlers(onPartyInvite)} className={menuButton} data-social-action="invite-party">
          {partyInviteState === 'sending' ? 'Inviting to Party…' : partyInviteState === 'sent' ? 'Party Invite Sent' : partyInviteState === 'error' ? 'Party Invite Failed · Retry' : 'Invite to Party'}
        </button>
      </motion.div>
    </>,
    document.body,
  ) : null;

  return (
    <>
      <div ref={anchorRef} className={`relative pointer-events-auto ${isActive ? 'z-[10000]' : 'z-20'}`} onContextMenu={openMenu}>
        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onPointerDown={(event) => {
            if (event.button === 2) openMenu(event);
          }}
          onClick={openMenu}
          onContextMenu={openMenu}
          title="Right-click for invite, join, message, friend, trade, and party options"
          className={`relative block w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-all flex-shrink-0 bg-black/25 ${
            isActive ? 'border-white/45 shadow-[0_0_18px_rgba(226,232,240,0.16)]' : 'border-white/10 hover:border-white/30'
          }`}
          data-luna-presence-slot={friend.id}
        >
          <img src={friend.avatar} alt={friend.name} className="w-full h-full object-cover" draggable={false} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
          <div className="absolute bottom-1 left-1 right-1"><p className="text-white text-[7px] font-bold truncate text-center">{friend.name}</p></div>
          <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${friend.status === 'online' ? 'bg-green-500' : friend.status === 'away' ? 'bg-yellow-400' : 'bg-slate-500'}`} />
          {isFriend && <div className="absolute top-1 left-1 rounded bg-black/55 px-1 py-0.5 text-[6px] font-black uppercase tracking-wider text-white/65">Friend</div>}
        </motion.button>
      </div>
      <AnimatePresence>{menu}</AnimatePresence>
    </>
  );
}
'''
s = s[:start] + new + s[end:]
p.write_text(s)
