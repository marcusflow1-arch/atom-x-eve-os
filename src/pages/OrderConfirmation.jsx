import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCart } from '@/components/CartContext';
import { useAuth } from '@/components/auth/AuthContext';
import { storeError } from '@/components/store/useGameClaim';
import { formatMoney } from '@/lib/storeCheckout';

export default function OrderConfirmation() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id'), orderId = params.get('orderId');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const { removeFromCart } = useCart();
  const { user } = useAuth();
  const client = useQueryClient();

  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setResult(null);
    async function load() {
      try {
        let saved, id = sessionId;
        if (!id && orderId) { saved = await base44.entities.Order.get(orderId); id = saved?.stripe_session_id; }
        if (!id && !saved) throw new Error('No order was selected. Open a purchase from your order history.');
        let data;
        if (id) {
          const response = await base44.functions.invoke('verifyStripeSession', { sessionId: id });
          data = response?.data || response;
          if (!data?.success || !data?.order) throw new Error(data?.error || 'Your payment could not be verified.');
        } else {
          if (saved.status !== 'completed') throw new Error('Payment has not been recorded for this checkout. Return to checkout or review your payment with support.');
          data = { order: saved, legacy_rewards_unverified: true };
        }
        if (!active) return;
        setResult(data);
        if (data.order.payment_status === 'paid' || data.order.status === 'completed') {
          data.order.items?.forEach(item => removeFromCart(item.item_id || item.game_id, item.item_type || 'game'));
          void client.invalidateQueries({ queryKey: ['owned-games', user?.id] });
          void client.invalidateQueries({ queryKey: ['card-collection'] });
        }
      } catch (failure) { if (active) setError(storeError(failure)); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
    // Cart callbacks are recreated by the provider; they must not restart fulfillment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, orderId, attempt, user?.id, client]);
  const order = result?.order;
  const review = Boolean(result?.legacy_rewards_unverified);
  const terminal = order?.status === 'refunded' || order?.status === 'failed';
  const completed = order?.status === 'completed' && !review;
  const pending = Boolean(order && (result?.rewards_pending || (order.payment_status === 'paid' && order.status === 'pending')) && !terminal);
  const title = loading ? 'Checking your purchase…' : error ? 'We couldn’t confirm your order' : terminal ? 'Order needs review' : pending ? 'Payment received. Delivery is pending.' : review ? 'Purchase recorded' : 'Your games are ready';
  const Icon = loading ? Loader2 : error || review || terminal ? AlertCircle : completed ? CheckCircle : Clock;

  return <main className="min-h-screen bg-slate-950 text-white p-6 flex items-center justify-center">
    <section className="max-w-2xl w-full rounded-2xl border border-slate-800 bg-slate-900/60 p-8 md:p-12">
      <Icon className={'mx-auto mb-6 h-12 w-12 text-cyan-300' + (loading ? ' animate-spin' : '')} />
      <h1 className="text-center text-3xl font-bold">{title}</h1>
      <div className="mt-4 text-center text-slate-300" aria-live="polite">
        {error ? <p role="alert">{error}</p> : loading ? <p>Verifying payment and delivery status.</p> : terminal ? <p>Open order history to review this purchase.</p> : <>
          {pending && <p>Your purchase is saved. Retry delivery to finish adding your games and starter rewards. This does not charge you again.</p>}
          {completed && <p>Your games and included starter rewards have been delivered.</p>}
          {review && <p>Your purchase is recorded, but this older order has no complete starter-reward history. Its rewards need a support review.</p>}
        </>}
      </div>
      {order && !loading && <div className="my-8 rounded-xl border border-slate-800 bg-slate-950/70 p-5">
        <p className="mb-4 text-xs uppercase tracking-wider text-slate-400">Order #{order.id.slice(0, 8)}</p>
        <ul className="space-y-3">{order.items?.map((item, index) => <li key={index} className="flex justify-between gap-4 text-sm"><span>{item.title}</span><span>{formatMoney(item.price, order.currency)}</span></li>)}</ul>
        <div className="mt-5 flex justify-between border-t border-slate-800 pt-4 font-semibold"><span>Total paid</span><span>{formatMoney(order.total_amount, order.currency)}</span></div>
      </div>}
      {!loading && (error || pending) && (sessionId || orderId) && <button className="mt-6 w-full rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950" onClick={() => setAttempt(value => value + 1)}>{pending ? 'Retry delivery' : 'Check order status again'}</button>}
      <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm"><Link to="/Library" className="text-cyan-300">Open library</Link><Link to="/Orders" className="text-cyan-300">Order history</Link><Link to="/Store" className="text-slate-300">Continue shopping</Link></div>
    </section>
  </main>;
}
