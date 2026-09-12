import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';

// FocusModePanel's five friend-presence cells are still an internal legacy
// component. This bridge augments those existing cells in-place so we do not
// duplicate or replace their Join / Invite / Party behavior.
const SLOT_SELECTOR = 'div.relative.w-16.h-16.rounded-lg.overflow-hidden.cursor-pointer';

export default function LunaPresenceMessageBridge() {
  const { user } = useAuth();

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    let disposed = false;

    const resolveFriend = async (name, avatar) => {
      if (!name) return null;
      try {
        if (user?.id) {
          const friends = await base44.entities.Friend.filter({ user_id: user.id });
          const exact = (friends || []).find((friend) =>
            String(friend.friend_name || '').trim().toLowerCase() === String(name).trim().toLowerCase()
          );
          if (exact) return exact;
        }
      } catch {}

      try {
        const players = await base44.entities.PlayerState.list();
        const player = (players || []).find((entry) =>
          String(entry.display_name || '').trim().toLowerCase() === String(name).trim().toLowerCase()
        );
        if (player?.player_id) {
          return {
            id: player.player_id,
            friend_id: player.player_id,
            friend_name: player.display_name || name,
            friend_avatar: player.avatar_url || avatar || '',
            status: player.status || 'online',
            current_game: player.channel_id?.startsWith('dashboard_') ? 'Dashboard' : player.channel_id,
          };
        }
      } catch {}

      return {
        id: name,
        friend_id: name,
        friend_name: name,
        friend_avatar: avatar || '',
        status: 'online',
      };
    };

    const enhanceSlot = (slot) => {
      if (!(slot instanceof HTMLElement) || slot.dataset.lunaMessageEnhanced === 'true') return;
      const image = slot.querySelector('img[alt]');
      if (!image?.getAttribute('alt')) return;

      slot.dataset.lunaMessageEnhanced = 'true';
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.lunaMessageButton = 'true';
      button.setAttribute('aria-label', `Message ${image.getAttribute('alt')}`);
      button.title = `Message ${image.getAttribute('alt')}`;
      button.textContent = '✉';
      Object.assign(button.style, {
        position: 'absolute',
        left: '4px',
        top: '4px',
        zIndex: '8',
        width: '20px',
        height: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(255,255,255,0.25)',
        borderRadius: '5px',
        background: 'rgba(5,12,18,0.72)',
        color: '#a5f3fc',
        fontSize: '11px',
        lineHeight: '1',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        cursor: 'pointer',
        boxShadow: '0 0 12px rgba(34,211,238,0.14)',
      });

      button.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const currentImage = slot.querySelector('img[alt]');
        const friend = await resolveFriend(currentImage?.getAttribute('alt'), currentImage?.getAttribute('src'));
        if (!disposed && friend) {
          window.dispatchEvent(new CustomEvent('openLunaMessages', { detail: { friend } }));
        }
      });
      slot.appendChild(button);
    };

    const scan = () => document.querySelectorAll(SLOT_SELECTOR).forEach(enhanceSlot);
    scan();

    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      disposed = true;
      observer.disconnect();
      document.querySelectorAll('[data-luna-message-button="true"]').forEach((button) => button.remove());
      document.querySelectorAll('[data-luna-message-enhanced="true"]').forEach((slot) => {
        delete slot.dataset.lunaMessageEnhanced;
      });
    };
  }, [user?.id]);

  return null;
}
