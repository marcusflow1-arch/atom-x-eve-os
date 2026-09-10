import React from 'react';

export default function ClanHomeSummary() {
  return <div className="clan-home-summary">
    <section aria-labelledby="clan-updates-title">
      <span className="clan-eyebrow">01 / Progress</span><h2 id="clan-updates-title">Clan updates</h2>
      <div className="clan-progress-list">{[['Command Center', 'T3', 72], ['Armory', 'T2', 45], ['Barracks', 'T1', 15]].map(([name, tier, progress]) => <div key={name} className="clan-progress-row">
        <div><span>{name} <small>{tier}</small></span><span>{progress}%</span></div>
        <div className="clan-progress-track" role="progressbar" aria-label={name} aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress}%` }} /></div>
      </div>)}</div>
    </section>
    <section aria-labelledby="clan-home-schedule-title">
      <span className="clan-eyebrow">02 / Together</span><h2 id="clan-home-schedule-title">Schedule</h2>
      <div className="clan-agenda-row"><div className="clan-agenda-date"><small>Oct</small><strong>24</strong></div><div><h3>Sector 7 Domination Raid</h3><p>20:00 UTC · 12/24 Joined</p></div></div>
      <div className="clan-agenda-row"><div className="clan-agenda-date"><small>Oct</small><strong>25</strong></div><div><h3>Weekly Meeting</h3><p>18:00 UTC · Voice Chat</p></div></div>
    </section>
  </div>;
}