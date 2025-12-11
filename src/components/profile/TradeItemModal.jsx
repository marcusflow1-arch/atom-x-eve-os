import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeftRight, DollarSign, Gavel, ShoppingBag, TrendingUp, Sparkles, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const rarityStyles = {
  Common: { text: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-500/50' },
  Uncommon: { text: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/50' },
  Rare: { text: 'text-blue-400', bg: 'bg-blue-500/20', border: 'border-blue-500/50' },
  Epic: { text: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/50' },
  Legendary: { text: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/50' },
  Mythic: { text: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/50' }
};

export default function TradeItemModal({ item, isOpen, onClose }) {
  const navigate = useNavigate();
  const [listingType, setListingType] = useState('marketplace'); // 'marketplace' or 'trading_post'
  const [saleType, setSaleType] = useState('sale'); // 'sale', 'trade', 'bid'
  const [price, setPrice] = useState('');
  const [minBid, setMinBid] = useState('');
  const [buyoutPrice, setBuyoutPrice] = useState('');
  const [seekingItems, setSeekingItems] = useState('');
  const [description, setDescription] = useState('');
  const [expirationDays, setExpirationDays] = useState('7');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!item) return null;

  const rarity = rarityStyles[item.rarity] || rarityStyles.Common;

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Create the listing data
      const listingData = {
        item_id: item.id,
        item_name: item.name,
        item_type: item.type,
        item_rarity: item.rarity,
        item_image: item.image,
        item_game: item.game,
        listing_type: listingType,
        sale_type: saleType,
        description: description,
        price: saleType === 'sale' ? parseInt(price) : null,
        min_bid: saleType === 'bid' ? parseInt(minBid) : null,
        buyout_price: saleType === 'bid' ? parseInt(buyoutPrice) : null,
        seeking_items: saleType === 'trade' ? seekingItems.split(',').map(s => s.trim()).filter(Boolean) : [],
        expires_at: new Date(Date.now() + parseInt(expirationDays) * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active'
      };

      // Navigate to the appropriate page with listing data
      const targetPage = listingType === 'marketplace' ? 'Store?mode=marketplace' : 'Store?mode=trading';
      
      // Store in session storage for the target page to pick up
      sessionStorage.setItem('pending_listing', JSON.stringify(listingData));
      
      onClose();
      navigate(createPageUrl(targetPage));
    } catch (error) {
      console.error('Failed to create listing:', error);
      alert('Failed to create listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900/95 backdrop-blur-2xl border-white/10 max-w-3xl text-white p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b border-white/10">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-cyan-400" />
            List Item for Trade
          </DialogTitle>
          <p className="text-white/40 text-sm mt-1">Choose where and how to list your item</p>
        </DialogHeader>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Item Preview */}
          <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-white/10">
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 ${rarity.border}">
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-white truncate">{item.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={`${rarity.bg} ${rarity.text} border-none text-xs`}>{item.rarity}</Badge>
                <span className="text-white/40 text-sm">{item.type}</span>
              </div>
            </div>
          </div>

          {/* Listing Platform Selection */}
          <div>
            <label className="text-sm font-semibold text-white mb-3 block">Select Platform</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setListingType('marketplace')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  listingType === 'marketplace'
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <ShoppingBag className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <div className="text-sm font-bold text-white">Black Market</div>
                <div className="text-xs text-white/50 mt-1">Quick sales, instant currency</div>
              </button>
              <button
                onClick={() => setListingType('trading_post')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  listingType === 'trading_post'
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <ArrowLeftRight className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <div className="text-sm font-bold text-white">Galactic Exchange</div>
                <div className="text-xs text-white/50 mt-1">Player trades, item swaps</div>
              </button>
            </div>
          </div>

          {/* Sale Type Selection */}
          <div>
            <label className="text-sm font-semibold text-white mb-3 block">Sale Method</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setSaleType('sale')}
                className={`px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  saleType === 'sale'
                    ? 'bg-green-600 text-white border-2 border-green-400'
                    : 'bg-white/5 text-white/60 border-2 border-white/10 hover:bg-white/10'
                }`}
              >
                <DollarSign className="w-4 h-4 mx-auto mb-1" />
                Fixed Price
              </button>
              <button
                onClick={() => setSaleType('trade')}
                className={`px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  saleType === 'trade'
                    ? 'bg-blue-600 text-white border-2 border-blue-400'
                    : 'bg-white/5 text-white/60 border-2 border-white/10 hover:bg-white/10'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4 mx-auto mb-1" />
                Item Trade
              </button>
              <button
                onClick={() => setSaleType('bid')}
                className={`px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  saleType === 'bid'
                    ? 'bg-purple-600 text-white border-2 border-purple-400'
                    : 'bg-white/5 text-white/60 border-2 border-white/10 hover:bg-white/10'
                }`}
              >
                <Gavel className="w-4 h-4 mx-auto mb-1" />
                Auction
              </button>
            </div>
          </div>

          {/* Dynamic Fields Based on Sale Type */}
          <AnimatePresence mode="wait">
            {saleType === 'sale' && (
              <motion.div
                key="sale"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <label className="text-sm font-semibold text-white mb-2 block">Fixed Price (AGP)</label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="5000"
                  className="bg-slate-800 border-white/20 text-white"
                />
                <p className="text-xs text-white/40 mt-1">Suggested: {((item.power || 100) * 50).toLocaleString()} AGP</p>
              </motion.div>
            )}

            {saleType === 'trade' && (
              <motion.div
                key="trade"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <label className="text-sm font-semibold text-white mb-2 block">Items You're Seeking (comma separated)</label>
                <Input
                  value={seekingItems}
                  onChange={(e) => setSeekingItems(e.target.value)}
                  placeholder="Plasma Rifle, Cyber Armor, Epic Shield"
                  className="bg-slate-800 border-white/20 text-white"
                />
                <p className="text-xs text-white/40 mt-1">List specific items or categories you want in exchange</p>
              </motion.div>
            )}

            {saleType === 'bid' && (
              <motion.div
                key="bid"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-sm font-semibold text-white mb-2 block">Starting Bid (AGP)</label>
                  <Input
                    type="number"
                    value={minBid}
                    onChange={(e) => setMinBid(e.target.value)}
                    placeholder="1000"
                    className="bg-slate-800 border-white/20 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-white mb-2 block">Buyout Price (AGP)</label>
                  <Input
                    type="number"
                    value={buyoutPrice}
                    onChange={(e) => setBuyoutPrice(e.target.value)}
                    placeholder="10000"
                    className="bg-slate-800 border-white/20 text-white"
                  />
                  <p className="text-xs text-white/40 mt-1">Optional instant purchase price</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Description */}
          <div>
            <label className="text-sm font-semibold text-white mb-2 block">Listing Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your item, condition, or trade preferences..."
              className="bg-slate-800 border-white/20 text-white min-h-[100px]"
            />
          </div>

          {/* Expiration */}
          <div>
            <label className="text-sm font-semibold text-white mb-2 block">Listing Duration (Days)</label>
            <select
              value={expirationDays}
              onChange={(e) => setExpirationDays(e.target.value)}
              className="w-full bg-slate-800 border border-white/20 text-white rounded-lg px-3 py-2"
            >
              <option value="1">1 Day</option>
              <option value="3">3 Days</option>
              <option value="7">7 Days</option>
              <option value="14">14 Days</option>
              <option value="30">30 Days</option>
            </select>
          </div>

          {/* Info Box */}
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-cyan-400 font-bold text-sm mb-1">Market Insights</h4>
                <p className="text-white/60 text-xs">
                  {saleType === 'sale' && `Similar ${item.rarity} ${item.type}s are selling for ${((item.power || 100) * 40).toLocaleString()} - ${((item.power || 100) * 60).toLocaleString()} AGP`}
                  {saleType === 'trade' && 'Item trades are most successful when seeking items of equal or lower rarity'}
                  {saleType === 'bid' && 'Auctions typically close 20-30% above starting bid'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-slate-800/30 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-white/20 text-white hover:bg-white/10"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (saleType === 'sale' && !price) || (saleType === 'bid' && !minBid)}
            className={`flex-1 font-bold ${
              listingType === 'marketplace' 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Listing...' : `List on ${listingType === 'marketplace' ? 'Black Market' : 'Galactic Exchange'}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}