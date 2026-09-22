import assert from 'node:assert/strict';
import Module, { createRequire } from 'node:module';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<div id="root"></div>', { url: 'https://test.local/Community', pretendToBeVisual: true });
for (const name of ['window','document','HTMLElement','SVGElement','HTMLInputElement','HTMLTextAreaElement','Element','Node','NodeFilter','Event','CustomEvent','MutationObserver','DOMException']) globalThis[name] = dom.window[name];
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.requestAnimationFrame = callback => setTimeout(callback, 0);
globalThis.cancelAnimationFrame = clearTimeout;
globalThis.localStorage = dom.window.localStorage;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
dom.window.HTMLElement.prototype.scrollIntoView = function () {};
dom.window.HTMLElement.prototype.scrollTo = function () {};
const React = await import('react');
const { act } = React;
const { createRoot } = await import('react-dom/client');
const { MemoryRouter, useLocation, useNavigate } = await import('react-router-dom');
const { QueryClient, QueryClientProvider } = createRequire(import.meta.url)('@tanstack/react-query');

const games = [
  { id: 'river', title: 'River Knights', genre: 'RPG, Adventure', developer: 'River Studio' },
  { id: 'sky', title: 'Sky Racers', genre: 'Racing', developer: 'Cloud Studio' },
];
const now = new Date().toISOString();
const posts = [
  { id: 'post1', title: 'A better knight build', content: 'Try this route through the river.', game_title: 'River Knights', community: 'guide', author_name: 'Ada', user_id: 'other', created_date: now },
  { id: 'post2', title: 'Sky racing tips', content: 'The best turn on the circuit.', game_title: 'Sky Racers', community: 'tips', author_name: 'Chris', user_id: 'other', created_date: now },
];
const F = globalThis.uiFixtures = {
  games, posts, reactions: [], comments: [], messages: [], calls: [], user: { id: 'viewer', username: 'Tester' },
  failPublish: false, delayedGame: '', delayedResolve: null,
  profile: { id: 'profile1', user_id: 'owner', display_name: 'Moon Arcade', tagline: 'Adventure after dark', bio: 'A welcoming corner for RPG players.', follower_count: 321 },
  streams: [{ id: 'live1', streamer_id: 'owner', title: 'River Knights live', game_id: 'river', is_live: true, playback_url: 'https://media.example/live.m3u8', viewer_count: 17, started_at: now }],
  homeData: { schedules: [{ id: 'next', title: 'The next quest', scheduled_start: new Date(Date.now() + 86400000).toISOString() }], layouts: [{ gallery_images: ['example.jpg'], pinned_games: ['river'] }], sponsors: [], streams: [], auraStreams: [], failures: [] },
};
const sdk = globalThis.uiSdk = {
  functions: { invoke: async (name, payload) => {
    F.calls.push({ name, ...payload });
    if (payload.action === 'session') return { isModerator: false };
    if (payload.action === 'create_post') {
      if (F.failPublish) throw new Error('Temporary publish failure');
      F.posts.push({ id: 'created', ...payload.data, created_date: now, user_id: F.user.id });
    }
    return { success: true };
  } },
  integrations: { Core: { UploadFile: async () => ({ file_url: 'https://media.example/avatar.png' }) } },
  entities: {
    Game: { list: async () => games, filter: async ({ id }) => games.filter(game => game.id === id) },
    Post: { filter: async filter => {
      const rows = F.posts.filter(post => !filter.game_title || post.game_title === filter.game_title);
      if (F.delayedGame === filter.game_title) return new Promise(resolve => { F.delayedResolve = () => resolve(rows); });
      return rows;
    } },
    ForumReaction: { list: async () => F.reactions },
    Comment: { filter: async () => F.comments },
    StreamerProfile: { filter: async filter => (filter.id === F.profile.id || filter.user_id === F.profile.user_id) ? [F.profile] : [] },
    Stream: { filter: async () => F.streams, subscribe: () => () => {} },
    AuraStream: { filter: async () => [], subscribe: () => () => {} },
    StreamChatMessage: { filter: async ({ stream_id }) => F.messages.filter(message => message.stream_id === stream_id), subscribe: () => () => {}, create: async data => { F.calls.push({ action: 'send_chat', data }); F.messages.push({ id: 'message' + F.messages.length, created_date: now, ...data }); } },
  },
};
const componentMocks = {
  GlassPageFrame: 'export default function Frame(p){return <>{p.children}{p.bottomContent}</>}',
  PageErrorBoundary: 'export default function Boundary(p){return p.children}',
  SideAccessMenu: 'export default function Side(){return null}',
  AuraBottomNav: 'export default function Nav(){return <nav>Aura navigation</nav>}',
  StreamPlayerBox: 'export default function Player(){return <div data-stream-player-box="true">Stream player</div>}',
  StreamMedia: 'export default function Media(p){return <div data-media-url={p.url}>Live media</div>}',
  EditModeToolbar: 'export default function Toolbar(p){return p.isEditMode?<button onClick={p.onSave}>Save channel</button>:null}',
  PlayerAchievementCollection: 'export default function Cards(p){globalThis.uiFixtures.collection=p;return <section id="player-achievement-collection" role="dialog" aria-label="Channel cards"><button onClick={p.onClose}>Close cards</button></section>}',
  GallerySection: 'export default function Gallery(p){globalThis.uiFixtures.gallery=p;return <section role="dialog" aria-label="Channel gallery"><button onClick={p.onClose}>Close gallery</button></section>}',
  ScheduleSection: 'export default function Schedule(p){globalThis.uiFixtures.schedule=p;return <section role="dialog" aria-label="Channel schedule"><button onClick={p.onClose}>Close schedule</button></section>}',
  GamesSection: 'export default function Games(p){globalThis.uiFixtures.gameProps=p;return <section role="dialog" aria-label="Channel games"><button onClick={p.onClose}>Close games</button></section>}',
  SponsorEditor: 'export default function Sponsors(){return <div>Sponsors & Partners</div>}',
  SponsorsSection: 'export default function Sponsors(){return <div>Sponsors & Partners</div>}',
  ProductsGrid: 'export default function Shop(){return <div>Products & Events</div>}',
  ViewerSeasonalPass: 'export default function Pass(){return <div>Channel season pass</div>}',
};
const compiled = await build({
  stdin: { contents: "export {default as Forum} from './src/pages/Community.jsx';export {default as Home} from './src/pages/StreamingHome.jsx';export {default as Quick} from './src/components/shared/QuickGamesDrawer.jsx';", loader: 'jsx', resolveDir: process.cwd() },
  bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external', jsx: 'automatic', alias: { '@': process.cwd() + '/src' }, loader: { '.css': 'empty' },
  plugins: [{ name: 'isolate-network-and-heavy-overlays', setup(b) {
    b.onResolve({ filter: /^lucide-react$/ }, () => ({ path: process.cwd() + '/node_modules/lucide-react/dist/esm/lucide-react.js' }));
    b.onResolve({ filter: /base44Client|AuthContext|useSidebarVisible|ErrorToast|useChannelHomeData|useCreatorEditMode|GlassPageFrame|PageErrorBoundary|SideAccessMenu|AuraBottomNav|StreamPlayerBox|StreamMedia$|EditModeToolbar|PlayerAchievementCollection|GallerySection|ScheduleSection|GamesSection|SponsorEditor|SponsorsSection|ProductsGrid|ViewerSeasonalPass/ }, args => ({ path: args.path, namespace: 'fixture' }));
    b.onLoad({ filter: /.*/, namespace: 'fixture' }, args => {
      const key = args.path.split('/').pop().replace(/\.jsx?$/, '');
      let contents = componentMocks[key];
      if (key === 'base44Client') contents = 'export const base44=globalThis.uiSdk;';
      if (key === 'AuthContext') contents = 'export const useAuth=()=>({user:globalThis.uiFixtures.user,isAuthenticated:!!globalThis.uiFixtures.user});';
      if (key === 'useSidebarVisible') contents = 'export const useSidebarVisible=()=>[false,()=>{}];';
      if (key === 'ErrorToast') contents = 'export const showError=()=>{};export const showSuccess=()=>{};';
      if (key === 'useChannelHomeData') contents = 'export default function useData(){return {data:globalThis.uiFixtures.homeData,isPending:false,isError:false,refetch:()=>{}}}';
      if (key === 'useCreatorEditMode') contents = "import {useState} from 'react';export default function useEdit(){const [editing,setEditing]=useState(false);return {activeProfile:globalThis.uiFixtures.profile,activeLayout:globalThis.uiFixtures.homeData.layouts[0],activeSponsors:[],isEditMode:editing,saving:false,enterEditMode:()=>setEditing(true),cancelEdit:()=>setEditing(false),saveEdit:()=>setEditing(false),updateEditProfile:(key,value)=>globalThis.uiFixtures.calls.push({action:'edit_profile',key,value}),updateEditLayout:()=>{},addEditSponsor:()=>{},removeEditSponsor:()=>{},updateEditSponsor:()=>{}}}";
      assert.ok(contents, 'Missing mock for ' + key);
      return { loader: 'jsx', contents, resolveDir: process.cwd() };
    });
  } }],
});
const bundle = new Module(process.cwd() + '/tests/__forum_channel_bundle.cjs');
bundle.paths = Module._nodeModulePaths(process.cwd());
bundle._compile(compiled.outputFiles[0].text, bundle.filename || process.cwd() + '/tests/__forum_channel_bundle.cjs');
const { Forum, Home, Quick } = bundle.exports;
const h = React.createElement;
const run = async fn => act(async () => { fn(); await new Promise(resolve => setTimeout(resolve, 35)); });
const byLabel = label => document.querySelector('[aria-label="' + label + '"]');
const button = text => [...document.querySelectorAll('button')].find(item => item.textContent.trim() === text);
const input = async (node, value) => run(() => {
  const proto = node.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(node, value);
  node.dispatchEvent(new window.Event('input', { bubbles: true }));
});
let location, navigate, root, client;
function Probe(){ location = useLocation(); navigate = useNavigate(); return null; }
async function mount(Component, path='/Community', props={}) {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  root = createRoot(document.getElementById('root'));
  await run(() => root.render(h(QueryClientProvider, { client }, h(MemoryRouter, { initialEntries: [path], future:{v7_startTransition:true,v7_relativeSplatPath:true} }, h(Probe), h(Component, props)))));
  await run(() => {});
}
async function unmount(){await run(() => root.unmount()); client.clear();}

