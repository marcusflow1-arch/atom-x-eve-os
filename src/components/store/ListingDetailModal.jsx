import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, DollarSign, Gavel, ShoppingCart, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function ListingDetailModal({ listing, isOpen, onClose, onPurchase, onPlaceBid, isOwner }) {
  const [bidAmount, setBidAmount] = useState('');

  if (!listing) return null;

  const rarityStyles = {
    Common: { text: 'text-slate-400', bg: 'bg-slate-500/20' },
    Uncommon: { text: 'text-green-400', bg: 'bg-green-500/20' },
    Rare: { text: 'text-blue-400', bg: 'bg-blue-500/20' },
    Epic: { text: 'text-purple-400', bg: 'bg-purple-500/20' },
    Legendary: { text: 'text-orange-400', bg: 'bg-orange-500/20' },
    Mythic: { text: 'text-red-400', bg: 'bg-red-500/20' }
  };

  const rarity = rarityStyles[listing.item_rarity] || rarityStyles.Common;

  const handleBid = () => {
    const amount = Number(bidAmount);
    if (!amount || amount <= (listing.current_bid || 0)) {
      alert('Bid must be higher than current bid');
      return;
    }
    onPlaceBid(listing, amount);
    setBidAmount('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950/95 backdrop-blur-xl border-white/10 max-w-3xl text-white p-0 overflow-hidden">
        <div className="flex flex-col md:flex-row h-[600px]">
          {/* Left: Image */}
          <div className="md:w-[40%] bg-black p-6 flex items-center justify-center">
            <div className="relative w-full aspect-square rounded-lg overflow-hidden">
              <img src={listing.item_image} alt={listing.item_name} className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3">
                <Badge className={`${rarity.bg} ${rarity.text} border-none text-sm font-bold`}>
                  {listing.item_rarity}
                </Badge>
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div className="flex-1 flex flex-col">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-2xl font-bold">{listing.item_name}</h2>
              <button onClick={onClose} className="text-white/40 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <p className="text-white/40 text-xs mb-1">Game</p>
                <p className="text-white font-medium">{listing.game_name}</p>
              </div>

              <div>
                <p className="text-white/40 text-xs mb-1">Type</p>
                <Badge variant="outline" className="border-white/20 text-white">
                  {listing.item_type}
                </Badge>
              </div>

              {listing.item_description && (
                <div>
                  <p className="text-white/40 text-xs mb-2">Description</p>
                  <p className="text-white/80 text-sm leading-relaxed">{listing.item_description}</p>
                </div>
              )}

              {listing.description && (
                <div>
                  <p className="text-white/40 text-xs mb-2">Seller Notes</p>
                  <p className="text-white/60 text-sm">{listing.description}</p>
                </div>
              )}

              <div>
                <p className="text-white/40 text-xs mb-2">Listed By</p>
                <div className="flex items-center gap-2">
                  <img src={listing.trader_avatar} className="w-8 h-8 rounded-full border border-white/20" />
                  <span className="text-white font-medium">{listing.trader_name}</span>
                </div>
              </div>

              {listing.seeking_items?.length > 0 && (
                <div>
                  <p className="text-white/40 text-xs mb-2">Seeking</p>
                  <div className="flex flex-wrap gap-2">
                    {listing.seeking_items.map((item, i) => (
                      <Badge key={i} variant="outline" className="border-white/20 text-white/80">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {!isOwner && (
              <div className="p-6 border-t border-white/10 bg-black/20">
                {listing.offer_type === 'sale' && (
                  <div className="space-y-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-cyan-400">{listing.price?.toLocaleString()}</span>
                      <span className="text-white/40">AGP</span>
                    </div>
                    <Button
                      onClick={() => onPurchase(listing)}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-6"
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Buy Now
                    </Button>
                  </div>
                )}

                {listing.offer_type === 'bid' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-white/60 text-sm">Current Bid</span>
                        <span className="text-purple-400 font-bold">{listing.current_bid?.toLocaleString()} AGP</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60 text-sm">Buyout Price</span>
                        <span className="text-white font-bold">{listing.buyout_price?.toLocaleString()} AGP</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        placeholder="Enter bid amount..."
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <Button onClick={handleBid} className="bg-purple-500 hover:bg-purple-600">
                        <Gavel className="w-4 h-4 mr-2" />
                        Bid
                      </Button>
                    </div>
                    <Button
                      onClick={() => onPurchase(listing)}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-bold"
                    >
                      Buyout for {listing.buyout_price?.toLocaleString()} AGP
                    </Button>
                  </div>
                )}

                {listing.offer_type === 'trade' && (
                  <div className="text-center py-4">
                    <Button className="bg-blue-500 hover:bg-blue-600 text-white font-bold">
                      <Send className="w-4 h-4 mr-2" />
                      Propose Trade
                    </Button>
                    <p className="text-white/40 text-xs mt-3">Contact seller to arrange trade</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}