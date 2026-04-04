import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  ArrowRight,
  ShoppingBag,
  Sparkles,
  Trophy,
  Radio,
  Users,
  Layers,
  Shield,
  Play,
  Gamepad2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import SideAccessMenu from '@/components/dashboard/SideAccessMenu';
import { useViewMode } from '@/components/mobile/ViewModeContext';

const featureCards = [
  {
    icon: ShoppingBag,
    title: 'Storefront First',
    description: 'Jump directly into the marketplace overview, featured drops, and launch-ready worlds.',
    accent: 'from-cyan-400/80 to-blue-500/80'
  },
  {
    icon: Trophy,
    title: 'Progression Layer',
    description: 'Cards, rewards, gear, and achievements flow through one connected game identity.',
    accent: 'from-amber-400/80 to-orange-500/80'
  },
  {
    icon: Radio,
    title: 'Live Systems',
    description: 'Streaming, social presence, and interactive spaces stay woven into the core UI.',
    accent: 'from-fuchsia-400/80 to-violet-500/80'
  }
];

const liquidPills = ['Game OS', 'Liquid Glass', 'Marketplace', 'Live Social Layer'];

export default function OnboardingHome() {
  const navigate = useNavigate();
  const { isMobile } = useViewMode();

  const handleEnter = () => {
    localStorage.setItem('atom_eve_onboarding_complete', 'true');
    navigate(createPageUrl('Store') + '?subview=games&overview=true');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b14] text-white">
      {!isMobile && <SideAccessMenu />}

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_32%),radial-gradient(circle_at_bottom_center,rgba(251,191,36,0.10),transparent_24%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(8,14,27,0.96),rgba(13,22,40,0.92)_38%,rgba(10,15,28,0.96))]" />
        <div className="absolute left-[12%] top-[18%] h-72 w-72 rounded-full bg-cyan-400/10 blur-[110px]" />
        <div className="absolute bottom-[8%] right-[10%] h-80 w-80 rounded-full bg-fuchsia-500/10 blur-[130px]" />
      </div>

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-12 md:px-10 lg:px-16">
        <div className="grid w-full gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="relative overflow-hidden rounded-[32px] border border-white/12 bg-white/[0.06] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-[28px] md:p-8 lg:p-10"
          >
            <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(255,255,255,0.18),rgba(255,255,255,0.03)_28%,rgba(34,211,238,0.06)_58%,rgba(168,85,247,0.08))]" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />

            <div className="relative flex flex-wrap gap-3">
              {liquidPills.map((pill) => (
                <span
                  key={pill}
                  className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.24em] text-white/65"
                >
                  {pill}
                </span>
              ))}
            </div>

            <div className="relative mt-8 max-w-3xl">
              <p className="mb-4 text-sm uppercase tracking-[0.35em] text-cyan-300/70">Atom × Eve</p>
              <h1 className="max-w-4xl text-5xl font-black leading-[0.92] tracking-[-0.05em] text-white md:text-7xl xl:text-[6.5rem]">
                A silky game interface with a living storefront at the front.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/68 md:text-lg">
                Enter through a vibrant liquid-glass welcome surface, then land directly in the store overview where featured games, systems, and live layers are ready immediately.
              </p>
            </div>

            <div className="relative mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button
                onClick={handleEnter}
                className="h-14 rounded-full border border-white/20 bg-white text-base font-bold text-black shadow-[0_12px_30px_rgba(255,255,255,0.18)] transition-all hover:bg-white/90 sm:px-8"
              >
                Enter Store Overview
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <div className="flex items-center gap-5 text-sm text-white/45">
                <span className="flex items-center gap-2"><Play className="h-4 w-4 text-cyan-300" /> Immediate entry</span>
                <span className="flex items-center gap-2"><Layers className="h-4 w-4 text-violet-300" /> Unified systems</span>
              </div>
            </div>

            <div className="relative mt-10 grid gap-4 md:grid-cols-3">
              {featureCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, delay: 0.12 * (index + 1) }}
                    className="min-w-0 rounded-[24px] border border-white/12 bg-black/20 p-5 backdrop-blur-xl"
                  >
                    <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${card.accent}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">{card.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-white/58">{card.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="relative overflow-hidden rounded-[32px] border border-white/12 bg-white/[0.05] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-[28px] md:p-6"
          >
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.03)_18%,rgba(14,23,42,0.28)_50%,rgba(12,18,34,0.55))]" />
            <div className="relative flex h-full min-h-[420px] flex-col justify-between rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(9,13,24,0.76),rgba(9,15,28,0.56))] p-5">
              <div>
                <div className="flex items-center justify-between rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/50">
                  <span className="flex items-center gap-2"><Gamepad2 className="h-3.5 w-3.5 text-cyan-300" /> Welcome Surface</span>
                  <span>Live UI Preview</span>
                </div>

                <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.26em] text-white/45">Launch Route</p>
                      <p className="mt-2 text-2xl font-bold text-white">Store Overview</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300">Active</div>
                  </div>

                  <div className="mt-5 grid gap-3">
                    {[
                      { icon: Shield, title: 'Clean entry flow', text: 'Avatar creation removed from first-launch routing for now.' },
                      { icon: ShoppingBag, title: 'Store-first default', text: 'Users land inside the shopping experience immediately.' },
                      { icon: Users, title: 'Keeps design language', text: 'Glass, glow, and rich dark gradients stay aligned with the app.' },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 p-3">
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/8">
                            <Icon className="h-4.5 w-4.5 text-white/80" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white">{item.title}</p>
                            <p className="mt-1 text-xs leading-5 text-white/50">{item.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-[24px] border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 via-blue-500/10 to-violet-500/10 p-5">
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/65">Visual Tone</p>
                <p className="mt-3 text-2xl font-bold text-white">Half translucent. Half vibrant. Fully game-native.</p>
                <div className="mt-5 flex items-center gap-3 text-sm text-white/55">
                  <Sparkles className="h-4.5 w-4.5 text-cyan-300" />
                  Smooth glass reflections with bold sci-fi color depth.
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}