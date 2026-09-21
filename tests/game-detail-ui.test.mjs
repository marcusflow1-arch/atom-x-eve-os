import assert from 'node:assert/strict';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<div id="root"></div>', { url: 'https://test.local/GameDetail?id=game-one' });
for (const name of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'NodeFilter', 'HTMLInputElement', 'MutationObserver', 'CustomEvent', 'Event', 'getComputedStyle']) {
  globalThis[name] = name === 'getComputedStyle' ? dom.window.getComputedStyle.bind(dom.window) : dom.window[name];
}
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
window.HTMLElement.prototype.scrollIntoView = () => {};
window.HTMLElement.prototype.scrollTo = () => {};
const React = await import('react'), { act } = React;
const { createRoot } = await import('react-dom/client');
const require = createRequire(import.meta.url);
const game = { id: 'game-one', title: 'The Glass Frontier', genre: 'rpg', description: 'Explore a fractured world.\n\nChoose your own path.', price: 29.99, status: 'available', original_year: 2025, cover_image: 'https://example.com/cover.jpg', screenshots: ['https://example.com/one.jpg', 'https://example.com/two.jpg', 'https://example.com/one.jpg'], video_urls: ['https://www.youtube.com/watch?v=abcdefghijk', 'https://www.youtube.com/watch?v=trailer1'], trailer_url: 'https://youtu.be/abcdefghijk', system_requirements: { memory: '8 GB RAM' } };
const calls = { get: 0, cart: [], wishlist: [], reviews: [], login: 0 };
const session = { authenticated: true, owned: false };
let storedWishlist = [], storedReviews = [], failGet = false, failWishlist = false;
const SDK = { entities: {
  Game: { get: async id => { calls.get++; if (failGet) throw new Error('offline'); return { ...game, id }; } },
  Wishlist: {
    filter: async () => storedWishlist,
    create: async data => { if (failWishlist) throw new Error('offline'); calls.wishlist.push(data); const row = { ...data, id: 'wish-one' }; storedWishlist.push(row); return row; },
    delete: async id => { storedWishlist = storedWishlist.filter(row => row.id !== id); }
  },
  Post: {
    filter: async () => storedReviews,
    create: async data => { calls.reviews.push(data); const row = { ...data, id: 'review-one', created_date: '2026-09-21T10:00:00Z' }; storedReviews.push(row); return row; }
  },
  DLC: { filter: async () => [{ id: 'expansion', game_id: game.id, name: 'Northern Reach', description: 'A new region.', status: 'active', price: 5 }] },
  CardTemplate: { filter: async () => [{ id: 'card-one', name: 'Stoneguard', source_game_id: game.id, type: 'Equipment', base_rarity: 'Rare', description: 'An ancient shield.' }] }
} };
const built = await build({
  stdin: { contents: "export { default as Hub } from './src/components/game/GameHubTabs.jsx'; export * from './src/components/game/detail/gameDetailData.js';", resolveDir: process.cwd(), loader: 'jsx' },
  bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external', jsx: 'automatic',
  alias: { '@': process.cwd() + '/src' }, loader: { '.css': 'empty' },
  plugins: [{ name: 'isolated-dependencies', setup(b) {
    b.onResolve({ filter: /^lucide-react$/ }, () => ({ path: process.cwd() + '/node_modules/lucide-react/dist/esm/lucide-react.js' }));
    b.onResolve({ filter: /base44Client|AuthContext|CartContext|react-router-dom|atomTelemetry|StoreIdleViewer/ }, args => ({ path: args.path, namespace: 'test' }));
    b.onLoad({ filter: /.*/, namespace: 'test' }, args => ({ loader: 'js', contents:
      args.path.includes('base44Client') ? 'export const base44 = globalThis.fixture.SDK;' :
      args.path.includes('AuthContext') ? "export const useAuth=()=>({user:{id:'player-one',full_name:'Test Player'},isAuthenticated:globalThis.fixture.session.authenticated,login:()=>globalThis.fixture.calls.login++});" :
      args.path.includes('CartContext') ? "export const useCart=()=>({cart:[],isPurchased:()=>globalThis.fixture.session.owned,addToCart:item=>globalThis.fixture.calls.cart.push(item),openCart:()=>{}});" :
      args.path.includes('react-router-dom') ? "export const useNavigate=()=>path=>globalThis.fixture.calls.navigation=path;" :
      args.path.includes('atomTelemetry') ? "export const AtomEvents={}; export const trackAtomEvent=()=>{};" :
      "export default function Preview(){return null;}"
    }));
  } }]
});
const module = { exports: {} };
const context = { module, exports: module.exports, require, globalThis: { fixture: { SDK, calls, session } }, window, document, navigator, console, setTimeout, clearTimeout, setInterval, clearInterval, URL, HTMLElement, Element, Node, NodeFilter, HTMLInputElement, MutationObserver, CustomEvent, getComputedStyle };
vm.runInNewContext(built.outputFiles[0].text, context);
const { Hub, gameMedia, trailerSource, requirementGroups } = module.exports;
assert.equal(gameMedia(game).length, 3, 'duplicate and invalid media must be omitted');
assert.equal(trailerSource('javascript:alert(1)'), null);
assert.equal(trailerSource('https://youtube.com/watch?v=trailer1'), null);
assert.equal(trailerSource('https://youtu.be/abcdefghijk').kind, 'embed');
assert.equal(trailerSource('https://example.com/trailer.mp4?token=demo').kind, 'video');
assert.equal(requirementGroups({}).length, 0);
assert.equal(requirementGroups(game)[0].rows.length, 1, 'do not invent specifications');

