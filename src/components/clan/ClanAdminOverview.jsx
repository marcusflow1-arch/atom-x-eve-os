import React, { useState } from 'react';
import { Shield, Zap, ClipboardList, TrendingUp } from 'lucide-react';
import ClanTreasuryPage from '@/components/clan/ClanTreasuryPage';
import ClanSchedulePage from '@/components/clan/ClanSchedulePage';
import ClanUpgradesPage from '@/components/clan/ClanUpgradesPage';

export default function ClanAdminOverview({ clan }) {
    const [activeTab, setActiveTab] = useState('treasury');

    return (
        <div className="clan-admin" data-testid="clan-admin">
            <header className="clan-admin-heading">
                <div><span className="clan-eyebrow">{clan.name} / Management</span><h1>Admin Overview</h1><p>Guild Master & Officers Only</p></div>
                <div className="clan-tab-line" role="tablist" aria-label="Clan management">
                    {[['treasury', 'Treasury', Zap], ['schedule', 'Schedule', ClipboardList], ['upgrades', 'Upgrades', TrendingUp]].map(([id, label, Icon]) => <button type="button" role="tab" aria-selected={activeTab === id} key={id} onClick={() => setActiveTab(id)}><Icon size={14} />{label}</button>)}
                </div>
            </header>
            <div className="clan-admin-body" role="tabpanel" aria-label={activeTab}>
                {activeTab === 'treasury' && <ClanTreasuryPage clan={clan} />}
                {activeTab === 'schedule' && <ClanSchedulePage clan={clan} />}
                {activeTab === 'upgrades' && <ClanUpgradesPage clan={clan} />}
            </div>
        </div>
    );
}