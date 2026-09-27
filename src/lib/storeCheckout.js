export function formatMoney(amount, currency = 'USD') {
  if (!Number.isFinite(Number(amount))) return 'Unavailable';
  if (currency === 'AGP') return Number(amount).toLocaleString() + ' AGP';
  try { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount)); }
  catch { return Number(amount).toFixed(2) + ' ' + currency; }
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
