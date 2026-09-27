import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, Loader2, Lock, ShoppingCart, Trash2 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { useCart } from '@/components/CartContext';
import { base44 } from '@/api/base44Client';
import FreeGameClaim from '@/components/store/FreeGameClaim';
import { storeError } from '@/components/store/useGameClaim';
import { checkoutAttempt, forgetCheckoutAttempt, formatMoney, stripeCheckoutUrl } from '@/lib/storeCheckout';

export default function Checkout() {
  const { user, isAuthenticated, login } = useAuth();
  const { cart, removeFromCart } = useCart();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [resumeUrl, setResumeUrl] = useState(null);
  const running = useRef(false);
  const free = cart.filter(item => item.type === 'game' && Number(item.price) === 0);
  const paid = cart.filter(item => !free.includes(item));
  const supported = paid.every(item => ['game', 'dlc'].includes(item.type) && typeof item.price === 'number' && Number.isFinite(item.price) && item.price > 0);
  const total = paid.reduce((sum, item) => sum + Math.round(Number(item.price || 0) * 100), 0) / 100;

  const purchase = async () => {
    if (!isAuthenticated) { login(); return; }
    if (running.current || !paid.length || !supported) return;
    running.current = true; setProcessing(true); setError(''); setResumeUrl(null);
    try {
      const checkoutKey = checkoutAttempt(user.id, paid);
      const response = await base44.functions.invoke('createCheckoutSession', {
        items: paid.map(({ id, type }) => ({ id, type })), checkoutKey,
        successUrl: window.location.origin + '/OrderConfirmation?session_id={CHECKOUT_SESSION_ID}',
        cancelUrl: window.location.origin + '/Checkout',
      });
      const data = response?.data || response;
      if (data?.verify && data.sessionId) { navigate('/OrderConfirmation?session_id=' + encodeURIComponent(data.sessionId)); return; }
      if (data?.error) throw { response: { data } };
      const destination = stripeCheckoutUrl(data?.url);
      if (!destination) throw new Error('The secure checkout link is unavailable. Please try again.');
      window.location.assign(destination);
    } catch (failure) {
      const code = failure?.response?.data?.code || failure?.data?.code;
      if (code === 'CHECKOUT_EXPIRED') forgetCheckoutAttempt(user.id, paid);
      setError(storeError(failure));
      setResumeUrl(stripeCheckoutUrl(failure?.response?.data?.resume_url || failure?.data?.resume_url));
    } finally { running.current = false; setProcessing(false); }
  };
  return <main className="min-h-screen bg-slate-950 text-white p-6 md:p-12 page-container">
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-center justify-between"><div><p className="text-xs uppercase tracking-widest text-cyan-300">Atom XE Store</p><h1 className="mt-2 text-3xl font-bold">Your checkout</h1></div><Link to="/Store" className="text-sm text-slate-300 hover:text-white">Back to store</Link></div>
      {!cart.length ? <section className="rounded-2xl border border-slate-800 p-12 text-center"><ShoppingCart className="mx-auto mb-4 text-slate-500" /><h2 className="text-xl font-semibold">Your cart is empty</h2><Link to="/Store" className="mt-4 inline-block text-cyan-300">Explore games</Link></section> :
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-label="Cart items" className="space-y-4">
          {cart.map(item => <article key={item.type + ':' + item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-start gap-4">
              {item.image && <img src={item.image} alt="" className="h-20 w-20 rounded-lg object-cover" />}
              <div className="min-w-0 flex-1"><h2 className="font-semibold">{item.title}</h2><p className="mt-1 text-sm text-slate-400">{item.type === 'dlc' ? 'Game expansion' : item.type === 'game' ? 'Digital game' : 'Unsupported checkout item'}</p><p className="mt-2 text-cyan-300">{free.includes(item) ? 'Free' : formatMoney(item.price)}</p></div>
              <button aria-label={'Remove ' + item.title} className="rounded-lg p-2 text-slate-400 hover:text-white" disabled={processing} onClick={() => removeFromCart(item.id, item.type)}><Trash2 size={18} /></button>
            </div>
            {free.includes(item) && <div className="mt-4 border-t border-slate-800 pt-4"><FreeGameClaim gameId={item.id} /></div>}
          </article>)}
        </section>
        <aside className="h-fit rounded-2xl border border-slate-800 bg-slate-900/60 p-6" aria-label="Checkout summary">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <div className="my-5 flex justify-between text-slate-300"><span>{paid.length} paid {paid.length === 1 ? 'item' : 'items'}</span><strong className="text-white">{formatMoney(total)}</strong></div>
          <p className="mb-5 text-sm leading-relaxed text-slate-400">{paid.length ? 'Review the final catalog price and enter payment details securely on Stripe.' : 'Use Claim free game to add each game and its starter rewards to your library.'}</p>
          {!supported && <p role="alert" className="mb-4 text-sm text-amber-200">Remove unsupported items or return to their store listing before checkout.</p>}
          {error && <p role="alert" className="mb-4 text-sm text-rose-300">{error}</p>}
          {resumeUrl && <a href={resumeUrl} className="mb-4 block rounded-xl border border-cyan-400/40 p-3 text-center font-semibold text-cyan-300">Resume earlier checkout</a>}
          {paid.length > 0 && <button onClick={purchase} disabled={processing || !supported} className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">
            {processing ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
            {processing ? 'Opening checkout…' : isAuthenticated ? 'Continue to secure checkout' : 'Sign in to checkout'}
          </button>}
          {paid.length > 0 && <p className="mt-4 flex items-center gap-2 text-xs text-slate-500"><Lock size={13} />Payment details stay on Stripe.</p>}
          <Link to="/Orders" className="mt-6 block text-sm text-cyan-300">Review an earlier purchase</Link>
        </aside>
      </div>}
    </div>
  </main>;
}