await mount(Forum);
assert.ok(document.body.textContent.includes('Better conversations.'));
assert.equal(document.querySelectorAll('.forum-feed-post').length, 2);
const forumTrigger = document.querySelector('.forum-browse-button');
await run(() => { forumTrigger.focus(); window.dispatchEvent(new CustomEvent('openForumDirectory')); });
assert.ok(byLabel('Search game forums'), 'bottom filter opens the complete directory');
assert.equal(document.activeElement, byLabel('Search game forums'), 'directory focuses search');
await run(() => byLabel('Search game forums').dispatchEvent(new window.KeyboardEvent('keydown', {key:'Escape',bubbles:true})));
assert.ok(!byLabel('Search game forums'), 'Escape closes the directory');
assert.equal(document.activeElement, forumTrigger, 'closing the directory returns focus to its opener');
await run(() => forumTrigger.click());
await run(() => [...document.querySelectorAll('.forum-directory-filters button')].find(node => node.querySelector('span').textContent === 'Racing').click());
await input(byLabel('Search game forums'), 'River');
assert.equal(document.querySelectorAll('.forum-directory-game').length, 0, 'genre and text search apply together');
await run(() => button('Clear filters').click());
assert.equal(document.querySelectorAll('.forum-directory-game').length, 2);
await input(byLabel('Search game forums'), 'River');
assert.equal(document.querySelectorAll('.forum-directory-game').length, 1);
await run(() => document.querySelector('.forum-directory-game').click());
assert.equal(new URLSearchParams(location.search).get('game'), 'River Knights');
assert.equal(document.querySelectorAll('.forum-feed-post').length, 1);
assert.equal(document.querySelector('#forum-page-title').textContent, 'River Knights');
await run(() => document.querySelector('.forum-post-open').click());
assert.ok(document.body.textContent.includes('Join the conversation. Share something useful'));
assert.ok(button('Post comment'), 'thread keeps the reply action');
await run(() => button('Back to River Knights').click());
await run(() => button('All forums').click());
assert.equal(location.search, '', 'all-forum return clears the URL');
assert.equal(document.querySelectorAll('.forum-feed-post').length, 2);
await input(byLabel('Search discussions'), 'sky');
assert.equal(document.querySelectorAll('.forum-feed-post').length, 1);
assert.ok(document.querySelector('.forum-post-open').textContent.includes('Sky racing tips'));
await run(() => byLabel('Clear discussion search').click());
await run(() => button('New post').click());
assert.ok(document.querySelector('[role="dialog"]'));
await input(byLabel('Post title'), 'My saved draft');
await input(byLabel('Your post'), 'Useful advice for other players.');
F.failPublish = true;
await run(() => button('Publish').click());
assert.equal(byLabel('Post title').value, 'My saved draft', 'failed publishing retains the draft');
assert.ok(document.querySelector('[role="alert"]').textContent.includes('Temporary publish failure'));
F.failPublish = false;
await run(() => button('Publish').click());
assert.ok(!byLabel('Post title'), 'successful publish closes the editor');
assert.ok(F.calls.some(call => call.action === 'create_post' && call.data.title === 'My saved draft'));
F.delayedGame = 'River Knights';
await run(() => navigate('/Community?game=River%20Knights'));
await run(() => navigate('/Community?game=Sky%20Racers'));
assert.equal(document.querySelector('#forum-page-title').textContent, 'Sky Racers');
await run(() => F.delayedResolve?.());
assert.ok(document.querySelector('.forum-feed-list').textContent.includes('Sky racing tips'), 'stale game response cannot replace the current feed');
assert.ok(!document.querySelector('.forum-feed-list').textContent.includes('A better knight build'));
await run(() => navigate('/Community'));
assert.ok(document.querySelector('#forum-page-title').textContent.includes('Better conversations.'));
await unmount();

