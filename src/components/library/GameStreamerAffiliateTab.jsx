import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Radio, DollarSign, Users, TrendingUp, CheckCircle, Star, Zap, Gift } from 'lucide-react';

const AFFILIATE_TIERS = [
  { name: 'Bronze', minFollowers: 0, commission: '5%', perks: ['Game key access', 'Basic analytics'], color: 'text-orange-400 border-orange-500/30 bg-orange-500/10' },
  { name: 'Silver', minFollowers: 500, commission: '10%', perks: ['Custom overlay', 'Priority support', 'Early access'], color: 'text-slate-300 border-slate-400/30 bg-slate-400/10' },
  { name: 'Gold', minFollowers: 5000, commission: '15%', perks: ['Revenue share', 'Co-marketing', 'Exclusive skins', 'Direct dev contact'], color: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' },
];

export default function GameStreamerAffiliateTab({ game }) {
  const [applied, setApplied] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/20 p-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <Radio className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-black text-white">Streamer Affiliate Program</h2>
          </div>
          <p className="text-white/60 max-w-lg mb-6">
            Stream {game?.title} and earn revenue. Get exclusive in-game items, custom overlays, and connect directly with the development team.
          </p>
          <div className="flex items-center gap-6 text-sm text-white/50">
            <div className="flex items-center gap-2"><Users className="w-4 h-4 text-blue-400" /><span>1,200+ affiliates</span></div>
            <div className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-green-400" /><span>$45K+ paid out</span></div>
            <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-cyan-400" /><span>Growing program</span></div>
          </div>
        </div>
      </div>

      {/* Tiers */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Affiliate Tiers</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {AFFILIATE_TIERS.map((tier) => (
            <div key={tier.name} className={`p-5 rounded-xl border ${tier.color} transition-all hover:scale-[1.02]`}>
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5" />
                <h4 className="text-white font-bold text-lg">{tier.name}</h4>
              </div>
              <p className="text-white/40 text-xs mb-1">{tier.minFollowers}+ followers</p>
              <p className="text-white font-bold text-2xl mb-4">{tier.commission} <span className="text-sm font-normal text-white/40">commission</span></p>
              <ul className="space-y-2">
                {tier.perks.map((perk, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-white/60">
                    <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Apply */}
      <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
        {applied ? (
          <div>
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">Application Submitted!</h3>
            <p className="text-white/50 text-sm">We'll review your profile and get back to you within 48 hours.</p>
          </div>
        ) : (
          <div>
            <Gift className="w-12 h-12 text-purple-400 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-white mb-2">Ready to become an affiliate?</h3>
            <p className="text-white/50 text-sm mb-6 max-w-md mx-auto">
              Sign up to stream {game?.title} and start earning. All you need is a streaming account.
            </p>
            <Button onClick={() => setApplied(true)} className="bg-purple-600 hover:bg-purple-500 font-bold px-8 py-3 rounded-xl">
              <Radio className="w-4 h-4 mr-2" />
              Apply Now
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}