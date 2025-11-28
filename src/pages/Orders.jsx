import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '../components/auth/AuthContext';
import { base44 } from '@/api/base44Client';
import { Package, Clock, CheckCircle, XCircle, ChevronRight, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

export default function OrdersPage() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            if (user) {
                try {
                    const userOrders = await base44.entities.Order.filter({ user_id: user.id }, { created_date: -1 });
                    setOrders(userOrders);
                } catch (error) {
                    console.error("Failed to fetch orders:", error);
                }
            }
            setLoading(false);
        };

        fetchOrders();
    }, [user]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/50';
            case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
            case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/50';
            default: return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-4 h-4" />;
            case 'pending': return <Clock className="w-4 h-4" />;
            case 'failed': return <XCircle className="w-4 h-4" />;
            default: return <Package className="w-4 h-4" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="w-12 h-12 bg-slate-700 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-slate-700 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent text-white p-6 md:p-12 page-container">
            <div className="max-w-5xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Order History</h1>
                        <p className="text-slate-400">View and track your past purchases</p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link to={createPageUrl('Store')}>
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            Store
                        </Link>
                    </Button>
                </div>

                {orders.length === 0 ? (
                    <Card className="bg-slate-900 border-slate-800 text-center py-16">
                        <CardContent>
                            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Package className="w-10 h-10 text-slate-500" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">No orders yet</h2>
                            <p className="text-slate-400 mb-8">You haven't made any purchases yet.</p>
                            <Button asChild className="bg-blue-600 hover:bg-blue-500">
                                <Link to={createPageUrl('Store')}>Start Shopping</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order, index) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors overflow-hidden">
                                    <CardHeader className="bg-slate-900/80 border-b border-slate-800 py-4">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-slate-800 p-2 rounded text-slate-400">
                                                    <Package className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg text-white font-mono">
                                                        Order #{order.id.slice(0, 8).toUpperCase()}
                                                    </CardTitle>
                                                    <div className="text-sm text-slate-500">
                                                        {new Date(order.created_date).toLocaleDateString()} • {new Date(order.created_date).toLocaleTimeString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Badge className={`${getStatusColor(order.status)} px-3 py-1 flex items-center gap-2`}>
                                                    {getStatusIcon(order.status)}
                                                    <span className="uppercase">{order.status}</span>
                                                </Badge>
                                                <div className="text-right">
                                                    <div className="text-sm text-slate-500 uppercase">Total</div>
                                                    <div className="text-xl font-bold text-white">{order.total_amount?.toLocaleString()} AGP</div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="space-y-4">
                                            {order.items && order.items.map((item, i) => (
                                                <div key={i} className="flex items-center gap-4">
                                                    <div className="w-16 h-16 rounded bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700">
                                                        {item.image && (
                                                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="text-white font-medium">{item.title}</h4>
                                                        <div className="text-sm text-slate-500">Qty: {item.quantity}</div>
                                                    </div>
                                                    <div className="text-white font-medium">
                                                        {item.price?.toLocaleString()} AGP
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}