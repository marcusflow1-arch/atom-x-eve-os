import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ArrowLeftRight, DollarSign, Tag, ShoppingCart, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { generateCardListings } from './tradingPostMock';

const rarityText = {
  Mythic: 'text-red-400', Legendary: 'text-orange-400', Epic: 'text-purple-400',
  Rare: 'text-blue-400', Uncommon: 'text-green-400', Common: 'text-slate-400',
};

function ListingRow({ listing, onAction }) {
  const isSell = listing.side === 'sell';
  return (
    <div className="flex items-center justify-between gap-3 py-3 px-3 rounded-lg hover:bg-white/5 transition-colors border-b border-white/5">
      <div className="flex items-center gap-3 min-w-0">
        <img src={listing.trader.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-white/10" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium truncate">{listing.trader.name}</span>
            <span className="flex items-center gap-0.5 text-yellow-400 text-[10px]">
              <Star className="w-3 h-3 fill-current" /> {listing.trader.rating}
            </span>
          </div>
          <p className="text-[11px] text-white/40 truncate">{listing.note}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-shrink-0">
        {listing.acceptsTrade && (
          <Badge className="bg-blue-500/15 text-blue-300 border-blue-500/30 text-[9px] hidden md:flex items-center gap-1">
            <ArrowLeftRight className="w-2.5 h-2.5" /> Trade OK
          </Badge>
        )}
        <span className="text-[10px] text-white/40 font-mono hidden sm:block">x{listing.quantity}</span>
        <span className={`text-sm font-bold font-mono ${isSell ? 'text-cyan-300' : 'text-green-400'}`}>
          {listing.price.toLocaleString()} AGP
        </span>
        <Button
          size="sm"
          onClick={() => onAction(listing)}
          className={`h-8 px-3 text-xs font-bold ${isSell ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-green-600 hover:bg-green-500'} text-white`}
        >
          {isSell ? 'Buy' : 'Sell'}
        </Button>
      </div>
    </div>
  );
}

// Level 3: MMORPG-style buyer/seller board for a single card.
export default function TradingPostListingBoard({ card }) {
  const [tab, setTab] = useState('sell'); // 'sell' = buy from sellers, 'buy' = sell to buyers
  const [offerPrice, setOfferPrice] = useState('');
  const [toast, setToast] = useState(null);

  const listings = useMemo(() => generateCardListings(card), [card]);
  const sellers = listings.filter((l) => l.side === 'sell').sort((a, b) => a.price - b.price);
  const buyers = listings.filter((l) => l.side === 'buy').sort((a, b) => b.price - a.price);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleAction = (listing) => {
    if (listing.side === 'sell') showToast(`Purchased from ${listing.trader.name} for ${listing.price.toLocaleString()} AGP`);
    else showToast(`Sold to ${listing.trader.name} for ${listing.price.toLocaleString()} AGP`);
  };

  const handlePostOffer = () => {
    if (!offerPrice) return;
    showToast(tab === 'sell'
      ? `Buy offer posted: ${Number(offerPrice).toLocaleString()} AGP — sellers can fill it directly`
      : `Sell listing posted: ${Number(offerPrice).toLocaleString()} AGP — buyers can purchase it`);
    setOfferPrice('');
  };

  const active = tab === 'sell' ? sellers : buyers;

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 overflow-hidden">
      {/* Card preview */}
      <div className="lg:w-80 flex-shrink-0">
        <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-900/50 h-full flex flex-col">
          <div className="aspect-square relative">
            <img src={card.image} alt={card.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          </div>
          <div className="p-5 flex-1">
            <h2 className="text-lg font-bold text-white mb-1">{card.name}</h2>
            <p className={`text-xs font-bold uppercase mb-3 ${rarityText[card.rarity] || rarityText.Common}`}>
              {card.rarity} · {card.type}
            </p>
            <p className="text-white/50 text-sm mb-4">{card.description}</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-white/40">Game</span><span className="text-white truncate ml-2">{card.game}</span></div>
              <div className="flex justify-between"><span className="text-white/40">Market Price</span><span className="text-cyan-300 font-mono">{card.marketPrice.toLocaleString()} AGP</span></div>
              <div className="flex justify-between"><span className="text-white/40">Sellers</span><span className="text-white">{sellers.length}</span></div>
              <div className="flex justify-between"><span className="text-white/40">Buyers</span><span className="text-white">{buyers.length}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tabs */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setTab('sell')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              tab === 'sell' ? 'bg-cyan-600 border-cyan-500 text-white' : 'border-white/10 text-white/50 hover:text-white'
            }`}
          >
            <ShoppingCart className="w-4 h-4" /> Buy ({sellers.length} sellers)
          </button>
          <button
            onClick={() => setTab('buy')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              tab === 'buy' ? 'bg-green-600 border-green-500 text-white' : 'border-white/10 text-white/50 hover:text-white'
            }`}
          >
            <Tag className="w-4 h-4" /> Sell ({buyers.length} buyers)
          </button>
        </div>

        {/* Listings */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 rounded-2xl border border-white/10 bg-slate-900/30 px-2">
          <div className="flex items-center justify-between px-3 py-2 text-[10px] uppercase tracking-widest text-white/35 border-b border-white/10 sticky top-0 bg-slate-900/80 backdrop-blur-sm">
            <span>{tab === 'sell' ? 'Seller' : 'Buyer'}</span>
            <span>Price / Action</span>
          </div>
          {active.length === 0 ? (
            <div className="text-center py-10 text-white/40 text-sm">No {tab === 'sell' ? 'sellers' : 'buyers'} yet — be the first below.</div>
          ) : (
            active.map((l) => <ListingRow key={l.id} listing={l} onAction={handleAction} />)
          )}
        </div>

        {/* Post your own offer */}
        <div className="mt-4 p-4 rounded-2xl border border-white/10 bg-white/[0.03]">
          <p className="text-xs uppercase tracking-wider text-white/40 mb-2 flex items-center gap-2">
            {tab === 'sell' ? <><DollarSign className="w-3.5 h-3.5" /> Place a Buy Offer (let a seller fill it)</> : <><Tag className="w-3.5 h-3.5" /> List Yours for Sale</>}
          </p>
          <div className="flex gap-2">
            <Input
              type="number"
              value={offerPrice}
              onChange={(e) => setOfferPrice(e.target.value)}
              placeholder="Price in AGP"
              className="bg-black/30 border-white/15 text-white h-11"
            />
            <Button onClick={handlePostOffer} className={`h-11 px-5 font-bold ${tab === 'sell' ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-green-600 hover:bg-green-500'} text-white`}>
              <Send className="w-4 h-4 mr-1" /> Post
            </Button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl bg-slate-800 border border-white/15 text-white text-sm shadow-2xl"
        >
          {toast}
        </motion.div>
      )}
    </div>
  );
}