const root = createRoot(document.getElementById('root'));
const tick = () => new Promise(resolve => setTimeout(resolve, 10));
const run = async fn => act(async () => { fn?.(); await tick(); });
const render = async props => { await run(() => root.render(React.createElement(Hub, props))); await run(); };
const buttons = () => [...document.querySelectorAll('button')];
const button = text => { const el = buttons().find(x => x.textContent.trim() === text); assert.ok(el, 'Missing button: ' + text); return el; };
const labelButton = text => { const el = buttons().find(x => x.getAttribute('aria-label') === text); assert.ok(el, 'Missing labeled button: ' + text); return el; };
const body = () => document.body.textContent;
await render({ gameId: game.id, onClose: () => calls.closed = true });
assert.equal(calls.get, 1, 'one game fetch per route');
assert.ok(document.querySelector('h1').textContent === game.title);
assert.equal(document.querySelectorAll('iframe').length, 0, 'no trailer autoplay on entry');
await run(() => labelButton('Show Screenshot 2').click());
assert.equal(labelButton('Show Screenshot 2').getAttribute('aria-pressed'), 'true');
await run(() => labelButton('Expand media').click());
assert.ok(document.querySelector('[role="dialog"]').textContent.includes('Screenshot 2'));
await run(() => document.querySelector('[role="dialog"]').dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true })));
assert.ok(document.querySelector('[role="dialog"]').textContent.includes('Screenshot 1'));
await run(() => labelButton('Close media').click());
assert.equal(document.querySelector('[role="dialog"]'), null);
assert.equal(labelButton('Show Screenshot 1').getAttribute('aria-pressed'), 'true', 'theater and inline selection remain synchronized');
await run(() => labelButton('Show Official trailer').click());
await run(() => button('Play trailer').click());
assert.match(document.querySelector('iframe').src, /youtube-nocookie/);
await run(() => labelButton('Show Screenshot 1').click());
assert.equal(document.querySelector('iframe'), null, 'changing media stops playback');
await run(() => button('Add to cart').click());
assert.equal(calls.cart[0].id, game.id);
assert.equal(calls.cart[0].price, 29.99);
failWishlist = true;
await run(() => button('Add to wishlist').click());
assert.ok(body().includes('wishlist could not be updated'));
assert.equal(button('Add to wishlist').disabled, false);
failWishlist = false;
await run(() => button('Add to wishlist').click());
assert.equal(button('On your wishlist').getAttribute('aria-pressed'), 'true');
assert.equal(calls.wishlist[0].game_id, game.id);
await run(() => button('System requirements').click());
assert.ok(body().includes('8 GB RAM'));
assert.ok(!body().includes('RTX 4080'));
await run(() => button('Reviews').click());
assert.ok(body().includes('No player reviews'));
assert.ok(!body().includes('Very Positive'));
await run(() => button('Write a review').click());
await run(() => {
  const textarea = document.querySelector('textarea');
  Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set.call(textarea, 'A memorable adventure.');
  textarea.dispatchEvent(new window.Event('input', { bubbles: true }));
});
await run(() => document.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
assert.equal(calls.reviews.length, 1);
assert.equal(calls.reviews[0].user_id, 'player-one');
assert.equal(calls.reviews[0].game_title, game.title);
assert.ok(body().includes('A memorable adventure.'));
await run(() => button('Luna extras').click());
assert.ok(body().includes('Northern Reach'));
assert.ok(body().includes('Stoneguard'));
assert.ok(!body().includes('Neural Expansion Pack'));
await run(() => button('Add expansion to cart').click());
assert.equal(calls.cart[1].id, 'expansion');
assert.equal(calls.cart[1].gameId, game.id);
await run(() => button('Luna extras').dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Home', bubbles: true })));
assert.equal(button('Overview').getAttribute('aria-selected'), 'true');
await run(() => button('Store').click());
assert.equal(calls.closed, true);
session.owned = true;
await render({ gameId: game.id });
await run(() => button('Open in library').click());
assert.equal(calls.navigation, '/Library');
session.owned = false; session.authenticated = false;
await render({ gameId: game.id });
await run(() => button('Sign in to add to cart').click());
assert.equal(calls.login, 1);
await render({ game: { ...game, id: 'soon', status: 'planned' } });
assert.equal(button('Coming soon').disabled, true);
await render({ game: { ...game, id: 'unknown', price: undefined, screenshots: [], video_urls: [], trailer_url: null, system_requirements: null } });
assert.equal(button('Not available yet').disabled, true);
assert.equal(document.querySelectorAll('.gd-thumbnail').length, 0, 'single artwork is not repeated as fake screenshots');
await run(() => button('System requirements').click());
assert.ok(body().includes("haven't been published"));
failGet = true;
await render({ gameId: 'broken', onClose: () => {} });
assert.ok(body().includes("couldn't be loaded"));
failGet = false;
await run(() => button('Try again').click());
assert.ok(document.querySelector('h1').textContent === game.title);
await run(() => root.unmount());
dom.window.close();
console.log('PASS: gallery/theater and keyboard controls, no autoplay, cart/sign-in/owned/upcoming states, wishlist failures + persistence, published requirements, saved reviews, real DLC/cards, route loading + recovery.');
