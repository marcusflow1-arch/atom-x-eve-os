import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@16.12.0';
import { ownsItem } from '../../shared/entitlements.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { items, successUrl, cancelUrl } = await req.json();
    if (!Array.isArray(items) || items.length === 0) return Response.json({ error: 'Cart is empty' }, { status: 400 });
    const requested = items.map((item:any) => ({ id: String(item?.id || ''), type: String(item?.type || 'game') })).filter((item:any) => item.id);
    if (!requested.length || requested.some((item:any) => !['game','dlc'].includes(item.type))) return Response.json({ error: 'Unsupported catalog item type' }, { status: 400 });
    const unique:any[] = [...new Map(requested.map((item:any) => [`${item.type}:${item.id}`, item])).values()];
    const svc = base44.asServiceRole.entities;
    const catalogItems:any[] = [];

    for (const item of unique) {
      if (item.type === 'game') {
        const game = await svc.Game.get(item.id).catch(() => null);
        if (!game || game.status !== 'available') return Response.json({ error: `Game ${item.id} not found` }, { status: 404 });
        const price = Number(game.price);
        if (!Number.isFinite(price) || price <= 0) return Response.json({ error: price === 0 ? 'Free games use the claim action' : `Game ${item.id} has an invalid checkout price` }, { status: 400 });
        if (await ownsItem(svc, user.id, 'game', game.id)) return Response.json({ error: `You already own ${game.title}` }, { status: 409 });
        catalogItems.push({ id: game.id, type: 'game', title: game.title, description: game.description, image: game.cover_image, price });
      } else {
        const dlc = await svc.DLC.get(item.id).catch(() => null);
        if (!dlc || dlc.status !== 'active') return Response.json({ error: `DLC ${item.id} is unavailable` }, { status: 404 });
        const price = Number(dlc.price);
        if (!Number.isFinite(price) || price <= 0) return Response.json({ error: `DLC ${item.id} has an invalid checkout price` }, { status: 400 });
        if (!(await ownsItem(svc, user.id, 'game', dlc.game_id))) return Response.json({ error: 'You must own the base game before purchasing this DLC' }, { status: 409 });
        if (await ownsItem(svc, user.id, 'dlc', dlc.id)) return Response.json({ error: `You already own ${dlc.name}` }, { status: 409 });
        catalogItems.push({ id: dlc.id, type: 'dlc', title: dlc.name, description: dlc.description, image: dlc.cover_image, price, game_id: dlc.game_id, version: dlc.version });
      }
    }

    const lineItems = catalogItems.map((item:any) => ({ price_data: { currency: 'usd', product_data: { name: item.title, description: item.description || item.type.toUpperCase(), images: item.image ? [item.image] : [], metadata: { item_id: item.id, item_type: item.type, game_id: item.game_id || '' } }, unit_amount: Math.round(item.price * 100) }, quantity: 1 }));
    const session = await stripe.checkout.sessions.create({ payment_method_types: ['card'], line_items: lineItems, mode: 'payment', success_url: successUrl, cancel_url: cancelUrl, client_reference_id: user.id, metadata: { user_id: user.id, user_email: user.email || '', items: JSON.stringify(catalogItems.map(({ id, type, title, price, game_id, version }:any) => ({ id, type, title, price, game_id, version }))) } });
    return Response.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Create checkout session error:', error);
    return Response.json({ error: error?.message || 'Unable to create checkout session' }, { status: 500 });
  }
});
