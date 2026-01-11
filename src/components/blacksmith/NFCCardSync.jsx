/**
 * NFC Card Sync System (FUTURE-READY - INACTIVE BY DEFAULT)
 * 
 * This module defines the infrastructure for physical NFC card synchronization.
 * The system is designed but NOT ACTIVE in the current implementation.
 * 
 * When enabled in the future:
 * - Physical cards with NFC chips can sync with digital counterparts
 * - The NFC chip contains only a unique identifier (no stored stats)
 * - All progression data lives digitally
 * - Physical possession proves authenticity, not value
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Shield, AlertTriangle, Check, RefreshCw } from 'lucide-react';

// System status flag - set to false to keep inactive
export const NFC_SYSTEM_ENABLED = false;

// NFC Card Status Types
export const NFC_STATUS = {
  UNBOUND: 'unbound',           // Physical card not yet linked
  BOUND: 'bound',               // Actively linked to digital card
  PENDING_VERIFICATION: 'pending', // Awaiting verification
  REVOKED: 'revoked',           // Physical card access revoked
  COOLDOWN: 'cooldown'          // Rebinding cooldown active
};

// Cooldown period for rebinding (in hours)
export const REBIND_COOLDOWN_HOURS = 72;

/**
 * Calculate if a physical card can be rebound
 * @param {Date} lastBindDate - When the card was last bound
 * @returns {Object} - { canRebind: boolean, hoursRemaining: number }
 */
export function canRebindPhysicalCard(lastBindDate) {
  if (!lastBindDate) return { canRebind: true, hoursRemaining: 0 };
  
  const cooldownEnd = new Date(lastBindDate);
  cooldownEnd.setHours(cooldownEnd.getHours() + REBIND_COOLDOWN_HOURS);
  
  const now = new Date();
  if (now >= cooldownEnd) {
    return { canRebind: true, hoursRemaining: 0 };
  }
  
  const hoursRemaining = Math.ceil((cooldownEnd - now) / (1000 * 60 * 60));
  return { canRebind: false, hoursRemaining };
}

/**
 * Validate NFC card identifier format
 * @param {string} nfcId - The NFC chip unique identifier
 * @returns {boolean} - Whether the ID format is valid
 */
export function validateNFCIdentifier(nfcId) {
  // Expected format: AXE-XXXX-XXXX-XXXX (16 char alphanumeric with dashes)
  const pattern = /^AXE-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return pattern.test(nfcId);
}

/**
 * Physical Card Schema (for future entity)
 * This defines what would be stored for physical card tracking
 */
export const PHYSICAL_CARD_SCHEMA = {
  nfc_id: 'string',              // Unique NFC chip identifier
  digital_card_id: 'string',     // Linked UserCard ID
  owner_id: 'string',            // Current owner's user ID
  bind_date: 'datetime',         // When binding occurred
  last_scan_date: 'datetime',    // Last successful scan
  status: 'enum',                // NFC_STATUS values
  authenticity_verified: 'boolean',
  previous_owners: 'array',      // History of ownership transfers
  revocation_reason: 'string'    // If revoked, why
};

/**
 * NFC Status Badge Component
 * Shows the physical card binding status
 */
export function NFCStatusBadge({ status, size = 'normal' }) {
  if (!NFC_SYSTEM_ENABLED) return null;

  const statusConfig = {
    [NFC_STATUS.UNBOUND]: { color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', label: 'No Physical' },
    [NFC_STATUS.BOUND]: { color: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'NFC Linked' },
    [NFC_STATUS.PENDING_VERIFICATION]: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Verifying' },
    [NFC_STATUS.REVOKED]: { color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Revoked' },
    [NFC_STATUS.COOLDOWN]: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', label: 'Cooldown' }
  };

  const config = statusConfig[status] || statusConfig[NFC_STATUS.UNBOUND];
  const isSmall = size === 'small';

  return (
    <Badge className={`${config.color} border ${isSmall ? 'text-[9px] px-1.5' : 'text-xs px-2'} flex items-center gap-1`}>
      <Smartphone className={isSmall ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      {config.label}
    </Badge>
  );
}

/**
 * NFC Info Panel Component (Future UI)
 * Would display physical card sync information
 */
export function NFCInfoPanel({ physicalCardData, onScan, onRevoke }) {
  if (!NFC_SYSTEM_ENABLED) {
    return (
      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
        <div className="flex items-center gap-3 text-slate-500">
          <Smartphone className="w-5 h-5" />
          <div>
            <p className="text-sm font-medium">Physical Card Sync</p>
            <p className="text-xs text-slate-600">Coming Soon</p>
          </div>
        </div>
      </div>
    );
  }

  const { canRebind, hoursRemaining } = canRebindPhysicalCard(physicalCardData?.bind_date);

  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-cyan-400" />
          <span className="text-white font-semibold">Physical Card</span>
        </div>
        <NFCStatusBadge status={physicalCardData?.status || NFC_STATUS.UNBOUND} />
      </div>

      {physicalCardData?.status === NFC_STATUS.BOUND ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-white/70">Authenticity Verified</span>
          </div>
          <div className="text-xs text-white/50">
            NFC ID: {physicalCardData.nfc_id}
          </div>
          <div className="text-xs text-white/50">
            Bound: {new Date(physicalCardData.bind_date).toLocaleDateString()}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-white/60">
            Scan your physical card to link it with this digital card.
          </p>
          <button
            onClick={onScan}
            disabled={!canRebind}
            className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
              canRebind
                ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30'
                : 'bg-white/5 border border-white/10 text-white/30 cursor-not-allowed'
            }`}
          >
            {canRebind ? (
              <>
                <RefreshCw className="w-4 h-4 inline mr-2" />
                Scan NFC Card
              </>
            ) : (
              `Cooldown: ${hoursRemaining}h remaining`
            )}
          </button>
        </div>
      )}

      {/* Security Notice */}
      <div className="mt-4 pt-3 border-t border-white/10 flex items-start gap-2">
        <Shield className="w-4 h-4 text-white/40 mt-0.5" />
        <p className="text-[10px] text-white/40">
          Physical cards prove authenticity but do not store progression data. 
          All upgrades and value are calculated digitally.
        </p>
      </div>
    </div>
  );
}

/**
 * Market authenticity boost calculator
 * Physical card ownership increases buyer confidence
 * @param {number} baseValue - Digital market value
 * @param {boolean} hasPhysicalCard - Whether physical card is bound
 * @returns {Object} - { boostedValue, confidenceBonus }
 */
export function calculatePhysicalCardBonus(baseValue, hasPhysicalCard) {
  if (!NFC_SYSTEM_ENABLED || !hasPhysicalCard) {
    return { boostedValue: baseValue, confidenceBonus: 0 };
  }
  
  // Physical card adds 5% confidence bonus to perceived value
  const confidenceBonus = Math.floor(baseValue * 0.05);
  return {
    boostedValue: baseValue + confidenceBonus,
    confidenceBonus
  };
}