let selected;
await mount(Quick, '/Community', { isOpen:true,type:'forum',games:[],onClose:()=>{selected='closed'} });
await input(byLabel('Search game forums'), 'Cloud');
await run(() => document.querySelector('.forum-directory-game').click());
assert.equal(selected,'closed');
assert.equal(new URLSearchParams(location.search).get('game'),'Sky Racers','sidebar quick menu uses the same complete directory');
await unmount();

await mount(Home, '/StreamingHome?streamerId=owner');
assert.equal(document.querySelector('.channel-name-line h1').textContent, 'Moon Arcade');
assert.equal(document.querySelector('[data-media-url]').dataset.mediaUrl, F.streams[0].playback_url);
for (const [name, dialog] of [['Schedule','Channel schedule'],['Cards','Channel cards'],['Gallery','Channel gallery'],['Games','Channel games']]) {
  const tab=[...document.querySelectorAll('.channel-section-nav button')].find(node=>node.querySelector('strong').textContent===name);
  await run(()=>tab.click());
  assert.ok(byLabel(dialog), name+' opens on the public profile');
  assert.equal(tab.getAttribute('aria-pressed'),'true');
  if(name==='Cards') { assert.equal(F.collection.user.id,'owner'); assert.equal(F.collection.publicView,true); }
  if(name==='Gallery') assert.equal(F.gallery.channelId,'owner');
  await run(()=>byLabel(dialog).querySelector('button').click());
}
for (const feature of ['Sponsors & Partners','Products & Events','Channel season pass']) assert.ok(document.body.textContent.includes(feature));
await run(()=>button('View schedule').click());
assert.equal(F.schedule.initialDate,F.homeData.schedules[0].scheduled_start);
await run(()=>button('Close schedule').click());
const chatInput=document.querySelector('#channel-chat-message');
assert.equal(chatInput.disabled,false);
await input(chatInput,'Hello from the channel');
await run(()=>byLabel('Send chat message').click());
assert.ok(F.calls.some(call=>call.action==='send_chat'&&call.data.stream_id==='live1'&&call.data.content==='Hello from the channel'));
assert.ok(document.querySelector('[role="log"]').textContent.includes('Hello from the channel'));
await unmount();

F.streams=[]; F.user=null;
await mount(Home,'/StreamingHome?streamerId=owner');
assert.equal(document.querySelector('#channel-chat-message').disabled,true);
assert.ok(document.body.textContent.includes('Stay for the good company.'));
await run(()=>button('See the schedule').click());
assert.ok(byLabel('Channel schedule'));
await unmount();

F.user={id:'owner',username:'Owner'};
await mount(Home,'/StreamingHome');
await run(()=>button('Edit channel').click());
assert.ok(button('Save channel'),'creator editing stays available');
const nameInput=[...document.querySelectorAll('.channel-identity-fields input')][0];
await input(nameInput,'New channel name');
assert.ok(F.calls.some(call=>call.action==='edit_profile'&&call.key==='display_name'&&call.value==='New channel name'));
assert.equal(document.querySelectorAll('.channel-section-nav button').length,4,'all channel sections remain available while editing');
await unmount();
dom.window.close();
console.log('PASS: forum directory entry points, game navigation and return, discussion search/thread, failed-draft retention, publishing, stale response protection; public/creator channel identity and four section controls, next schedule, retained modules, live chat send and offline guard.');
