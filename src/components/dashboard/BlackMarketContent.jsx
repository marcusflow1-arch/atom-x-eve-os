import TradingPostContent from '@/components/store/TradingPostContent';

export default function BlackMarketContent({ cardSearchQuery = '' }) {
  return <TradingPostContent market="black_market" searchTerm={cardSearchQuery} />;
}
