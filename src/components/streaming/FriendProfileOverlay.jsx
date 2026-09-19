import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  Crown,
  Film,
  Flame,
  Gamepad2,
  Gem,
  Grid3X3,
  Heart,
  Image as ImageIcon,
  Layers3,
  MapPin,
  MessageSquare,
  Play,
  Quote,
  Search,
  Shield,
  Sparkles,
  Star,
  Swords,
  Target,
  Trophy,
  Upload,
  UserRound,
  Users,
  X,
  Zap,
} from 'lucide-react';
import FriendMessenger from '../friends/FriendMessenger';

const NAV_ITEMS = [
  ['overview', 'Overview'],
  ['achievements', 'Achievements'],
  ['games', 'Games'],
  ['cards', 'Cards'],
  ['activity', 'Activity'],
  ['clips', 'Clips'],
  ['media', 'Media'],
  ['stats', 'Stats'],
  ['about', 'About'],
];

const demoGames = [
  { name: 'Neon Racer', genre: 'Racing', progress: 92, image: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=700&q=85' },
  { name: 'Elden Ring', genre: 'RPG', progress: 78, image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=700&q=85' },
  { name: 'Starfield', genre: 'Sci-Fi', progress: 84, image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=700&q=85' },
  { name: 'Shadow Realm', genre: 'Action', progress: 71, image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=700&q=85' },
  { name: 'Cyberwake', genre: 'Shooter', progress: 88, image: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=700&q=85' },
  { name: 'Frostline', genre: 'Survival', progress: 62, image: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=700&q=85' },
];

const cardArt = [
  ['Elden Lord', 'LEGENDARY', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&q=85'],
  ['Cyberpunk 2077', 'LEGENDARY', 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=500&q=85'],
  ['Starlight', 'EPIC', 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=500&q=85'],
  ['Resident Evil 4', 'EPIC', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=500&q=85'],
  ['Forza Horizon 5', 'RARE', 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=500&q=85'],
  ['Shadow Realm', 'RARE', 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=500&q=85'],
  ['Neon Racer', 'RARE', 'https://images.unsplash.com/photo-1493238792000-8113da705763?w=500&q=85'],
  ['Master Chief', 'RARE', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&q=85'],
];

const clipArt = [
  ['Neon Rush – Perfect Drift', '0:24', demoGames[0].image],
  ['Clutch 1v3 – Final Circle', '0:31', demoGames[1].image],
  ['Starfall Takeoff', '0:18', demoGames[2].image],
  ['Blade Parry Masterclass', '0:27', demoGames[3].image],
  ['Insane Overtake', '0:20', demoGames[4].image],
  ['Squad Wipe', '0:33', demoGames[5].image],
];

const mediaArt = [
  ['Neon Horizon', 'Photo Mode', demoGames[0].image],
  ['EVE City Nights', 'Screenshot', 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=700&q=85'],
  ['Solitude', 'Fan Art', 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=700&q=85'],
  ['Race Forever', 'Wallpaper', 'https://images.unsplash.com/photo-1470214304380-aadaedcfff1b?w=700&q=85'],
  ['Midnight Run', 'Screenshot', 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=700&q=85'],
  ['A New Dawn', 'Wallpaper', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=700&q=85'],
  ['Pit Stop', 'Photo Mode', 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=700&q=85'],
  ['Neon & Rain', 'Screenshot', 'https://images.unsplash.com/photo-1493238792000-8113da705763?w=700&q=85'],
];

const glass = {
  background: 'linear-gradient(145deg, rgba(7,16,29,.76), rgba(6,13,24,.58))',
  border: '1px solid rgba(125,211,252,.14)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.035), 0 12px 30px rgba(0,0,0,.16)',
};

function Section({ children, className = '' }) {
  return <section className={`rounded-2xl overflow-hidden ${className}`} style={glass}>{children}</section>;
}

function SectionTitle({ title, action = 'View All', icon: Icon }) {
  return (
    <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-3.5 w-3.5 text-cyan-300/70" />}
        <h3 className="text-[11px] font-bold text-white/82">{title}</h3>
      </div>
      {action && <button className="text-[8px] font-semibold text-cyan-200/62 hover:text-cyan-100">{action}</button>}
    </div>
  );
}

function StatTile({ label, value, sub, icon: Icon, accent = 'text-cyan-300' }) {
  return (
    <div className="rounded-xl border border-white/[0.055] bg-black/15 px-3 py-2.5">
      <div className="flex items-center gap-2">
        {Icon && <Icon className={`h-3.5 w-3.5 ${accent}`} />}
        <div>
          <p className="text-[6px] font-black uppercase tracking-[.15em] text-white/22">{label}</p>
          <p className="mt-0.5 text-[15px] font-black text-white/86">{value}</p>
        </div>
      </div>
      {sub && <p className="mt-1 text-[7px] text-white/28">{sub}</p>}
    </div>
  );
}

function ProgressRing({ value, label, color = '#22d3ee' }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="grid h-12 w-12 place-items-center rounded-full"
        style={{ background: `conic-gradient(${color} ${value * 3.6}deg, rgba(255,255,255,.06) 0deg)` }}
      >
        <div className="grid h-[38px] w-[38px] place-items-center rounded-full bg-[#08111d] text-[9px] font-black text-white/85">{value}%</div>
      </div>
      <span className="text-[7px] text-white/36">{label}</span>
    </div>
  );
}

function OverviewPage() {
  return (
    <div className="grid grid-cols-12 gap-3">
      <Section className="col-span-8">
        <SectionTitle title="Recent Games" icon={Gamepad2} />
        <div className="grid grid-cols-3 gap-2 px-4 pb-4">
          {demoGames.slice(0, 6).map((game) => (
            <div key={game.name} className="group relative h-24 overflow-hidden rounded-xl border border-white/[0.05]">
              <img src={game.image} alt={game.name} className="absolute inset-0 h-full w-full object-cover opacity-48 transition duration-300 group-hover:scale-[1.03] group-hover:opacity-62" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#060b13] via-[#060b13]/28 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-2.5">
                <p className="text-[9px] font-bold text-white/84">{game.name}</p>
                <p className="text-[6px] uppercase tracking-[.12em] text-white/30">{game.genre} · {game.progress}%</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section className="col-span-4">
        <SectionTitle title="Profile Snapshot" icon={UserRound} action={null} />
        <div className="grid grid-cols-2 gap-2 px-4 pb-4">
          <StatTile label="Games" value="28" icon={Gamepad2} />
          <StatTile label="Friends" value="652" icon={Users} />
          <StatTile label="Achievements" value="1.2K" icon={Trophy} />
          <StatTile label="Card Power" value="3.3K" icon={Zap} />
        </div>
      </Section>

      <Section className="col-span-5">
        <SectionTitle title="Achievement Progress" icon={Trophy} />
        <div className="flex items-center gap-4 px-4 pb-4">
          <ProgressRing value={86} label="Complete" />
          <div className="min-w-0 flex-1">
            <div className="flex items-end justify-between">
              <div><span className="text-2xl font-black text-white">1,248</span><span className="ml-1 text-sm text-white/38">/ 1,450</span></div>
              <span className="text-[8px] text-cyan-200/60">202 to go</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full w-[86%] rounded-full bg-gradient-to-r from-cyan-500 to-sky-300" />
            </div>
            <p className="mt-2 text-[8px] italic text-white/28">“Progress isn’t a number. It’s a story.”</p>
          </div>
        </div>
      </Section>

      <Section className="col-span-4">
        <SectionTitle title="Top Genres" icon={Layers3} />
        <div className="flex justify-between px-4 pb-4">
          <ProgressRing value={92} label="RPG" />
          <ProgressRing value={84} label="Horror" color="#34d399" />
          <ProgressRing value={78} label="Action" color="#60a5fa" />
          <ProgressRing value={71} label="Strategy" color="#a78bfa" />
        </div>
      </Section>

      <Section className="col-span-3">
        <SectionTitle title="Current Streak" icon={Flame} action={null} />
        <div className="px-4 pb-4">
          <div className="flex items-center gap-3">
            <Flame className="h-8 w-8 text-amber-400" />
            <div><p className="text-xl font-black text-amber-300">12 Weeks</p><p className="text-[7px] text-white/28">Challenge streak</p></div>
          </div>
          <div className="mt-3 flex justify-between">
            {['M','T','W','T','F','S','S'].map((d, i) => <span key={i} className={`grid h-5 w-5 place-items-center rounded-full border text-[6px] ${i < 5 ? 'border-cyan-300/40 text-cyan-200' : 'border-white/10 text-white/22'}`}>{i < 5 ? <Check className="h-2.5 w-2.5" /> : d}</span>)}
          </div>
        </div>
      </Section>

      <Section className="col-span-12">
        <SectionTitle title="Recent Activity" icon={Activity} />
        <div className="grid grid-cols-3 gap-2 px-4 pb-4">
          {[
            ['Unlocked “Celestial Blade”', '2 hours ago', Trophy],
            ['Won 5 ranked matches in a row', 'Yesterday', Swords],
            ['Uploaded a new Neon Racer clip', '2 days ago', Film],
          ].map(([text, time, Icon]) => (
            <div key={text} className="flex items-center gap-3 rounded-xl border border-white/[0.045] bg-white/[0.018] p-3">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-300/[0.06]"><Icon className="h-3.5 w-3.5 text-cyan-200/65" /></div>
              <div><p className="text-[8px] font-medium text-white/62">{text}</p><p className="mt-1 text-[7px] text-white/22">{time}</p></div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function AchievementsPage() {
  const rarest = [
    ['Eclipse Protocol', '0.2%', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&q=90'],
    ['Void Walker', '0.3%', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=90'],
    ['Perfect Sync', '0.4%', 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=600&q=90'],
    ['The Last Light', '0.5%', 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600&q=90'],
    ['Zero Footprint', '0.6%', 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=600&q=90'],
  ];

  const showcase = [
    ['Elden Lord', 'Legendary', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=90', 'border-amber-400/45 text-amber-300'],
    ['The Legend', 'Rare', 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=600&q=90', 'border-cyan-400/45 text-cyan-300'],
    ['Survivor', 'Epic', 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=600&q=90', 'border-violet-400/45 text-violet-300'],
    ['Master Pilot', 'Rare', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&q=90', 'border-cyan-400/45 text-cyan-300'],
    ['Night City Legend', 'Legendary', 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600&q=90', 'border-fuchsia-400/45 text-amber-300'],
  ];

  const recent = [
    ['Celestial Blade', 'Elden Ring', '2 hours ago', showcase[0][2]],
    ['Knight’s End', 'Elden Ring', '5 hours ago', rarest[1][2]],
    ['Tactical Master', 'Starfield', '1 day ago', rarest[2][2]],
    ['Speed Demon', 'Neon Racer', '2 days ago', demoGames[0].image],
    ['Frozen Resolve', 'Frostline', '3 days ago', demoGames[5].image],
  ];

  return (
    <div className="grid grid-cols-12 gap-2">
      <Section className="col-span-6">
        <SectionTitle title="Achievement Progress" icon={Trophy} />
        <div className="grid grid-cols-[116px_1fr] items-center gap-4 px-4 pb-4">
          <div className="relative grid h-24 w-24 place-items-center rounded-full bg-[conic-gradient(#22d3ee_0deg,#22d3ee_310deg,rgba(255,255,255,.06)_310deg)] p-[6px] shadow-[0_0_30px_rgba(34,211,238,.18)]">
            <div className="grid h-full w-full place-items-center rounded-full border border-cyan-300/10 bg-[#071321]">
              <Trophy className="h-10 w-10 text-cyan-100" />
            </div>
          </div>
          <div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-white">1,248</span>
              <span className="pb-1 text-sm text-white/40">/ 1,450</span>
            </div>
            <p className="text-lg font-black text-white/88">86% <span className="text-sm font-normal text-white/42">Complete</span></p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
              <div className="h-full w-[86%] rounded-full bg-gradient-to-r from-cyan-500 to-sky-300" />
            </div>
            <p className="mt-2 text-[7px] text-cyan-200/55">202 achievements to go</p>
            <div className="mt-3 grid grid-cols-4 divide-x divide-white/[0.06] rounded-lg border border-white/[0.05] bg-black/15 py-2.5">
              {[
                [Trophy,'1,248','Unlocked','text-amber-300'],
                [Shield,'202','Locked','text-slate-300'],
                [Star,'37','Perfect Games','text-yellow-300'],
                [Gem,'0.8%','Rarest Rarity','text-violet-300'],
              ].map(([Icon,value,label,tone])=>(
                <div key={label} className="text-center">
                  <Icon className={`mx-auto h-3.5 w-3.5 ${tone}`} />
                  <p className="mt-1 text-[10px] font-black text-white/82">{value}</p>
                  <p className="text-[6px] text-white/28">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section className="col-span-4">
        <SectionTitle title="Completion by Genre" icon={Layers3} />
        <div className="grid grid-cols-6 gap-1 px-3 pb-4">
          {[
            [92,'RPG','#22d3ee','128 / 139'],
            [78,'Action','#60a5fa','256 / 328'],
            [84,'Horror','#34d399','67 / 80'],
            [71,'Strategy','#a78bfa','71 / 100'],
            [88,'Racing','#67e8f9','106 / 120'],
            [62,'Other','#c084fc','54 / 87'],
          ].map(([v,l,color,count])=>(
            <div key={l} className="text-center">
              <ProgressRing value={v} label={l} color={color} />
              <p className="mt-1 text-[5px] text-white/23">{count}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="col-span-2">
        <SectionTitle title="Challenge Streak" icon={Flame} action={null} />
        <div className="px-3 pb-3">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full border border-orange-400/20 bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,.12)]">
              <Flame className="h-7 w-7 text-orange-400" />
            </div>
            <div>
              <p className="text-xl font-black text-amber-300">12 <span className="text-sm text-white">Weeks</span></p>
              <p className="text-[6px] text-white/28">Current Streak</p>
            </div>
          </div>
          <p className="mt-3 text-[7px] italic text-white/35">“Keep going. Greatness compounds.”</p>
          <div className="mt-3 grid grid-cols-7 gap-1">
            {['M','T','W','T','F','S','S'].map((d,i)=>(
              <div key={d+i} className="text-center">
                <div className={`mx-auto grid h-5 w-5 place-items-center rounded-full border text-[7px] ${i<6?'border-cyan-300/60 bg-cyan-300/[0.08] text-cyan-200':'border-white/12 text-white/18'}`}>{i<6?'✓':''}</div>
                <p className="mt-1 text-[5px] text-white/28">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section className="col-span-6">
        <SectionTitle title="Rarest Achievements" icon={Gem} />
        <div className="grid grid-cols-5 gap-2 px-3 pb-3">
          {rarest.map(([name,rate,image])=>(
            <div key={name} className="overflow-hidden rounded-lg border border-cyan-300/20 bg-[#071321]">
              <div className="relative h-20">
                <img src={image} alt={name} className="h-full w-full object-cover opacity-68" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#071321] via-transparent to-transparent" />
                <Gem className="absolute left-2 top-2 h-3 w-3 text-violet-300" />
              </div>
              <div className="px-2 pb-2">
                <p className="truncate text-[7px] font-black text-white/72">{name}</p>
                <p className="mt-0.5 text-[6px] text-cyan-300/70">Ultra Rare · <span className="text-fuchsia-300">{rate}</span></p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section className="col-span-4">
        <SectionTitle title="Perfect Games (37)" icon={Crown} />
        <div className="grid grid-cols-5 gap-1.5 px-3 pb-3">
          {demoGames.slice(0,5).map(game=>(
            <div key={game.name} className="overflow-hidden rounded-lg border border-white/[0.06] bg-black/10">
              <img src={game.image} alt={game.name} className="h-20 w-full object-cover opacity-72" />
              <div className="p-1.5">
                <p className="truncate text-[6px] font-black text-white/66">{game.name}</p>
                <p className="mt-0.5 text-[6px] text-amber-300/72">🏆 100%</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section className="col-span-2 row-span-2">
        <SectionTitle title="Next Unlock Targets" icon={Zap} />
        <div className="space-y-3 px-3 pb-3">
          {[
            ['Master of Speed','Neon Racer',80,'8 / 10'],
            ['Into the Unknown','Eclipse',80,'12 / 15'],
            ['Survival Instinct','Shadow Realm',60,'3 / 5'],
          ].map(([title,game,pct,count],i)=>(
            <div key={title} className="flex gap-2">
              <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border ${i===0?'border-cyan-300/35 text-cyan-300':i===1?'border-amber-300/35 text-amber-300':'border-rose-300/35 text-rose-300'}`}>
                <Target className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-1">
                  <div>
                    <p className="truncate text-[7px] font-black text-white/65">{title}</p>
                    <p className="text-[6px] text-cyan-300/50">{game}</p>
                  </div>
                  <p className="text-right text-[6px] text-white/28">{count}<br/>{pct}%</p>
                </div>
                <div className="mt-1 h-1 rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-cyan-400" style={{width:`${pct}%`}} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section className="col-span-5">
        <SectionTitle title="Achievement Showcase" icon={Star} action="Edit Showcase" />
        <div className="grid grid-cols-5 gap-2 px-3 pb-3">
          {showcase.map(([name,rarity,image,tone])=>(
            <div key={name} className={`overflow-hidden rounded-lg border bg-black/10 ${tone}`}>
              <img src={image} alt={name} className="h-16 w-full object-cover opacity-70" />
              <div className="p-1.5 text-center">
                <p className="truncate text-[6px] font-black text-white/70">{name}</p>
                <p className="text-[5px]">{rarity}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section className="col-span-5">
        <SectionTitle title="Achievement Milestones" icon={Star} action={null} />
        <div className="relative px-4 pb-4 pt-2">
          <div className="absolute left-[11%] right-[11%] top-6 h-px bg-cyan-300/22" />
          <div className="relative grid grid-cols-4 gap-2">
            {[
              [250,'Completed','Jan 10, 2024',true],
              [500,'Completed','Jun 22, 2024',true],
              [750,'Achievements','Mar 12, 2024',true],
              [1000,'Achievements','In Progress',false],
            ].map(([num,label,date,done])=>(
              <div key={num} className="text-center">
                <div className={`mx-auto grid h-8 w-8 place-items-center rounded-full border-2 bg-[#071321] text-[8px] ${done?'border-cyan-300 text-cyan-200':'border-white/15 text-white/25'}`}>{done?'✓':'🔒'}</div>
                <p className="mt-2 text-[8px] font-black text-white/72">{num}</p>
                <p className="text-[6px] text-white/35">{label}</p>
                <p className="mt-1 text-[5px] text-cyan-300/50">{date}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section className="col-span-7">
        <SectionTitle title="Recent Unlocks" icon={Clock3} />
        <div className="grid grid-cols-5 gap-2 px-3 pb-3">
          {recent.map(([title,game,time,image])=>(
            <div key={title} className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.015] p-2">
              <img src={image} alt={title} className="h-10 w-10 shrink-0 rounded-md object-cover opacity-75" />
              <div className="min-w-0">
                <p className="truncate text-[6px] font-black text-white/68">{title}</p>
                <p className="truncate text-[5px] text-white/32">{game}</p>
                <p className="text-[5px] text-white/20">{time}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section className="col-span-5">
        <div className="relative h-full min-h-[76px] overflow-hidden">
          <img src="https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=1200&q=85" alt="" className="absolute inset-0 h-full w-full object-cover opacity-28" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#071321]/95 via-[#071321]/82 to-cyan-950/35" />
          <div className="relative flex h-full items-center gap-3 px-5 py-3">
            <Quote className="h-5 w-5 shrink-0 text-cyan-300/45" />
            <div>
              <p className="text-[7px] italic leading-4 text-white/52">“Achievements aren’t just checkboxes. They’re proof of where you’ve been — and a hint of what’s next.”</p>
              <p className="mt-1 text-[6px] text-white/25">— Logan</p>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

function GamesPage() {
  const favoriteGames = [
    ['Cyberpunk 2077','RPG','https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=700&q=90'],
    ['Elden Ring','Action RPG','https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=700&q=90'],
    ['Red Dead Redemption II','Action','https://images.unsplash.com/photo-1511512578047-dfb367046420?w=700&q=90'],
    ['The Last of Us Part I','Action Adventure','https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=700&q=90'],
    ['Baldur’s Gate 3','RPG','https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=700&q=90'],
  ];

  const recentGames = [
    ['Helldivers 2','12.4 hrs','2 days ago','https://images.unsplash.com/photo-1511512578047-dfb367046420?w=700&q=90'],
    ['Forza Horizon 5','6.8 hrs','3 days ago','https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=700&q=90'],
    ['Starfield','4.1 hrs','5 days ago','https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=700&q=90'],
    ['Hades II','3.6 hrs','6 days ago','https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=700&q=90'],
    ['Resident Evil 4','2.9 hrs','1 week ago','https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=700&q=90'],
  ];

  const showcase = [
    ['Mass Effect','Legendary','https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=700&q=90','border-amber-400/45 text-amber-300'],
    ['The Witcher 3','Legendary','https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=700&q=90','border-cyan-400/45 text-cyan-300'],
    ['HALO','Iconic','https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=700&q=90','border-fuchsia-400/45 text-fuchsia-300'],
    ['God of War','Iconic','https://images.unsplash.com/photo-1511512578047-dfb367046420?w=700&q=90','border-cyan-400/45 text-cyan-300'],
    ['Final Fantasy VII','Legendary','https://images.unsplash.com/photo-1514565131-fce0801e5785?w=700&q=90','border-violet-400/45 text-amber-300'],
  ];

  const recentSessions = [
    ['Helldivers 2','PS5','2 hours ago',recentGames[0][3]],
    ['Forza Horizon 5','Xbox','5 hours ago',recentGames[1][3]],
    ['Starfield','PC','1 day ago',recentGames[2][3]],
    ['Hades II','PC','2 days ago',recentGames[3][3]],
    ['Resident Evil 4','PS5','3 days ago',recentGames[4][3]],
  ];

  return (
    <div className="grid grid-cols-12 gap-2">
      <Section className="col-span-6">
        <SectionTitle title="Game Library Overview" icon={Gamepad2} />
        <div className="grid grid-cols-[118px_1fr] items-center gap-4 px-4 pb-4">
          <div className="relative grid h-24 w-24 place-items-center rounded-full bg-[conic-gradient(#22d3ee_0deg,#22d3ee_280deg,rgba(255,255,255,.06)_280deg)] p-[6px] shadow-[0_0_30px_rgba(34,211,238,.18)]">
            <div className="grid h-full w-full place-items-center rounded-full border border-cyan-300/10 bg-[#071321]">
              <Gamepad2 className="h-10 w-10 text-cyan-100" />
            </div>
          </div>
          <div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-white">28</span>
              <span className="pb-1 text-sm text-white/40">/ 36</span>
            </div>
            <p className="text-lg font-black text-white/88">78% <span className="text-sm font-normal text-white/42">Complete</span></p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
              <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-cyan-500 to-sky-300" />
            </div>
            <p className="mt-2 text-[7px] text-cyan-200/55">28 games owned · 22 games played</p>
            <p className="mt-2 text-[7px] italic text-white/32">“It’s not just a library. It’s a collection of worlds.”</p>
            <div className="mt-3 grid grid-cols-4 divide-x divide-white/[0.06] rounded-lg border border-white/[0.05] bg-black/15 py-2.5">
              {[
                [Gamepad2,'28','Owned','text-sky-300'],
                [Play,'22','Played','text-cyan-300'],
                [Trophy,'8','Completed','text-amber-300'],
                [Crown,'3','100% Games','text-yellow-300'],
              ].map(([Icon,value,label,tone])=>(
                <div key={label} className="text-center">
                  <Icon className={`mx-auto h-3.5 w-3.5 ${tone}`} />
                  <p className="mt-1 text-[10px] font-black text-white/82">{value}</p>
                  <p className="text-[6px] text-white/28">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section className="col-span-4">
        <SectionTitle title="Completion by Genre" icon={Layers3} />
        <div className="grid grid-cols-6 gap-1 px-3 pb-4">
          {[
            [92,'RPG','#22d3ee','12 / 13'],
            [78,'Action','#60a5fa','7 / 9'],
            [64,'Horror','#34d399','5 / 8'],
            [71,'Strategy','#a78bfa','5 / 7'],
            [56,'Racing','#67e8f9','3 / 5'],
            [38,'Other','#c084fc','2 / 6'],
          ].map(([v,l,color,count])=>(
            <div key={l} className="text-center">
              <ProgressRing value={v} label={l} color={color} />
              <p className="mt-1 text-[5px] text-white/23">{count}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="col-span-2">
        <SectionTitle title="Current Play Streak" icon={Flame} action={null} />
        <div className="px-3 pb-3">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full border border-orange-400/20 bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,.12)]">
              <Flame className="h-7 w-7 text-orange-400" />
            </div>
            <div>
              <p className="text-xl font-black text-amber-300">12 <span className="text-sm text-white">Days</span></p>
              <p className="text-[6px] text-white/28">Longest streak: 21 days</p>
            </div>
          </div>
          <p className="mt-3 text-[7px] italic text-white/35">“Good games make better days.”</p>
          <div className="mt-3 grid grid-cols-7 gap-1">
            {['M','T','W','T','F','S','S'].map((d,i)=>(
              <div key={d+i} className="text-center">
                <div className={`mx-auto grid h-5 w-5 place-items-center rounded-full border text-[7px] ${i<6?'border-cyan-300/60 bg-cyan-300/[0.08] text-cyan-200':'border-white/12 text-white/18'}`}>{i<6?'✓':''}</div>
                <p className="mt-1 text-[5px] text-white/28">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section className="col-span-6">
        <SectionTitle title="Favorite Games" icon={Star} />
        <div className="grid grid-cols-5 gap-2 px-3 pb-3">
          {favoriteGames.map(([name,genre,image])=>(
            <div key={name} className="overflow-hidden rounded-lg border border-cyan-300/18 bg-[#071321]">
              <img src={image} alt={name} className="h-24 w-full object-cover opacity-78" />
              <div className="px-2 pb-2 pt-1.5 text-center">
                <p className="truncate text-[7px] font-black text-white/72">{name}</p>
                <p className="mt-0.5 text-[6px] text-cyan-300/60">{genre}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section className="col-span-4">
        <SectionTitle title="Recently Played" icon={Clock3} />
        <div className="grid grid-cols-5 gap-1.5 px-3 pb-3">
          {recentGames.map(([name,hours,ago,image])=>(
            <div key={name} className="overflow-hidden rounded-lg border border-white/[0.06] bg-black/10">
              <img src={image} alt={name} className="h-20 w-full object-cover opacity-74" />
              <div className="p-1.5">
                <p className="truncate text-[6px] font-black text-white/66">{name}</p>
                <p className="text-[5px] text-white/30">{hours}</p>
                <p className="text-[5px] text-white/20">{ago}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section className="col-span-2 row-span-2">
        <SectionTitle title="Next Game Goals" icon={Target} />
        <div className="space-y-3 px-3 pb-3">
          {[
            ['Starfield','Complete Main Story',53,'8 / 15'],
            ['Hades II','Reach 100% Completion',50,'12 / 24'],
            ['Cyberpunk 2077','Complete Phantom Liberty',60,'6 / 10'],
          ].map(([title,goal,pct,count],i)=>(
            <div key={title} className="flex gap-2">
              <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border ${i===0?'border-cyan-300/35 text-cyan-300':i===1?'border-amber-300/35 text-amber-300':'border-rose-300/35 text-rose-300'}`}>
                <Target className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-1">
                  <div>
                    <p className="truncate text-[7px] font-black text-white/65">{title}</p>
                    <p className="text-[6px] text-cyan-300/50">{goal}</p>
                  </div>
                  <p className="text-right text-[6px] text-white/28">{count}<br/>{pct}%</p>
                </div>
                <div className="mt-1 h-1 rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-cyan-400" style={{width:`${pct}%`}} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section className="col-span-5">
        <SectionTitle title="Game Showcase" icon={Crown} action="Edit Showcase" />
        <div className="grid grid-cols-5 gap-2 px-3 pb-3">
          {showcase.map(([name,rarity,image,tone])=>(
            <div key={name} className={`overflow-hidden rounded-lg border bg-black/10 ${tone}`}>
              <img src={image} alt={name} className="h-16 w-full object-cover opacity-72" />
              <div className="p-1.5 text-center">
                <p className="truncate text-[6px] font-black text-white/70">{name}</p>
                <p className="text-[5px]">{rarity}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section className="col-span-5">
        <SectionTitle title="Library Milestones" icon={Trophy} action={null} />
        <div className="relative px-4 pb-4 pt-2">
          <div className="absolute left-[11%] right-[11%] top-6 h-px bg-cyan-300/22" />
          <div className="relative grid grid-cols-4 gap-2">
            {[
              [28,'Games Owned','Mar 12, 2024',true],
              [25,'Games Played','Already there.',true],
              [10,'Games Completed','5 to go.',true],
              [5,'Games at 100%','2 to go.',false],
            ].map(([num,label,date,done])=>(
              <div key={label} className="text-center">
                <div className={`mx-auto grid h-8 w-8 place-items-center rounded-full border-2 bg-[#071321] text-[8px] ${done?'border-cyan-300 text-cyan-200':'border-emerald-300 text-emerald-200'}`}>{done?'✓':'○'}</div>
                <p className="mt-2 text-[8px] font-black text-white/72">{num}</p>
                <p className="text-[6px] text-white/35">{label}</p>
                <p className="mt-1 text-[5px] text-cyan-300/50">{date}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section className="col-span-7">
        <SectionTitle title="Recent Sessions" icon={Clock3} />
        <div className="grid grid-cols-5 gap-2 px-3 pb-3">
          {recentSessions.map(([title,platform,time,image])=>(
            <div key={title} className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.015] p-2">
              <img src={image} alt={title} className="h-10 w-10 shrink-0 rounded-md object-cover opacity-75" />
              <div className="min-w-0">
                <p className="truncate text-[6px] font-black text-white/68">{title}</p>
                <p className="truncate text-[5px] text-white/32">{platform}</p>
                <p className="text-[5px] text-white/20">{time}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section className="col-span-5">
        <div className="relative h-full min-h-[76px] overflow-hidden">
          <img src="https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=1200&q=85" alt="" className="absolute inset-0 h-full w-full object-cover opacity-28" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#071321]/95 via-[#071321]/82 to-cyan-950/35" />
          <div className="relative flex h-full items-center gap-3 px-5 py-3">
            <Quote className="h-5 w-5 shrink-0 text-cyan-300/45" />
            <div>
              <p className="text-[7px] italic leading-4 text-white/52">“Every game is a world. Every world leaves something with you.”</p>
              <p className="mt-1 text-[6px] text-white/25">— Logan</p>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

function CardsPage() {
  return (
    <div className="grid grid-cols-12 gap-3">
      <Section className="col-span-4">
        <SectionTitle title="Featured Card" icon={Crown} />
        <div className="flex gap-3 px-4 pb-4">
          <div className="relative h-52 w-36 shrink-0 overflow-hidden rounded-xl border border-amber-300/45 shadow-[0_0_28px_rgba(245,158,11,.12)]">
            <img src={cardArt[0][2]} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-amber-300/10" />
            <div className="absolute inset-x-2 bottom-2"><p className="text-center text-[9px] font-black text-amber-100">ELDEN LORD</p><p className="text-center text-[6px] text-amber-300">LEGENDARY</p></div>
          </div>
          <div className="min-w-0 pt-2">
            <p className="text-sm font-black text-white">Elden Lord</p><p className="text-[8px] text-white/35">The Fallen Crown</p>
            <div className="mt-3 space-y-2 text-[8px] text-white/48"><p>🔥 +12% Damage Boost</p><p>🟠 +8% XP Gain</p><p>⚔ +6% Move Speed</p><p>✨ +4% Rare Drop Rate</p></div>
          </div>
        </div>
      </Section>
      <Section className="col-span-4">
        <SectionTitle title="Collection Overview" icon={Grid3X3} />
        <div className="px-4 pb-4"><p className="text-3xl font-black text-cyan-200">248</p><p className="text-[7px] text-white/28">Total Cards</p><div className="mt-4 grid grid-cols-4 gap-2 text-center">{[['32','Legendary','#facc15'],['78','Epic','#c084fc'],['124','Rare','#22d3ee'],['239','Common','#cbd5e1']].map(([v,l,c])=><div key={l}><div className="mx-auto h-8 w-5 rounded-sm border" style={{borderColor:c}} /><p className="mt-1 text-[9px] font-bold text-white/65">{v}</p><p className="text-[5px]" style={{color:c}}>{l}</p></div>)}</div><div className="mt-4 h-1.5 rounded bg-white/[0.06]"><div className="h-full w-[68%] rounded bg-cyan-400" /></div><p className="mt-1 text-[6px] text-white/25">68% Collection Completion</p></div>
      </Section>
      <Section className="col-span-4"><SectionTitle title="Active Deck / Build" icon={Layers3} /><div className="flex gap-2 px-4 pb-3">{cardArt.slice(0,5).map(([n, _rarity, img])=><img key={n} src={img} alt={n} className="h-20 min-w-0 flex-1 rounded-lg border border-white/[0.08] object-cover opacity-78" />)}</div><div className="grid grid-cols-3 gap-2 px-4 pb-4"><StatTile label="Deck Power" value="3,280" /><StatTile label="Playstyle" value="Balanced" /><StatTile label="Synergy" value="5/5" /></div></Section>
      <Section className="col-span-8">
        <SectionTitle title="My Cards" icon={Layers3} />
        <div className="flex gap-2 px-4 pb-3"><div className="relative flex-1"><Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-white/20" /><input className="h-8 w-full rounded-lg border border-white/[0.06] bg-black/15 pl-8 text-[8px] text-white/60 outline-none" placeholder="Search cards..." /></div><button className="rounded-lg border border-white/[0.06] px-3 text-[7px] text-white/40">All Rarities</button><button className="rounded-lg border border-white/[0.06] px-3 text-[7px] text-white/40">All Types</button></div>
        <div className="grid grid-cols-4 gap-2 px-4 pb-4">{cardArt.map(([n,r,img])=><div key={n} className="overflow-hidden rounded-lg border border-cyan-300/[0.12] bg-black/10"><img src={img} alt={n} className="h-20 w-full object-cover opacity-72" /><div className="p-2"><p className="truncate text-[7px] font-bold text-white/65">{n}</p><p className="text-[6px] text-cyan-200/45">{r}</p></div></div>)}</div>
      </Section>
      <Section className="col-span-4"><SectionTitle title="Recent Unlocks" icon={Sparkles} /><div className="space-y-2 px-4 pb-4">{cardArt.slice(0,5).map(([n,r,img],i)=><div key={n} className="flex items-center gap-2"><img src={img} alt="" className="h-9 w-12 rounded object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-[7px] font-bold text-white/62">{n}</p><p className="text-[6px] text-cyan-200/42">{r}</p></div><span className="text-[6px] text-white/20">{i+2}h ago</span></div>)}</div></Section>
    </div>
  );
}

function ActivityPage() {
  return (
    <div className="grid grid-cols-12 gap-3">
      <Section className="col-span-8"><SectionTitle title="Activity Feed" icon={Activity} /><div className="space-y-2 px-4 pb-4">{[
        ['Unlocked Celestial Blade in Elden Ring','2 hours ago',Trophy],
        ['Finished a 6-match ranked session in Neon Racer','4 hours ago',Gamepad2],
        ['Reached 1,248 total achievements','Yesterday',Crown],
        ['Shared a new clip: Perfect Drift','2 days ago',Film],
        ['Added Starlight to active card deck','3 days ago',Layers3],
        ['Completed Frostline survival challenge','4 days ago',Shield],
      ].map(([t,time,Icon])=><div key={t} className="flex gap-3 rounded-xl border border-white/[0.045] bg-white/[0.015] p-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-300/[0.06]"><Icon className="h-4 w-4 text-cyan-200/62" /></div><div><p className="text-[9px] font-semibold text-white/62">{t}</p><p className="mt-1 text-[7px] text-white/22">{time}</p></div></div>)}</div></Section>
      <div className="col-span-4 space-y-3"><Section><SectionTitle title="This Week" icon={Clock3} action={null} /><div className="grid grid-cols-2 gap-2 px-4 pb-4"><StatTile label="Play Time" value="27h" /><StatTile label="Sessions" value="18" /><StatTile label="Wins" value="42" /><StatTile label="Uploads" value="9" /></div></Section><Section><SectionTitle title="Most Active" icon={Flame} action={null} /><div className="px-4 pb-4"><p className="text-sm font-black text-white/76">Neon Racer</p><p className="mt-1 text-[7px] text-white/28">11h 42m played this week</p><div className="mt-3 h-1 rounded bg-white/[0.06]"><div className="h-full w-[78%] rounded bg-cyan-400" /></div></div></Section></div>
    </div>
  );
}

function ClipsPage() {
  return (
    <div className="grid grid-cols-12 gap-3">
      <Section className="col-span-8">
        <SectionTitle title="Featured Clip" icon={Film} />
        <div className="px-3 pb-3">
          <div className="relative h-[270px] overflow-hidden rounded-xl border border-white/[0.06]">
            <img src={demoGames[0].image} alt="" className="h-full w-full object-cover opacity-72" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
            <button className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white/70 bg-black/35"><Play className="h-6 w-6 fill-white text-white" /></button>
            <div className="absolute inset-x-4 bottom-3"><p className="text-sm font-black text-white">Neon Rush – Perfect Drift</p><p className="text-[7px] text-white/35">Neon Racer · 12.4K views · 842 reactions · 126 comments</p></div>
          </div>
        </div>
      </Section>
      <Section className="col-span-4"><SectionTitle title="Clip Performance" icon={BarChart3} action={null} /><div className="grid grid-cols-2 gap-2 px-4 pb-4"><StatTile label="Views" value="12.4K" sub="+38%" /><StatTile label="Reactions" value="842" sub="+21%" /><StatTile label="Comments" value="126" sub="+12%" /><StatTile label="Shares" value="314" sub="+27%" /></div><div className="px-4 pb-4"><button className="h-9 w-full rounded-lg border border-cyan-300/30 bg-cyan-300/[0.05] text-[8px] font-bold text-cyan-200">View Clip Analytics</button></div></Section>
      <Section className="col-span-12"><SectionTitle title="Recent Clips" icon={Film} /><div className="grid grid-cols-6 gap-2 px-4 pb-4">{clipArt.map(([n,t,img])=><div key={n}><div className="relative h-20 overflow-hidden rounded-lg border border-white/[0.05]"><img src={img} alt={n} className="h-full w-full object-cover opacity-70" /><span className="absolute bottom-1 right-1 rounded bg-black/65 px-1 text-[6px] text-white">{t}</span></div><p className="mt-1 truncate text-[7px] font-bold text-white/58">{n}</p></div>)}</div></Section>
      <Section className="col-span-4"><SectionTitle title="Trending Clips" icon={Flame} /><div className="space-y-2 px-4 pb-4">{clipArt.slice(0,3).map(([n,,img],i)=><div key={n} className="flex gap-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-amber-300/[0.08] text-[8px] font-black text-amber-300">{i+1}</span><img src={img} alt="" className="h-8 w-12 rounded object-cover" /><p className="text-[7px] font-semibold text-white/56">{n}</p></div>)}</div></Section>
      <Section className="col-span-4"><SectionTitle title="Most Viewed" icon={Play} /><div className="px-4 pb-4"><StatTile label="Top Clip" value="112.4K" sub="Zero to Hero · Starfield" /></div></Section>
      <Section className="col-span-4"><SectionTitle title="Top Reactions" icon={Heart} /><div className="px-4 pb-4"><StatTile label="Reactions" value="6.1K" sub="Unstoppable · Elden Ring" /></div></Section>
    </div>
  );
}

function MediaPage() {
  return (
    <div className="grid grid-cols-12 gap-3">
      <Section className="col-span-9">
        <SectionTitle title="Featured Media" icon={ImageIcon} />
        <div className="px-3 pb-3"><div className="relative h-44 overflow-hidden rounded-xl border border-white/[0.06]"><img src={mediaArt[0][2]} alt="" className="h-full w-full object-cover opacity-78" /><div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" /><div className="absolute inset-x-4 bottom-3"><p className="text-[10px] font-black text-white">Neon Horizon</p><p className="text-[7px] text-white/35">Neon Racer · Photo Mode</p></div></div></div>
      </Section>
      <Section className="col-span-3"><SectionTitle title="Upload Stats" icon={Upload} action={null} /><div className="grid grid-cols-2 gap-2 px-4 pb-4"><StatTile label="Uploads" value="247" /><StatTile label="Screenshots" value="124" /><StatTile label="Fan Art" value="68" /><StatTile label="Wallpapers" value="32" /></div></Section>
      <Section className="col-span-9"><SectionTitle title="All Media (247)" icon={Grid3X3} /><div className="flex gap-2 px-4 pb-3">{['All Media','Screenshots','Fan Art','Wallpapers','Photo Mode','Playlists'].map((x,i)=><button key={x} className={`rounded-full border px-3 py-1.5 text-[7px] ${i===0?'border-cyan-300/35 bg-cyan-300/[0.08] text-cyan-200':'border-white/[0.06] text-white/32'}`}>{x}</button>)}</div><div className="grid grid-cols-4 gap-2 px-4 pb-4">{mediaArt.map(([n,t,img])=><div key={n}><img src={img} alt={n} className="h-24 w-full rounded-lg border border-white/[0.05] object-cover opacity-72" /><p className="mt-1 text-[7px] font-bold text-white/58">{n}</p><p className="text-[6px] text-white/25">{t}</p></div>)}</div></Section>
      <div className="col-span-3 space-y-3"><Section><SectionTitle title="Favorite Media" icon={Star} /><div className="grid grid-cols-3 gap-1.5 px-4 pb-4">{mediaArt.slice(0,3).map(([n,,img])=><img key={n} src={img} alt={n} className="h-14 w-full rounded-md object-cover" />)}</div></Section><Section><SectionTitle title="Recent Comments" icon={MessageSquare} /><div className="space-y-2 px-4 pb-4">{['This shot is insane! 🔥','Clean edit, wallpaper material!','What a vibe. Love this game.'].map((t,i)=><div key={t}><p className="text-[7px] font-bold text-white/58">{['Ariana','marcus flowers','Kairo'][i]}</p><p className="text-[7px] text-white/28">{t}</p></div>)}</div></Section></div>
    </div>
  );
}

function StatsPage() {
  return (
    <div className="grid grid-cols-12 gap-3">
      <Section className="col-span-12"><SectionTitle title="Career Stats" icon={BarChart3} /><div className="grid grid-cols-6 gap-2 px-4 pb-4"><StatTile label="Hours Played" value="3.4K" /><StatTile label="Games" value="28" /><StatTile label="Wins" value="1,094" /><StatTile label="Achievements" value="1.2K" /><StatTile label="Perfect Games" value="37" /><StatTile label="Card Power" value="3.3K" /></div></Section>
      <Section className="col-span-7"><SectionTitle title="Genre Mastery" icon={Layers3} /><div className="space-y-3 px-4 pb-4">{demoGames.map(g=><div key={g.genre}><div className="flex justify-between text-[7px]"><span className="text-white/52">{g.genre}</span><span className="text-cyan-200/52">{g.progress}%</span></div><div className="mt-1 h-1.5 rounded bg-white/[0.05]"><div className="h-full rounded bg-gradient-to-r from-cyan-500 to-blue-400" style={{width:`${g.progress}%`}} /></div></div>)}</div></Section>
      <Section className="col-span-5"><SectionTitle title="Competitive Snapshot" icon={Swords} /><div className="grid grid-cols-2 gap-2 px-4 pb-4"><StatTile label="Rank" value="Diamond II" /><StatTile label="Win Rate" value="59%" /><StatTile label="K/D" value="2.18" /><StatTile label="Streak" value="12W" /></div></Section>
    </div>
  );
}

function AboutPage({ friend }) {
  return (
    <div className="grid grid-cols-12 gap-3">
      <Section className="col-span-7"><SectionTitle title="About" icon={BookOpen} action={null} /><div className="px-4 pb-4"><p className="text-sm font-bold text-white/76">{friend.name}</p><p className="mt-2 max-w-2xl text-[9px] leading-5 text-white/38">Competitive player, collector, clip maker and achievement hunter. Loves racing, RPGs and finding difficult challenges worth mastering.</p><div className="mt-5 grid grid-cols-2 gap-3">{[['Location','Detroit, MI'],['Member Since','Mar 2024'],['Current Game',friend.game || 'Neon Racer'],['Status',friend.status || 'Online']].map(([l,v])=><div key={l}><p className="text-[6px] font-black uppercase tracking-[.16em] text-white/18">{l}</p><p className="mt-1 text-[9px] text-white/56">{v}</p></div>)}</div></div></Section>
      <Section className="col-span-5"><SectionTitle title="Favorite Genres" icon={Heart} action={null} /><div className="flex flex-wrap gap-2 px-4 pb-4">{['RPG','Action','Racing','Horror','Strategy','Shooter'].map(x=><span key={x} className="rounded-full border border-cyan-300/[0.12] bg-cyan-300/[0.035] px-3 py-1.5 text-[7px] text-cyan-100/52">{x}</span>)}</div></Section>
      <Section className="col-span-12"><SectionTitle title="Profile Badges" icon={Crown} /><div className="grid grid-cols-5 gap-2 px-4 pb-4">{['Elden Lord','The Legend','Survivor','Master Pilot','Night City Legend'].map((x,i)=><div key={x} className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-4 text-center"><div className={`mx-auto grid h-10 w-10 place-items-center rounded-xl ${['bg-amber-300/10','bg-cyan-300/10','bg-violet-300/10','bg-sky-300/10','bg-fuchsia-300/10'][i]}`}><Star className="h-4 w-4 text-white/60" /></div><p className="mt-2 text-[8px] font-bold text-white/58">{x}</p></div>)}</div></Section>
    </div>
  );
}

export default function FriendProfileOverlay({ friend, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showChat, setShowChat] = useState(false);

  const normalized = useMemo(() => ({
    id: friend?.id || friend?.friend_id || 'friend',
    name: friend?.name || friend?.friend_name || friend?.display_name || 'Player',
    avatar: friend?.avatar || friend?.friend_avatar || `https://i.pravatar.cc/300?u=${friend?.friend_id || friend?.id || 'friend'}`,
    status: friend?.status || 'online',
    game: friend?.game || friend?.current_game || 'Neon Racer',
    background: friend?.bg_image || 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=1600&q=90',
  }), [friend]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      if (showChat) setShowChat(false);
      else onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showChat, onClose]);

  const content = {
    overview: <OverviewPage />,
    achievements: <AchievementsPage />,
    games: <GamesPage />,
    cards: <CardsPage />,
    activity: <ActivityPage />,
    clips: <ClipsPage />,
    media: <MediaPage />,
    stats: <StatsPage />,
    about: <AboutPage friend={normalized} />,
  }[activeTab];

  return (
    <AnimatePresence>
      <motion.div
        key="friend-profile-redesign"
        initial={{ opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 18 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="fixed z-[68] overflow-hidden text-white"
        style={{
          left: '320px',
          top: '64px',
          right: 0,
          bottom: '52px',
          background: 'linear-gradient(180deg, rgba(6,12,22,.98), rgba(4,10,18,.98))',
          borderLeft: '1px solid rgba(125,211,252,.09)',
        }}
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="relative h-[208px] shrink-0 overflow-hidden border-b border-cyan-200/[0.10]">
            <img src={normalized.background} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,9,17,.96)_0%,rgba(4,11,20,.74)_38%,rgba(4,10,18,.34)_70%,rgba(3,8,15,.72)_100%)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#06101c] via-transparent to-black/10" />

            <div className="absolute inset-x-0 bottom-0 top-0 flex items-end px-6 pb-5">
              <div className="flex min-w-0 flex-1 items-end gap-5">
                <div className="relative h-[170px] w-[155px] shrink-0 overflow-hidden rounded-t-[34px] border border-white/[0.06] bg-black/15">
                  <img src={normalized.avatar} alt={normalized.name} className="h-full w-full object-cover object-top opacity-88" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07101b]/85 via-transparent to-transparent" />
                </div>

                <div className="min-w-0 flex-1 pb-1">
                  <div className="flex items-center gap-2">
                    <h1 className="truncate text-[28px] font-black tracking-tight text-white">{normalized.name}</h1>
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.55)]" />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[8px] text-white/48">
                    <span className="text-emerald-300/80">● {normalized.status}</span><span>·</span><span>{normalized.game}</span>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-full border border-cyan-200/25 bg-black/25 text-xl font-black text-white">47</div>
                    <div className="w-64 max-w-[38vw]">
                      <div className="flex justify-between text-[7px] text-white/30"><span>12,449 / 28,000 XP</span><span>Lv. 47</span></div>
                      <div className="mt-1 h-1.5 rounded-full bg-white/[0.07]"><div className="h-full w-[44%] rounded-full bg-gradient-to-r from-cyan-500 to-sky-300" /></div>
                      <p className="mt-1.5 text-[8px] italic text-white/46">“Different games. Same drive.”</p>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-4 text-[7px] text-white/34">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Detroit, MI</span>
                    <span className="flex items-center gap-1"><Clock3 className="h-3 w-3" /> Member since Mar 2024</span>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button onClick={() => setShowChat(true)} className="flex h-8 items-center gap-2 rounded-lg bg-cyan-400 px-4 text-[8px] font-black text-[#03111b] hover:bg-cyan-300"><MessageSquare className="h-3 w-3" /> Message</button>
                    <button className="flex h-8 items-center gap-2 rounded-lg border border-white/[0.10] bg-black/20 px-4 text-[8px] font-semibold text-white/62"><Users className="h-3 w-3" /> Invite to Party</button>
                    <button className="flex h-8 items-center gap-2 rounded-lg border border-white/[0.10] bg-black/20 px-3 text-[8px] font-semibold text-white/48">More <ChevronRight className="h-3 w-3 rotate-90" /></button>
                  </div>
                </div>
              </div>

              <div className="mb-1 ml-4 grid w-[430px] max-w-[37vw] grid-cols-5 overflow-hidden rounded-xl border border-cyan-200/[0.12] bg-[#07101b]/72 backdrop-blur-xl">
                {[['652','Friends'],['28','Games'],['1.2K','Achievements'],['4','Clans'],['3.3K','Card Power']].map(([v,l]) => (
                  <div key={l} className="border-r border-white/[0.05] px-3 py-3 text-center last:border-r-0"><p className="text-lg font-black text-white/90">{v}</p><p className="mt-0.5 text-[6px] uppercase tracking-[.1em] text-white/30">{l}</p></div>
                ))}
              </div>
            </div>

            <button onClick={onClose} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg border border-white/[0.08] bg-black/25 text-white/46 hover:text-white"><X className="h-4 w-4" /></button>
          </div>

          <nav className="flex h-10 shrink-0 items-center border-b border-cyan-200/[0.10] bg-[#07111e]/96 px-3">
            {NAV_ITEMS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`relative h-full min-w-0 flex-1 px-2 text-[8px] font-semibold transition-colors ${activeTab === id ? 'text-white' : 'text-white/42 hover:text-white/65'}`}
              >
                {label}
                {activeTab === id && <span className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,.75)]" />}
              </button>
            ))}
          </nav>

          <div className="min-h-0 flex-1 overflow-y-auto p-3.5" style={{ scrollbarWidth: 'thin' }}>
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.14 }}>
                {content}
              </motion.div>
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {showChat && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-[#050b14]/96 backdrop-blur-xl">
                <div className="flex h-full flex-col">
                  <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] px-5">
                    <div className="flex items-center gap-3"><img src={normalized.avatar} alt="" className="h-8 w-8 rounded-full object-cover" /><div><p className="text-[10px] font-bold text-white/80">{normalized.name}</p><p className="text-[7px] text-emerald-300/60">Active now</p></div></div>
                    <button onClick={() => setShowChat(false)} className="grid h-8 w-8 place-items-center rounded-lg border border-white/[0.07]"><X className="h-4 w-4 text-white/50" /></button>
                  </div>
                  <div className="min-h-0 flex-1">
                    <FriendMessenger
                      friend={{
                        friend_id: normalized.id?.toString(),
                        friend_name: normalized.name,
                        friend_avatar: normalized.avatar,
                        status: normalized.status,
                        current_game: normalized.game,
                      }}
                      onClose={() => setShowChat(false)}
                      inline
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}