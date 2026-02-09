import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { CreditCard, Lock, User, Truck, Check, MapPin, ChevronRight, ChevronLeft, ShoppingCart } from 'lucide-react';
import { useAuth } from '../components/auth/AuthContext';
import { useCart } from '../components/CartContext';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';

const steps = [
    { id: 1, name: 'Purchase Details', icon: ShoppingCart },
    { id: 2, name: 'Payment', icon: CreditCard },
    { id: 3, name: 'Review', icon: Check },
];

export default function Checkout() {
    const { user, isAuthenticated } = useAuth();
    const { cart, getCartTotal, clearCart } = useCart();
    const navigate = useNavigate();

    // Load Stripe script
    useEffect(() => {
        if (!window.Stripe) {
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);
    
    const [currentStep, setCurrentStep] = useState(1);
    const [processing, setProcessing] = useState(false);
    
    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        address: '',
        city: '',
        zip: '',
        country: '',
        cardNumber: '',
        expiry: '',
        cvc: ''
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                email: user.email || '',
                firstName: user.first_name || '',
                lastName: user.last_name || ''
            }));
        }
    }, [user]);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const nextStep = () => {
        setCurrentStep(prev => Math.min(prev + 1, 3));
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handlePurchase = async () => {
        if (!user) {
            alert("Please sign in to complete your purchase");
            return;
        }
        setProcessing(true);
        
        try {
            const total = getCartTotal();
            
            // Get Stripe publishable key
            const { data: keyData } = await base44.functions.invoke('getStripePublishableKey');
            
            // Create checkout session
            const { data: sessionData } = await base44.functions.invoke('createCheckoutSession', {
                items: cart.map(item => ({
                    id: item.id,
                    title: item.title,
                    price: item.price,
                    type: item.type,
                    rarity: item.rarity,
                    game: item.game,
                    image: item.image || item.cover_image
                })),
                successUrl: window.location.origin + createPageUrl('OrderConfirmation') + '?session_id={CHECKOUT_SESSION_ID}',
                cancelUrl: window.location.origin + createPageUrl('Checkout')
            });

            if (sessionData.sessionId) {
                // Redirect to Stripe Checkout
                const stripe = window.Stripe(keyData.publishableKey);
                const { error } = await stripe.redirectToCheckout({
                    sessionId: sessionData.sessionId
                });
                
                if (error) {
                    console.error('Stripe error:', error);
                    alert('Payment redirect failed. Please try again.');
                }
            } else {
                throw new Error('Failed to create checkout session');
            }
            
        } catch (error) {
            console.error("Checkout error:", error);
            alert("There was an error processing your order. Please try again.");
        } finally {
            setProcessing(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-center text-slate-400 bg-slate-900">
                <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
                <h2 className="text-2xl font-bold text-white">Your cart is empty</h2>
                <p className="mb-6">Add some items to get started.</p>
                <Button onClick={() => navigate(createPageUrl('Store'))} className="bg-blue-600 hover:bg-blue-500">Go to Store</Button>
            </div>
        );
    }

    const total = getCartTotal();

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 page-container">
            <div className="max-w-6xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => navigate(createPageUrl('Store'))}
                    className="absolute top-6 right-6 flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
                >
                    <div className="w-8 h-8 rounded-full bg-white/10 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium">Back</span>
                </button>

                {/* Step indicator (minimal) */}
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-bold text-white">Checkout</h1>
                    <p className="text-slate-500 text-sm mt-1">Step {currentStep} of {steps.length} — {steps[currentStep - 1].name}</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Form Area */}
                    <div className="lg:col-span-2">
                        <AnimatePresence mode="wait">
                            {/* Step 1: Shipping */}
                            {currentStep === 1 && (
                                <motion.div 
                                    key="step1"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
                                >
                                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                        <ShoppingCart className="w-6 h-6 text-blue-500" /> Purchase Details
                                    </h2>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">First Name</Label>
                                            <Input id="firstName" value={formData.firstName} onChange={handleInputChange} className="bg-slate-950 border-slate-800" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">Last Name</Label>
                                            <Input id="lastName" value={formData.lastName} onChange={handleInputChange} className="bg-slate-950 border-slate-800" />
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input id="email" type="email" value={formData.email} onChange={handleInputChange} className="bg-slate-950 border-slate-800" />
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <Label htmlFor="address">Street Address</Label>
                                            <Input id="address" value={formData.address} onChange={handleInputChange} className="bg-slate-950 border-slate-800" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="city">City</Label>
                                            <Input id="city" value={formData.city} onChange={handleInputChange} className="bg-slate-950 border-slate-800" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="zip">ZIP / Postal Code</Label>
                                            <Input id="zip" value={formData.zip} onChange={handleInputChange} className="bg-slate-950 border-slate-800" />
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <Label htmlFor="country">Country</Label>
                                            <Input id="country" value={formData.country} onChange={handleInputChange} className="bg-slate-950 border-slate-800" />
                                        </div>
                                    </div>
                                    <div className="mt-8 flex justify-end">
                                        <Button onClick={nextStep} className="bg-blue-600 hover:bg-blue-500 px-8">
                                            Continue to Payment <ChevronRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 2: Payment */}
                            {currentStep === 2 && (
                                <motion.div 
                                    key="step2"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
                                >
                                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                        <CreditCard className="w-6 h-6 text-blue-500" /> Payment Method
                                    </h2>
                                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 mb-6 flex items-center gap-4">
                                        <div className="w-12 h-8 bg-slate-800 rounded flex items-center justify-center">
                                            <CreditCard className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium">Mock Payment Gateway</div>
                                            <div className="text-xs text-slate-500">Enter any dummy data for testing</div>
                                        </div>
                                        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="cardNumber">Card Number</Label>
                                            <Input id="cardNumber" placeholder="0000 0000 0000 0000" value={formData.cardNumber} onChange={handleInputChange} className="bg-slate-950 border-slate-800" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="expiry">Expiry Date</Label>
                                                <Input id="expiry" placeholder="MM/YY" value={formData.expiry} onChange={handleInputChange} className="bg-slate-950 border-slate-800" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="cvc">CVC</Label>
                                                <Input id="cvc" placeholder="123" value={formData.cvc} onChange={handleInputChange} className="bg-slate-950 border-slate-800" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-8 flex justify-between">
                                        <Button variant="outline" onClick={prevStep}>Back</Button>
                                        <Button onClick={nextStep} className="bg-blue-600 hover:bg-blue-500 px-8">
                                            Review Order <ChevronRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {/* Step 3: Review */}
                            {currentStep === 3 && (
                                <motion.div 
                                    key="step3"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
                                >
                                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                        <Check className="w-6 h-6 text-blue-500" /> Review Order
                                    </h2>
                                    
                                    <div className="space-y-6">
                                        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                                            <h3 className="text-sm font-bold text-slate-400 uppercase mb-2">Shipping To</h3>
                                            <p className="text-white">{formData.firstName} {formData.lastName}</p>
                                            <p className="text-slate-400">{formData.address}</p>
                                            <p className="text-slate-400">{formData.city}, {formData.zip}</p>
                                            <p className="text-slate-400">{formData.country}</p>
                                        </div>

                                        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                                            <h3 className="text-sm font-bold text-slate-400 uppercase mb-2">Payment</h3>
                                            <div className="flex items-center gap-2 text-white">
                                                <CreditCard className="w-4 h-4" />
                                                <span>Ending in {formData.cardNumber.slice(-4) || '****'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex justify-between">
                                        <Button variant="outline" onClick={prevStep}>Back</Button>
                                        <Button 
                                            onClick={handlePurchase} 
                                            disabled={processing}
                                            className="bg-green-600 hover:bg-green-500 px-8 w-1/2"
                                        >
                                            {processing ? (
                                                "Processing..."
                                            ) : (
                                                <>
                                                    <Lock className="w-4 h-4 mr-2" />
                                                    Pay {total.toLocaleString()} AGP
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Order Summary Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 sticky top-6">
                            <h3 className="text-lg font-bold text-white mb-4">Order Summary</h3>
                            <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                                {cart.map((item) => (
                                    <div key={item.id} className="flex gap-4">
                                        <div className="w-16 h-16 bg-slate-800 rounded-md overflow-hidden flex-shrink-0">
                                            <img src={item.image || item.cover_image} alt={item.title} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium text-white truncate">{item.title}</h4>
                                            <div className="text-xs text-slate-500">Qty: {item.quantity || 1}</div>
                                            <div className="text-sm font-bold text-slate-300">{item.price.toLocaleString()} AGP</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-slate-800 pt-4 space-y-2">
                                <div className="flex justify-between text-slate-400">
                                    <span>Subtotal</span>
                                    <span>{total.toLocaleString()} AGP</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                    <span>Tax (Est.)</span>
                                    <span>0 AGP</span>
                                </div>
                                <div className="border-t border-slate-800 pt-2 mt-2 flex justify-between items-center">
                                    <span className="text-lg font-bold text-white">Total</span>
                                    <span className="text-2xl font-bold text-green-400">{total.toLocaleString()} AGP</span>
                                </div>
                            </div>
                            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
                                <Lock className="w-3 h-3" /> Secure Checkout
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}