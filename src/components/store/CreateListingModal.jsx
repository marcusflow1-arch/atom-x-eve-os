import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, DollarSign, Gavel, ArrowLeftRight, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function CreateListingModal({ isOpen, onClose, userItems, onSubmit, submitting }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [offerType, setOfferType] = useState('sale');
  const [price, setPrice] = useState('');
  const [startingBid, setStartingBid] = useState('');
  const [buyoutPrice, setBuyoutPrice] = useState('');
  const [seekingItems, setSeekingItems] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!selectedItem) {
      alert('Please select an item');
      return;
    }

    if (offerType === 'sale' && !price) {
      alert('Please set a price');
      return;
    }

    if (offerType === 'bid' && (!startingBid || !buyoutPrice)) {
      alert('Please set starting bid and buyout price');
      return;
    }

    onSubmit({
      itemId: selectedItem.id,
      offerType,
      price: offerType === 'sale' ? Number(price) : null,
      startingBid: offerType === 'bid' ? Number(startingBid) : null,
      buyoutPrice: offerType === 'bid' ? Number(buyoutPrice) : null,
      seekingItems: offerType === 'trade' ? seekingItems.split(',').map(s => s.trim()).filter(Boolean) : [],
      description
    });
  };

  const rarityStyles = {
    Common: { text: 'text-slate-400', bg: 'bg-slate-500/20' },
    Uncommon: { text: 'text-green-400', bg: 'bg-green-500/20' },
    Rare: { text: 'text-blue-400', bg: 'bg-blue-500/20' },
    Epic: { text: 'text-purple-400', bg: 'bg-purple-500/20' },
    Legendary: { text: 'text-orange-400', bg: 'bg-orange-500/20' },
    Mythic: { text: 'text-red-400', bg: 'bg-red-500/20' }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950/95 backdrop-blur-xl border-white/10 max-w-4xl text-white p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Create Listing</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Select Item */}
          <div>
            <h3 className="text-white/60 text-sm font-bold mb-3">Select Item to List</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {userItems.length > 0 ? (
                userItems.map(item => {
                  const rarity = rarityStyles[item.rarity] || rarityStyles.Common;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedItem?.id === item.id
                          ? 'bg-cyan-500/20 border-cyan-500/40'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-black/40 rounded overflow-hidden">
                          <img src={item.icon_url} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-white font-medium text-sm truncate">{item.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`${rarity.bg} ${rarity.text} text-[10px] border-none`}>
                              {item.rarity}
                            </Badge>
                            <span className="text-white/40 text-xs">{item.type}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-white/20 mx-auto mb-2" />
                  <p className="text-white/40 text-sm">No items available to list</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Listing Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-white/60 text-sm font-bold mb-3">Listing Type</h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setOfferType('sale')}
                  className={`p-3 rounded-lg border transition-all ${
                    offerType === 'sale'
                      ? 'bg-green-500/20 border-green-500/40 text-green-300'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <DollarSign className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs font-medium">Sale</span>
                </button>
                <button
                  onClick={() => setOfferType('bid')}
                  className={`p-3 rounded-lg border transition-all ${
                    offerType === 'bid'
                      ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <Gavel className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs font-medium">Auction</span>
                </button>
                <button
                  onClick={() => setOfferType('trade')}
                  className={`p-3 rounded-lg border transition-all ${
                    offerType === 'trade'
                      ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <ArrowLeftRight className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs font-medium">Trade</span>
                </button>
              </div>
            </div>

            {offerType === 'sale' && (
              <div>
                <label className="text-white/60 text-sm font-bold mb-2 block">Price (AGP)</label>
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Enter price..."
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            )}

            {offerType === 'bid' && (
              <div className="space-y-3">
                <div>
                  <label className="text-white/60 text-sm font-bold mb-2 block">Starting Bid (AGP)</label>
                  <Input
                    type="number"
                    value={startingBid}
                    onChange={(e) => setStartingBid(e.target.value)}
                    placeholder="Minimum bid..."
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-sm font-bold mb-2 block">Buyout Price (AGP)</label>
                  <Input
                    type="number"
                    value={buyoutPrice}
                    onChange={(e) => setBuyoutPrice(e.target.value)}
                    placeholder="Instant buy price..."
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
            )}

            {offerType === 'trade' && (
              <div>
                <label className="text-white/60 text-sm font-bold mb-2 block">Seeking Items (comma-separated)</label>
                <Input
                  value={seekingItems}
                  onChange={(e) => setSeekingItems(e.target.value)}
                  placeholder="e.g., Legendary Sword, Epic Shield"
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            )}

            <div>
              <label className="text-white/60 text-sm font-bold mb-2 block">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details about your item..."
                className="bg-white/5 border-white/10 text-white h-24"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || !selectedItem}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold"
            >
              {submitting ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                    <Package className="w-4 h-4 mr-2" />
                  </motion.div>
                  Creating...
                </>
              ) : (
                'Create Listing'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}