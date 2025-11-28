import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeftRight, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CreateTradeModal = ({ isOpen, onClose, item, onCreateTrade }) => {
  const [seekingType, setSeekingType] = useState('any');
  const [seekingRarity, setSeekingRarity] = useState('any');
  const [seekingGenre, setSeekingGenre] = useState('any');
  const [specificItem, setSpecificItem] = useState('');
  const [tradeNotes, setTradeNotes] = useState('');
  const [tradeDuration, setTradeDuration] = useState('7');

  const handleSubmit = (e) => {
    e.preventDefault();
    const tradeData = {
      offering: item,
      seeking: {
        type: seekingType,
        rarity: seekingRarity,
        genre: seekingGenre,
        specificItem,
        notes: tradeNotes
      },
      duration: tradeDuration
    };
    onCreateTrade(tradeData);
    onClose();
  };

  if (!isOpen || !item) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Create Trade Listing</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* What You're Offering */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">You're Offering</h3>
              <div className="bg-slate-900/50 rounded-lg p-4 flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">⚔️</span>
                </div>
                <div>
                  <h4 className="font-bold text-white">{item.name}</h4>
                  <p className="text-sm text-slate-400">{item.description}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge className="bg-purple-500/20 text-purple-400">
                      {item.rarity}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {item.genre}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <ArrowLeftRight className="w-8 h-8 text-slate-500" />
            </div>

            {/* What You're Seeking */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">You're Seeking</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Item Type</label>
                    <Select value={seekingType} onValueChange={setSeekingType}>
                      <SelectTrigger className="bg-slate-700 border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Type</SelectItem>
                        <SelectItem value="ability">Abilities</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="companion">Companions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Rarity</label>
                    <Select value={seekingRarity} onValueChange={setSeekingRarity}>
                      <SelectTrigger className="bg-slate-700 border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Rarity</SelectItem>
                        <SelectItem value="Common">Common</SelectItem>
                        <SelectItem value="Uncommon">Uncommon</SelectItem>
                        <SelectItem value="Rare">Rare</SelectItem>
                        <SelectItem value="Epic">Epic</SelectItem>
                        <SelectItem value="Legendary">Legendary</SelectItem>
                        <SelectItem value="Mythic">Mythic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Genre</label>
                    <Select value={seekingGenre} onValueChange={setSeekingGenre}>
                      <SelectTrigger className="bg-slate-700 border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any Genre</SelectItem>
                        <SelectItem value="Fantasy">Fantasy</SelectItem>
                        <SelectItem value="Sci-Fi">Sci-Fi</SelectItem>
                        <SelectItem value="Action">Action</SelectItem>
                        <SelectItem value="Adventure">Adventure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Specific Item (Optional)
                  </label>
                  <Input
                    placeholder="e.g., 'Dragon Sword' or 'Lightning Spell'"
                    value={specificItem}
                    onChange={(e) => setSpecificItem(e.target.value)}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Additional Notes
                  </label>
                  <Textarea
                    placeholder="Any additional details about what you're looking for..."
                    value={tradeNotes}
                    onChange={(e) => setTradeNotes(e.target.value)}
                    className="bg-slate-700 border-slate-600 h-24"
                  />
                </div>
              </div>
            </div>

            {/* Trade Duration */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Trade Duration
              </label>
              <Select value={tradeDuration} onValueChange={setTradeDuration}>
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Day</SelectItem>
                  <SelectItem value="3">3 Days</SelectItem>
                  <SelectItem value="7">1 Week</SelectItem>
                  <SelectItem value="14">2 Weeks</SelectItem>
                  <SelectItem value="30">1 Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Trade Listing
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateTradeModal;