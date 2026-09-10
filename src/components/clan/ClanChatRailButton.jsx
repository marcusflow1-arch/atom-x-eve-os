import React from 'react';
import { MessageSquare } from 'lucide-react';

export default function ClanChatRailButton() {
  return <div className="clan-surface"><button type="button" aria-label="Clan Chat" title="Clan Chat" className="clan-chat-rail-button" onClick={event => window.dispatchEvent(new CustomEvent('toggleGlobalClanChat', { detail: { trigger: event.currentTarget } }))}><MessageSquare size={18} /></button></div>;
}