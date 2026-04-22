import React from 'react';
import GameOverviewTab from './GameOverviewTab';

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'store', label: 'Store' },
  { id: 'dev', label: 'Dev Overview' },
  { id: 'updates', label: 'Updates' },
  { id: 'community', label: 'Community' },
];

export default function GameHubTabs({ activeTab, onTabChange, game, designMode, isOwned }) {
  const tabStyles = {
    default: {
      navBg: 'bg-slate-800/50 border-b border-white/10',
      tabActive: 'text-white border-b-2 border-blue-500',
      tabInactive: 'text-slate-400 hover:text-white border-b-2 border-transparent',
      contentBg: 'bg-slate-900',
    },
    minimal: {
      navBg: 'bg-gray-100 border-b border-gray-300',
      tabActive: 'text-black border-b-4 border-black',
      tabInactive: 'text-gray-500 hover:text-black border-b-4 border-transparent',
      contentBg: 'bg-white',
    },
    dark: {
      navBg: 'bg-black border-b border-white/5',
      tabActive: 'text-white border-b-3 border-white',
      tabInactive: 'text-gray-500 hover:text-white border-b-3 border-transparent',
      contentBg: 'bg-black',
    },
  };

  const style = tabStyles[designMode];

  return (
    <div className={style.contentBg}>
      {/* Tab Navigation */}
      <div className={`sticky top-0 z-40 ${style.navBg}`}>
        <div className="max-w-6xl mx-auto flex gap-1 px-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-4 py-3 font-bold text-sm uppercase tracking-wider transition-all ${
                activeTab === tab.id ? style.tabActive : style.tabInactive
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        {activeTab === 'overview' && (
          <GameOverviewTab game={game} designMode={designMode} />
        )}
        {activeTab === 'store' && (
          <div className="text-white text-center py-12">Store content coming soon</div>
        )}
        {activeTab === 'dev' && (
          <div className="text-white text-center py-12">Dev Overview coming soon</div>
        )}
        {activeTab === 'updates' && (
          <div className="text-white text-center py-12">Updates coming soon</div>
        )}
        {activeTab === 'community' && (
          <div className="text-white text-center py-12">Community coming soon</div>
        )}
      </div>
    </div>
  );
}