import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, Loader2, Package, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';

export default function OrderConfirmation() {
    const location = useLocation();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    const query = new URLSearchParams(location.search);
    const orderId = query.get('orderId');

    useEffect(() => {
        const fetchOrder = async () => {
            if (orderId) {
                try {
                    const fetchedOrder = await base44.entities.Order.get(orderId);
                    setOrder(fetchedOrder);
                } catch (e) {
                    console.error("Failed to fetch order:", e);
                }
            }
            setLoading(false);
        };

        fetchOrder();
    }, [orderId]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">
                <Loader2 className="w-16 h-16 animate-spin text-blue-500 mb-6" />
                <h1 className="text-3xl font-bold mb-2">Retrieving Order Details...</h1>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent text-white p-6 flex items-center justify-center">
            <div className="max-w-2xl w-full bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-8 md:p-12 text-center shadow-2xl">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                    <CheckCircle className="w-12 h-12 text-green-400" />
                </div>
                
                <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Order Confirmed!</h1>
                <p className="text-slate-300 text-lg mb-8">
                    Thank you for your purchase. Your order has been processed successfully.
                </p>

                {order && (
                    <div className="bg-slate-950/80 rounded-xl p-6 mb-8 border border-slate-800 text-left">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-4">
                            <span className="text-slate-500 uppercase text-xs font-bold tracking-wider">Order ID</span>
                            <span className="font-mono text-cyan-400 font-bold">#{order.id.slice(0, 8).toUpperCase()}</span>
                        </div>
                        <div className="space-y-3 mb-4">
                            {order.items.map((item, i) => (
                                <div key={i} className="flex justify-between text-sm">
                                    <span className="text-white">{item.title} <span className="text-slate-500">x{item.quantity}</span></span>
                                    <span className="text-slate-300">{item.price.toLocaleString()} AGP</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                            <span className="text-white font-bold">Total Amount</span>
                            <span className="text-xl font-bold text-green-400">{order.total_amount.toLocaleString()} AGP</span>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button asChild className="h-14 text-lg bg-blue-600 hover:bg-blue-500">
                        <Link to={createPageUrl('Orders')}>
                            <FileText className="w-5 h-5 mr-2" /> View My Orders
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-14 text-lg border-slate-700 hover:bg-slate-800 hover:text-white">
                        <Link to={createPageUrl('Store')}>
                            <Package className="w-5 h-5 mr-2" /> Continue Shopping
                        </Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}