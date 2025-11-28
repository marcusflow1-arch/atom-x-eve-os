import React from 'react';
import { useCart } from '../components/CartContext'; // Corrected import path
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';

export default function CartPage() {
    const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();

    if (cart.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-slate-400">
                <ShoppingCart className="w-24 h-24 mb-4 text-slate-600" />
                <h2 className="text-3xl font-bold text-white mb-2">Your Cart is Empty</h2>
                <p className="mb-6">Looks like you haven't added anything to your cart yet.</p>
                <Link to={createPageUrl('Store')}>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">Start Shopping</Button>
                </Link>
            </div>
        );
    }

    const tax = cartTotal * 0.08; // 8% tax simulation
    const finalTotal = cartTotal + tax;

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-4xl font-extrabold text-white mb-6">Your Cart</h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                    {cart.map(item => (
                        <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-800/70 rounded-lg border border-slate-700">
                            <img src={item.image} alt={item.title} className="w-24 h-24 object-cover rounded-md" />
                            <div className="flex-grow">
                                <h3 className="font-bold text-white">{item.title}</h3>
                                <p className="text-sm text-slate-400">{item.category}</p>
                                <p className="text-lg font-semibold text-yellow-400 mt-1">{item.price.toLocaleString()} AGP</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="icon" variant="outline" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="w-4 h-4" /></Button>
                                <Input type="number" value={item.quantity} readOnly className="w-16 text-center bg-slate-900 border-slate-700" />
                                <Button size="icon" variant="outline" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="w-4 h-4" /></Button>
                            </div>
                            <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-500/10" onClick={() => removeFromCart(item.id)}>
                                <Trash2 className="w-5 h-5" />
                            </Button>
                        </div>
                    ))}
                </div>
                <div className="lg:col-span-1">
                    <div className="bg-slate-800/70 p-6 rounded-lg border border-slate-700 sticky top-6">
                        <h2 className="text-2xl font-bold text-white mb-4">Order Summary</h2>
                        <div className="space-y-2 text-slate-300">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>{cartTotal.toLocaleString()} AGP</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Estimated Tax</span>
                                <span>{tax.toLocaleString(undefined, { maximumFractionDigits: 0 })} AGP</span>
                            </div>
                            <div className="border-t border-slate-700 my-2"></div>
                            <div className="flex justify-between text-xl font-bold text-white">
                                <span>Total</span>
                                <span>{finalTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })} AGP</span>
                            </div>
                        </div>
                        <Link to={createPageUrl('Checkout')} className="w-full">
                            <Button size="lg" className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white">
                                Proceed to Checkout
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}