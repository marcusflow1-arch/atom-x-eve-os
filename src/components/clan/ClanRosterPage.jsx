import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, Shield, Users, Plus, Search, UserMinus, MessageSquare,
  Mail, Swords, MoreVertical, Check, X, ChevronDown, Star, UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const ROLE_CONFIG = {
  leader: { label: 'Leader', icon: Crown, color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', dot: 'bg-yellow-400' },
  officer: { label: 'Officer', icon: Shield, color: 'text-blue-400', bg: 'bg-blue-500/15', border: 'border-blue-500/30', dot: 'bg-blue-400' },
  member: { label: 'Member', icon: Users, color: 'text-white/80', bg: 'bg-white/5', border: 'border-white/10', dot: 'bg-white/40' },
};

const ACTION_MENU = [
  { id: 'chat', label: 'Clan Chat', icon: MessageSquare, color: 'text-cyan-400' },
  { id: 'pm', label: 'Send PM', icon: Mail, color: 'text-purple-400' },
  { id: 'party', label: 'Party Invite', icon: Swords, color: 'text-green-400' },
  { id: 'promote', label: 'Promote', icon: Star, color: 'text-yellow-400', privileged: true },
  { id: 'demote', label: 'Demote', icon: ChevronDown, color: 'text-orange-400', privileged: true },
  { id: 'remove', label: 'Remove from Clan', icon: UserMinus, color: 'text-red-400', privileged: true, danger: true },
];

function MemberActionMenu({ member, isPrivileged, isLeader, currentUserId, onAction, onClose }) {
  const isSelf = member.userId === currentUserId || member.user_id === currentUserId;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -8 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-10 z-50 w-52 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
      style={{ background: 'rgba(10,14,22,0.97)', backdropFilter: 'blur(20px)' }}
    >
      {ACTION_MENU.map(action => {
        if (action.privileged && !isPrivileged) return null;
        if (action.id === 'promote' && (!isLeader || member.role === 'officer' || member.role === 'leader')) return null;
        if (action.id === 'demote' && (!isLeader || member.role === 'member' || member.role === 'leader')) return null;
        if (action.privileged && isSelf) return null;
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            onClick={() => { onAction(action.id, member); onClose(); }}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-white/10 ${action.danger ? 'text-red-400 hover:bg-red-500/10' : 'text-white/80'}`}
          >
            <Icon className={`w-4 h-4 ${action.color}`} />
            {action.label}
          </button>
        );
      })}
    </motion.div>
  );
}

function MemberCard({ member, isPrivileged, isLeader, currentUserId, onAction }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const role = ROLE_CONFIG[member.role] || ROLE_CONFIG.member;
  const RoleIcon = role.icon;
  const isSelf = member.userId === currentUserId || member.user_id === currentUserId;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all group hover:bg-white/5 ${role.bg} ${role.border}`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-slate-700/80 overflow-hidden ring-2 ring-white/10">
          {member.user?.avatar_url
            ? <img src={member.user.avatar_url} className="w-full h-full object-cover" alt="" />
            : <div className="w-full h-full flex items-center justify-center text-white/40 font-bold text-lg">
                {(member.user?.full_name || 'U')[0].toUpperCase()}
              </div>
          }
        </div>
        {/* Online dot */}
        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-slate-900" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className={`font-bold text-sm flex items-center gap-1.5 ${role.color}`}>
          <span className="truncate">{member.user?.full_name || 'Unknown'}</span>
          {isSelf && <span className="text-[10px] bg-white/10 text-white/50 px-1.5 py-0.5 rounded font-mono">You</span>}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`text-xs font-semibold flex items-center gap-1 ${role.color}`}>
            <RoleIcon className="w-3 h-3" /> {role.label}
          </span>
          <span className="text-white/20 text-xs">·</span>
          <span className="text-white/40 text-xs">Lvl 60</span>
        </div>
      </div>

      {/* Quick actions (hover) */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onAction('chat', member)}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-cyan-500/20 text-white/50 hover:text-cyan-400 transition-colors"
          title="Clan Chat"
        >
          <MessageSquare className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onAction('pm', member)}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-purple-500/20 text-white/50 hover:text-purple-400 transition-colors"
          title="Send PM"
        >
          <Mail className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onAction('party', member)}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-green-500/20 text-white/50 hover:text-green-400 transition-colors"
          title="Party Invite"
        >
          <Swords className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* More button */}
      {!isSelf && (
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 text-white/40 hover:text-white transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <MemberActionMenu
                member={member}
                isPrivileged={isPrivileged}
                isLeader={isLeader}
                currentUserId={currentUserId}
                onAction={onAction}
                onClose={() => setMenuOpen(false)}
              />
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

export default function ClanRosterPage({ clan, currentUserRole }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteInput, setInviteInput] = useState('');
  const [inviteStatus, setInviteStatus] = useState(null); // null | 'success' | 'error'
  const [confirmRemove, setConfirmRemove] = useState(null); // member to remove

  const isPrivileged = currentUserRole === 'leader' || currentUserRole === 'officer';
  const isLeader = currentUserRole === 'leader';

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['clanRosterMembers', clan?.id],
    queryFn: async () => {
      if (!clan?.id) return [];
      const clanMembers = await base44.entities.ClanMember.filter({ divisionId: clan.id });
      const detailed = await Promise.all(clanMembers.map(async (m) => {
        try {
          const u = await base44.entities.User.get(m.userId);
          return { ...m, user: u };
        } catch {
          return { ...m, user: null };
        }
      }));
      return detailed.sort((a, b) => {
        const order = { leader: 0, officer: 1, member: 2 };
        return (order[a.role] ?? 3) - (order[b.role] ?? 3);
      });
    },
    enabled: !!clan?.id,
  });

  const removeMutation = useMutation({
    mutationFn: async (memberId) => {
      await base44.entities.ClanMember.delete(memberId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['clanRosterMembers', clan?.id]);
      queryClient.invalidateQueries(['clanMembers', clan?.id]);
      setConfirmRemove(null);
    },
  });

  const promoteMutation = useMutation({
    mutationFn: async ({ id, role }) => {
      await base44.entities.ClanMember.update(id, { role });
    },
    onSuccess: () => queryClient.invalidateQueries(['clanRosterMembers', clan?.id]),
  });

  const inviteMutation = useMutation({
    mutationFn: async (playerId) => {
      await base44.entities.ClanInvite.create({
        divisionId: clan.id,
        inviterId: user?.id,
        inviteeId: playerId,
        status: 'pending',
      });
    },
    onSuccess: () => {
      setInviteStatus('success');
      setInviteInput('');
      setTimeout(() => { setShowInviteModal(false); setInviteStatus(null); }, 1500);
    },
    onError: () => setInviteStatus('error'),
  });

  const handleAction = (actionId, member) => {
    switch (actionId) {
      case 'chat':
        window.dispatchEvent(new CustomEvent('openClanChat'));
        break;
      case 'pm':
        // Could open a DM panel; for now navigate
        window.location.href = `/Clan?game=global_chat`;
        break;
      case 'party':
        window.dispatchEvent(new CustomEvent('sendPartyInvite', { detail: { userId: member.userId } }));
        break;
      case 'promote':
        promoteMutation.mutate({ id: member.id, role: 'officer' });
        break;
      case 'demote':
        promoteMutation.mutate({ id: member.id, role: 'member' });
        break;
      case 'remove':
        setConfirmRemove(member);
        break;
    }
  };

  const filtered = members.filter(m => {
    const name = (m.user?.full_name || '').toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || m.role === filterRole;
    return matchSearch && matchRole;
  });

  const online = members.filter(m => true); // placeholder — all shown as online
  const officers = members.filter(m => m.role === 'officer');
  const recruits = members.filter(m => m.role === 'member');

  return (
    <div className="absolute inset-0 overflow-hidden flex flex-col" style={{ background: 'linear-gradient(135deg, #0a0e16 0%, #0f1520 50%, #0a0e16 100%)' }}>
      {/* Header */}
      <div className="flex-shrink-0 px-8 py-5 border-b border-white/10 flex items-center justify-between"
        style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-wider uppercase">{clan?.name} — Roster</h1>
            <p className="text-white/40 text-xs mt-0.5">{members.length} members · {online.length} online</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Stats chips */}
          <div className="hidden md:flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {online.length} Online
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <Shield className="w-3 h-3" /> {officers.length} Officers
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs font-semibold">
              <Users className="w-3 h-3" /> {recruits.length} Members
            </span>
          </div>

          {isPrivileged && (
            <Button
              onClick={() => setShowInviteModal(true)}
              className="bg-cyan-600 hover:bg-cyan-700 text-white gap-2 text-sm h-9"
            >
              <UserPlus className="w-4 h-4" /> Invite
            </Button>
          )}
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex-shrink-0 px-8 py-4 flex items-center gap-3 border-b border-white/5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search members..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'leader', 'officer', 'member'].map(role => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${
                filterRole === role
                  ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-400'
                  : 'bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              {role === 'all' ? 'All Roles' : role}
            </button>
          ))}
        </div>
      </div>

      {/* Members Grid */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-white/30">
            <Users className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No members found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            <AnimatePresence>
              {filtered.map(member => (
                <MemberCard
                  key={member.id}
                  member={member}
                  isPrivileged={isPrivileged}
                  isLeader={isLeader}
                  currentUserId={user?.id}
                  onAction={handleAction}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <Dialog open={showInviteModal} onOpenChange={v => { setShowInviteModal(v); setInviteStatus(null); setInviteInput(''); }}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <UserPlus className="w-5 h-5 text-cyan-400" />
              Invite to {clan?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Player ID or Email</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                value={inviteInput}
                onChange={e => setInviteInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && inviteMutation.mutate(inviteInput.trim())}
                placeholder="Enter player ID or email..."
                className="pl-9 bg-slate-800 border-slate-700 text-white"
              />
            </div>
            {inviteStatus === 'success' && <p className="text-green-400 text-sm flex items-center gap-1.5"><Check className="w-4 h-4" /> Invite sent!</p>}
            {inviteStatus === 'error' && <p className="text-red-400 text-sm">Failed to send invite. Try again.</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteModal(false)} className="border-slate-700 text-slate-400">Cancel</Button>
            <Button onClick={() => inviteMutation.mutate(inviteInput.trim())} disabled={inviteMutation.isPending || !inviteInput.trim()} className="bg-cyan-600 hover:bg-cyan-700">
              {inviteMutation.isPending ? 'Sending...' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Remove Modal */}
      <AnimatePresence>
        {confirmRemove && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmRemove(null)}
          >
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="bg-slate-900 border border-red-500/30 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <UserMinus className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white">Remove Member</h3>
                  <p className="text-white/50 text-sm">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-white/70 text-sm mb-6">
                Are you sure you want to remove <span className="font-semibold text-white">{confirmRemove.user?.full_name || 'this member'}</span> from the clan?
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 border-slate-700 text-slate-400" onClick={() => setConfirmRemove(null)}>Cancel</Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  disabled={removeMutation.isPending}
                  onClick={() => removeMutation.mutate(confirmRemove.id)}
                >
                  {removeMutation.isPending ? 'Removing...' : 'Remove'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}