export function formatMoney(amount, currency = 'USD') {
  if (!Number.isFinite(Number(amount))) return 'Unavailable';
  if (currency === 'AGP') return Number(amount).toLocaleString() + ' AGP';
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount)); }
  catch { return Number(amount).toFixed(2) + ' ' + currency; }
}
export function stripeCheckoutUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'checkout.stripe.com' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
export const checkoutCartKey = (userId, items) => 'atom-checkout:' + userId + ':' + JSON.stringify(items.map(item => [item.type, item.id]).sort());
export function checkoutAttempt(userId, items, storage = window.sessionStorage) {
  const key = checkoutCartKey(userId, items);
  let attempt = storage.getItem(key);
  if (!attempt) { attempt = crypto.randomUUID(); storage.setItem(key, attempt); }
  return attempt;
}
export function forgetCheckoutAttempt(userId, items, storage = window.sessionStorage) {
  storage.removeItem(checkoutCartKey(userId, items));
}
