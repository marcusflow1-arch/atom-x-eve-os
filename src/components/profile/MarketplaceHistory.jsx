import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gavel, ShoppingCart, Tag, Heart } from 'lucide-react';

export default function MarketplaceHistory() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [bids, setBids] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                // Fetch Transactions
                const txs = await base44.entities.MarketTransaction.filter({ 
                    $or: [{ buyer_id: user.id }, { seller_id: user.id }] 
                });
                setTransactions(txs);

                // Fetch Bids
                const userBids = await base44.entities.Bid.filter({ bidder_id: user.id });
                setBids(userBids);

                // Fetch Favorites (Mock for now if not in entity, or use local storage as in Marketplace.js)
                const storedFavorites = localStorage.getItem('marketplace_watchlist');
                if (storedFavorites) {
                    setFavorites(JSON.parse(storedFavorites));
                }
            } catch (error) {
                console.error("Error fetching marketplace history:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    if (loading) return <div className="text-slate-400">Loading history...</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-slate-900/60 border-slate-800">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-lg">
                            <ShoppingCart className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                            <div className="text-slate-500 text-xs font-bold uppercase">Total Purchases</div>
                            <div className="text-2xl font-black text-white">
                                {transactions.filter(t => t.buyer_id === user?.id).length}
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900/60 border-slate-800">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-green-500/10 rounded-lg">
                            <Tag className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <div className="text-slate-500 text-xs font-bold uppercase">Sales Made</div>
                            <div className="text-2xl font-black text-white">
                                {transactions.filter(t => t.seller_id === user?.id).length}
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900/60 border-slate-800">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-orange-500/10 rounded-lg">
                            <Gavel className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                            <div className="text-slate-500 text-xs font-bold uppercase">Active Bids</div>
                            <div className="text-2xl font-black text-white">
                                {bids.filter(b => b.status === 'active').length}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="transactions" className="w-full">
                <TabsList className="bg-slate-800/50 w-full justify-start">
                    <TabsTrigger value="transactions" className="gap-2">
                        <ShoppingCart className="w-4 h-4" /> Transactions
                    </TabsTrigger>
                    <TabsTrigger value="bids" className="gap-2">
                        <Gavel className="w-4 h-4" /> My Bids
                    </TabsTrigger>
                    <TabsTrigger value="favorites" className="gap-2">
                        <Heart className="w-4 h-4" /> Watchlist
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="transactions" className="mt-4">
                    <div className="bg-slate-900/40 rounded-xl border border-slate-800 overflow-hidden">
                        {transactions.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">No transactions yet.</div>
                        ) : (
                            <div className="divide-y divide-slate-800">
                                {transactions.map((tx) => (
                                    <div key={tx.id} className="p-4 flex justify-between items-center">
                                        <div>
                                            <div className="font-bold text-white">{tx.item_name || 'Unknown Item'}</div>
                                            <div className="text-xs text-slate-500">
                                                {tx.buyer_id === user?.id ? 'Purchased from' : 'Sold to'} {tx.buyer_id === user?.id ? tx.seller_id : tx.buyer_id}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`font-mono font-bold ${tx.buyer_id === user?.id ? 'text-red-400' : 'text-green-400'}`}>
                                                {tx.buyer_id === user?.id ? '-' : '+'}{tx.price} AGP
                                            </div>
                                            <div className="text-xs text-slate-600">{new Date(tx.timestamp || Date.now()).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="bids" className="mt-4">
                    <div className="bg-slate-900/40 rounded-xl border border-slate-800 overflow-hidden">
                        {bids.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">No bid history.</div>
                        ) : (
                            <div className="divide-y divide-slate-800">
                                {bids.map((bid) => (
                                    <div key={bid.id} className="p-4 flex justify-between items-center">
                                        <div>
                                            <div className="font-bold text-white">{bid.item_name || 'Auction Item'}</div>
                                            <Badge variant="outline" className={`mt-1 ${
                                                bid.status === 'active' ? 'text-blue-400 border-blue-500/30' : 
                                                bid.status === 'won' ? 'text-green-400 border-green-500/30' : 'text-slate-500 border-slate-700'
                                            }`}>
                                                {bid.status}
                                            </Badge>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-mono font-bold text-orange-400">{bid.amount} AGP</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="favorites" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {favorites.length === 0 ? (
                            <div className="col-span-full p-8 text-center text-slate-500">Your watchlist is empty.</div>
                        ) : (
                            favorites.map((item) => (
                                <Card key={item.id} className="bg-slate-900/40 border-slate-800">
                                    <div className="aspect-video relative overflow-hidden rounded-t-xl">
                                        <img src={item.image} alt={item.name} className="object-cover w-full h-full" />
                                        <div className="absolute top-2 right-2 bg-black/60 rounded px-2 py-1 text-xs text-white font-bold">
                                            {item.price?.toLocaleString()} AGP
                                        </div>
                                    </div>
                                    <CardContent className="p-4">
                                        <div className="font-bold text-white truncate">{item.name}</div>
                                        <div className="text-xs text-slate-500 mb-2">{item.game}</div>
                                        <button 
                                            className="text-xs text-red-400 hover:text-red-300 hover:underline"
                                            onClick={() => {
                                                const newFavorites = favorites.filter(f => f.id !== item.id);
                                                setFavorites(newFavorites);
                                                localStorage.setItem('marketplace_watchlist', JSON.stringify(newFavorites));
                                            }}
                                        >
                                            Remove
                                        </button>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}