import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StoreBottomNav from '@/components/store/StoreBottomNav';

/**
 * UniversalStoreNav
 * Renders the full StoreBottomNav on any page.
 * Tab clicks navigate to the Store page with the correct mode.
 * If already on the Store page, this is not used (Store uses StoreBottomNav directly).
 */
export default function UniversalStoreNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchValue, setSearchValue] = useState('');

  // Derive which tab is "active" based on current URL (passive highlight only)
  const path = location.pathname.toLowerCase();
  const activeTab = path.includes('/store') ? 'store' : null;

  const handleTabChange = (tabId) => {
    switch (tabId) {
      case 'store':
        navigate(createPageUrl('Store'));
        break;
      case 'marketplace':
        navigate(createPageUrl('Store') + '?mode=marketplace');
        break;
      case 'trading':
        navigate(createPageUrl('Store') + '?mode=trading');
        break;
      case 'devcards':
        navigate(createPageUrl('Store') + '?mode=devcards');
        break;
      case 'overview':
        navigate(createPageUrl('Store') + '?mode=overview');
        break;
      default:
        navigate(createPageUrl('Store'));
    }
  };

  return (
    <StoreBottomNav
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onSearch={setSearchValue}
      showDevLabel={false}
    />
  );
}