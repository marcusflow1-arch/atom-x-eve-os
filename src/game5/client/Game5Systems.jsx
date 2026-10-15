import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  Circle,
  Crown,
  Feather,
  Gem,
  Layers,
  Lock,
  Package,
  Plus,
  Search,
  Shield,
  Sparkles,
  Swords,
  Wind,
} from "lucide-react";
import {
  ARCHETYPES,
  CULTIVATION,
  MATERIALS,
  MOUNT_SLOTS,
  OVERCHARGE,
  RARITIES,
  SHOP,
  SKILLS,
  SLOTS,
  VANITY_SLOTS,
  enchantChance,
  isEquipped,
  tierFor,
} from "../systems/rules.mjs";
import { itemStats, mountShare } from "../systems/stats.mjs";
import {
  createConnectedSystemsTransport,
  createSandboxTransport,
} from "./systemsTransport.mjs";
import "./systems.css";

const tabs = [
  ["loadout", "Equipment", Swords],
  ["mount", "Spirit mount", Wind],
  ["vanity", "Vanity atelier", Feather],
  ["halo", "Cultivation", Crown],
  ["combat", "Combat trial", Shield],
  ["supplies", "Supplies", Package],
];
const label = (value) =>
  value.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
const number = (n) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(n);
const percent = (n) => `${number(n * 100)}%`;
function Panel({ title, eyebrow, children, className = "" }) {
  return (
    <section className={`g5-panel ${className}`}>
      <header>
        {eyebrow && <small>{eyebrow}</small>}
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  );
}
function Meter({ value, max, name }) {
  return (
    <div className="g5-meter">
      <div>
        <span>{name}</span>
        <span>
          {number(value)} / {number(max)}
        </span>
      </div>
      <progress aria-label={name} value={value} max={max} />
    </div>
  );
}
function Confirm({ data, close, confirm }) {
  const dialog = useRef(null);
  useEffect(() => {
    dialog.current.showModal();
  }, []);
  return (
    <dialog ref={dialog} className="g5-confirm" onCancel={close}>
      <small>REVIEW ACTION</small>
      <h2>{data.title}</h2>
      <p>{data.description}</p>
      <div>
        <button autoFocus onClick={close}>
          Keep unchanged
        </button>
        <button
          className="g5-primary"
          onClick={() => {
            confirm(data.command);
            close();
          }}
        >
          Confirm
        </button>
      </div>
    </dialog>
  );
}

/** Admin-only systems workbench; assets and the existing quest scene remain untouched. */
export default function Game5Systems({ onBack, connectedTransport }) {
  const [mode, setMode] = useState("sandbox");
  const [sandbox] = useState(() => createSandboxTransport());
  const [connected] = useState(
    () => connectedTransport || createConnectedSystemsTransport(),
  );
  const transport = mode === "sandbox" ? sandbox : connected;
  const [data, setData] = useState(null),
    [tab, setTab] = useState("mount");
  const [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState("chosen-weapon"),
    [owner, setOwner] = useState("character");
  const [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState(null),
    [stone, setStone] = useState("enchant-3");
  const [protection, setProtection] = useState("protection"),
    [gem, setGem] = useState("attackGem"),
    [ready, setReady] = useState(0);
  const epoch = useRef(0),
    locked = useRef(false);
  async function refresh() {
    const version = epoch.current;
    try {
      const next = await transport.load();
      if (version === epoch.current) {
        setData(next);
        setError("");
      }
    } catch (e) {
      if (version === epoch.current) setError(e.message);
    }
  }
  useEffect(() => {
    epoch.current++;
    setData(null);
    setError("");
    setMessage("");
    setConfirmation(null);
    refresh();
    return () => {
      epoch.current++;
    };
  }, [transport]);
  async function act(command) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    const version = epoch.current;
    try {
      const next =
        command.type === "__retry"
          ? await transport.retry()
          : command.type === "__reset"
            ? await transport.reset()
            : await transport.execute(command);
      if (version === epoch.current) {
        setData(next);
        setMessage(next.message || "Workbench reset.");
        setError("");
      }
    } catch (e) {
      if (version === epoch.current) {
        setError(e.message);
        if (e.status === 409) {
          try {
            setData(await transport.load());
          } catch {
            /* Retain actionable original error. */
          }
        }
      }
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  const p = data?.player,
    s = data?.stats;
  const liveEncounter = p?.encounter && !p.encounter.finished;
  useEffect(() => {
    if (mode !== "sandbox" || !data) return;
    const timer = setInterval(() => {
      if (
        !locked.current &&
        (liveEncounter || p.mount.absorbedUntil > data.serverTime)
      )
        act({ type: "tick" });
    }, 1000);
    return () => clearInterval(timer);
  }, [transport, liveEncounter, p?.mount.absorbedUntil, data?.serverTime]);
  const item = p?.inventory.find((i) => i.id === selectedId);
  const itemName = (id) =>
    p?.inventory.find((i) => i.id === id)?.name || "Empty slot";
  const choose = (id) => {
    setSelectedId(id);
    setTab("loadout");
  };
  const action = (text, command, disabled = false, className = "") => (
    <button
      className={className}
      disabled={busy || disabled}
      onClick={() => act(command)}
    >
      {text}
    </button>
  );
  const ask = (title, description, command) =>
    setConfirmation({ title, description, command });
  const slotGrid = (slots, assigned) => (
    <div className="g5-slots">
      {slots.map((slot) => (
        <button
          key={slot}
          onClick={() =>
            assigned[slot]
              ? choose(assigned[slot])
              : (setTab("loadout"), setFilter(slot), setQuery(""))
          }
          aria-label={`${label(slot)}: ${itemName(assigned[slot])}`}
        >
          <span className="g5-slot-icon">
            {assigned[slot] ? <Gem size={22} /> : <Plus size={20} />}
          </span>
          <span>
            <small>{label(slot)}</small>
            <strong>{itemName(assigned[slot])}</strong>
          </span>
          {assigned[slot] && <Check size={13} />}
        </button>
      ))}
    </div>
  );
  function keydown(e) {
    if (
      /INPUT|SELECT|TEXTAREA/.test(e.target.tagName) ||
      e.target.isContentEditable ||
      e.repeat ||
      e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      confirmation
    )
      return;
    if (/^[123]$/.test(e.key) && tab === "combat") {
      e.preventDefault();
      attack(ARCHETYPES[s.archetype].skills[Number(e.key) - 1]);
    }
  }
  function attack(skillId) {
    const target = p.encounter?.targets.find((t) => t.hp > 0);
    if (target) act({ type: "attack", targetId: target.id, skillId });
  }
  return (
    <div className="g5-systems" onKeyDown={keydown}>
      <header className="g5-topbar">
        <button onClick={onBack} aria-label="Return to Game 5">
          <ArrowLeft size={18} />
        </button>
        <div className="g5-wordmark">
          WUXIA <span>/</span> <small>GAME 05</small>
        </div>
        <span className="g5-separator" />
        <span className="g5-top-title">Character systems</span>
        <div className="g5-wallet">
          <span>
            <Circle size={12} /> {number(p?.wallet.silver || 0)}{" "}
            <small>silver</small>
          </span>
          <span>
            <Gem size={13} /> {number(p?.wallet.cp || 0)} <small>CP</small>
          </span>
        </div>
      </header>
      <div className="g5-shell">
        <aside className="g5-sidebar">
          <div className="g5-identity">
            <span className="g5-sigil">
              <Wind size={27} />
            </span>
            <small>THE INKBOUND PATH</small>
            <h1>Spirit & steel</h1>
            <p>
              {p
                ? `Level ${p.level} · ${label(p.faction)}`
                : "Character systems"}
            </p>
          </div>
          <nav aria-label="Character systems">
            {tabs.map(([id, name, Icon]) => (
              <button
                key={id}
                aria-current={tab === id ? "page" : undefined}
                onClick={() => setTab(id)}
              >
                <Icon size={18} />
                {name}
                <ChevronRight size={14} />
              </button>
            ))}
          </nav>
          <div className="g5-sidebar-note">
            <small>ART DIRECTION</small>
            <p>Sumi-e ink</p>
            <span>Layered charcoal. Jade accents. Quiet gold.</span>
          </div>
          <label className="g5-mode">
            Data source
            <select
              value={mode}
              disabled={busy}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="sandbox">Local sandbox</option>
              <option value="connected">Connected backend</option>
            </select>
          </label>
        </aside>
        <main className="g5-main">
          <div className="g5-context">
            <span>
              {mode === "sandbox"
                ? "SANDBOX · SIMULATED RESOURCES"
                : "CONNECTED · VERIFIED ACCOUNT REQUIRED"}
            </span>
            <button disabled={busy} onClick={refresh}>
              Refresh
            </button>
          </div>
          <div className="g5-page-title">
            <div>
              <small>
                CHARACTER / {tabs.find((t) => t[0] === tab)?.[1].toUpperCase()}
              </small>
              <h1>
                {
                  {
                    loadout: "The armory",
                    mount: "A bond beyond form",
                    vanity: "Make the path your own",
                    halo: "Cultivate your spirit",
                    combat: "Steel meets intention",
                    supplies: "Prepare for the journey",
                  }[tab]
                }
              </h1>
              <p>
                {
                  {
                    loadout:
                      "Inspect your equipment, unlock overcharge and shape your build.",
                    mount:
                      "Absorb your mount’s strength. Invest its experience in your spiritual weapon.",
                    vanity:
                      "Separate layers for you and your mount. Every enhancement has a visible effect.",
                    halo: "Grow your attributes, halo and spiritual wings through deliberate investment.",
                    combat:
                      "Test your equipped skills and progression in a contained combat encounter.",
                    supplies:
                      "Manage companion growth and purchase supplies with sandbox silver.",
                  }[tab]
                }
              </p>
            </div>
            <span className="g5-page-mark">
              {String(tabs.findIndex((t) => t[0] === tab) + 1).padStart(2, "0")}
            </span>
          </div>
          <div
            className="g5-notice"
            role={error ? "alert" : "status"}
            data-error={!!error}
          >
            {error ||
              message ||
              "Progression balance is configurable. No production rewards are issued in the sandbox."}
            {connected.hasPending?.() &&
              mode === "connected" &&
              action("Retry last action", { type: "__retry" })}
          </div>
          {!data ? (
            <Panel
              title={
                error ? "Backend connection unavailable" : "Loading character…"
              }
            >
              <p>
                {error
                  ? "This mode requires the systems API to be hosted with account authentication. It will not substitute local character data."
                  : "Reading your saved workbench."}
              </p>
            </Panel>
          ) : (
            <>
              <div className="g5-stat-strip">
                {[
                  ["Attack", s.attack],
                  ["Defense", s.defense],
                  ["Health", s.maxHp],
                  ["Critical", percent(s.critical)],
                  ["Mount share", percent(s.share)],
                ].map(([name, value]) => (
                  <div key={name}>
                    <small>{name}</small>
                    <strong>
                      {typeof value === "number" ? number(value) : value}
                    </strong>
                  </div>
                ))}
              </div>
              {tab === "mount" && (
                <div className="g5-columns">
                  <div className="g5-stack">
                    <Panel
                      title={p.mount.name}
                      eyebrow="SPIRIT MOUNT"
                      className="g5-mount-card"
                    >
                      <div className="g5-mount-summary">
                        <span className="g5-large-sigil">
                          <Wind size={58} />
                        </span>
                        <div>
                          <span className="g5-tag">
                            {label(p.mount.species)} · {label(p.mount.element)}
                          </span>
                          <h3>
                            One spirit.
                            <br />
                            Shared strength.
                          </h3>
                          <p>
                            Base stat sharing starts immediately. Seven fully
                            enhanced mount pieces can lift it from 25% to 39%
                            during absorption.
                          </p>
                        </div>
                      </div>
                      <div className="g5-mount-metrics">
                        <div>
                          <small>Available share</small>
                          <strong>{percent(mountShare(p))}</strong>
                        </div>
                        <div>
                          <small>Stored spirit XP</small>
                          <strong>{number(p.mount.xp)}</strong>
                        </div>
                        <div>
                          <small>Absorption</small>
                          <strong>
                            {s.absorbed
                              ? `${Math.ceil((p.mount.absorbedUntil - data.serverTime) / 60000)} min`
                              : "Inactive"}
                          </strong>
                        </div>
                      </div>
                      <div className="g5-actions">
                        {action(
                          <>
                            <Sparkles size={16} /> Absorb · 60 min
                          </>,
                          { type: "absorb", material: "absorption60" },
                          !p.materials.absorption60,
                          "g5-primary",
                        )}
                        {action(
                          "Absorb · 600 min",
                          { type: "absorb", material: "absorption600" },
                          !p.materials.absorption600,
                        )}
                        {action(
                          "Feed · +100 XP",
                          { type: "feedMount" },
                          !p.materials.feed,
                        )}
                      </div>
                      <small className="g5-footnote">
                        Pills available: {p.materials.absorption60 || 0} short ·{" "}
                        {p.materials.absorption600 || 0} long. Feed stores XP;
                        it does not level the mount.
                      </small>
                    </Panel>
                    <Panel
                      title="Seven pieces. One bond."
                      eyebrow="MOUNT EQUIPMENT"
                    >
                      {slotGrid(MOUNT_SLOTS, p.mount.equipment)}
                      <details>
                        <summary>Equip from your inventory</summary>
                        <div className="g5-list">
                          {p.inventory
                            .filter(
                              (i) =>
                                i.owner === "mount" && i.kind === "equipment",
                            )
                            .map((i) => (
                              <div key={i.id}>
                                <span>{i.name}</span>
                                {action(
                                  isEquipped(p, i.id) ? "Equipped" : "Equip",
                                  { type: "equip", itemId: i.id },
                                  isEquipped(p, i.id),
                                )}
                              </div>
                            ))}
                        </div>
                      </details>
                    </Panel>
                  </div>
                  <div className="g5-stack">
                    <Panel title="Spiritual weapon" eyebrow="OFFENSE / UTILITY">
                      <div className="g5-rank">
                        <Swords size={28} />
                        <strong>
                          {p.mount.spiritualRank}
                          <small> / {CULTIVATION.spiritualRankCap}</small>
                        </strong>
                      </div>
                      <div
                        className="g5-segment"
                        role="group"
                        aria-label="Spiritual weapon mode"
                      >
                        {["offensive", "utility"].map((value) => (
                          <button
                            key={value}
                            disabled={busy}
                            aria-pressed={p.mount.spiritualMode === value}
                            onClick={() =>
                              act({ type: "spiritualMode", mode: value })
                            }
                          >
                            {label(value)}
                          </button>
                        ))}
                      </div>
                      <p>
                        {p.mount.spiritualMode === "offensive"
                          ? "Adds armor-bypassing spiritual damage while your mount is absorbed."
                          : "Trades spiritual damage for agility and critical chance while absorbed. Movement bonus is computed; world-controller integration is pending."}
                      </p>
                      <dl>
                        <div>
                          <dt>Spiritual damage</dt>
                          <dd>{s.spiritual}</dd>
                        </div>
                        <div>
                          <dt>Agility</dt>
                          <dd>{s.agility}</dd>
                        </div>
                        <div>
                          <dt>Movement potential</dt>
                          <dd>{percent(s.movementMultiplier - 1)}</dd>
                        </div>
                        <div>
                          <dt>Next rank cost</dt>
                          <dd>
                            {number(
                              (p.mount.spiritualRank + 1) *
                                CULTIVATION.spiritualXpPerRank,
                            )}{" "}
                            XP
                          </dd>
                        </div>
                      </dl>
                      {action(
                        "Strengthen spiritual weapon",
                        { type: "spiritual" },
                        p.mount.spiritualRank >= CULTIVATION.spiritualRankCap,
                        "g5-primary g5-wide",
                      )}
                    </Panel>
                    <Panel
                      title="Mount attire"
                      eyebrow="INDEPENDENT VANITY LAYERS"
                    >
                      {slotGrid(VANITY_SLOTS, p.mount.vanity)}
                      <button
                        className="g5-text-button"
                        onClick={() => {
                          setOwner("mount");
                          setTab("vanity");
                        }}
                      >
                        Open vanity atelier <ArrowUpRight size={16} />
                      </button>
                    </Panel>
                  </div>
                </div>
              )}
              {tab === "loadout" && (
                <div className="g5-inventory-layout">
                  <Panel title="Equipped" eyebrow="CHARACTER">
                    {slotGrid(SLOTS, p.equipment)}
                    <div className="g5-ready">
                      {p.weapons.map((id, index) => (
                        <button
                          key={index}
                          disabled={busy || !id}
                          aria-pressed={p.activeWeapon === index}
                          onClick={() =>
                            act({ type: "switchWeapon", slot: index })
                          }
                        >
                          <small>READY {index + 1}</small>
                          {itemName(id)}
                        </button>
                      ))}
                    </div>
                  </Panel>
                  <Panel
                    title="Inventory"
                    eyebrow={`${p.inventory.length} / 80 ITEMS`}
                  >
                    <div className="g5-search">
                      <Search size={16} />
                      <input
                        aria-label="Search inventory"
                        placeholder="Search your equipment"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </div>
                    <label className="g5-filter">
                      Show
                      <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                      >
                        {[
                          ...new Set([
                            "all",
                            "rare",
                            "elite",
                            "chosen",
                            "mount",
                            "vanity",
                            ...SLOTS,
                            ...MOUNT_SLOTS,
                            ...VANITY_SLOTS,
                          ]),
                        ].map((f) => (
                          <option key={f} value={f}>
                            {label(f)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="g5-bag">
                      {p.inventory
                        .filter(
                          (i) =>
                            (filter === "all" ||
                              i.set === filter ||
                              i.owner === filter ||
                              i.kind === filter ||
                              i.slot === filter) &&
                            i.name.toLowerCase().includes(query.toLowerCase()),
                        )
                        .map((i) => (
                          <button
                            key={i.id}
                            className={selectedId === i.id ? "selected" : ""}
                            style={{ "--rarity": RARITIES[i.rarity].color }}
                            onClick={() => setSelectedId(i.id)}
                            aria-pressed={selectedId === i.id}
                          >
                            <span>
                              <Gem size={22} />
                              {i.locked && <Lock size={11} />}
                            </span>
                            <strong>{i.name}</strong>
                            <small>
                              {i.kind === "vanity"
                                ? `${label(i.owner)} vanity`
                                : `${i.enchant}% · Stage ${i.stage}`}
                            </small>
                            {isEquipped(p, i.id) && (
                              <Check size={12} className="g5-equipped" />
                            )}
                          </button>
                        ))}
                    </div>
                    {!p.inventory.some(
                      (i) =>
                        (filter === "all" ||
                          i.set === filter ||
                          i.owner === filter ||
                          i.kind === filter ||
                          i.slot === filter) &&
                        i.name.toLowerCase().includes(query.toLowerCase()),
                    ) && (
                      <p>No matching items. Try another search or filter.</p>
                    )}
                  </Panel>
                  <Panel
                    title={item?.name || "Select an item"}
                    eyebrow={
                      item
                        ? `${RARITIES[item.rarity].label} / ${label(item.owner)}`
                        : "INSPECT"
                    }
                  >
                    {item && (
                      <>
                        <div className="g5-item-heading">
                          <Gem
                            size={38}
                            style={{ color: RARITIES[item.rarity].color }}
                          />
                          <span>
                            {item.kind === "equipment"
                              ? `${item.enchant}%`
                              : "Vanity"}
                            <small>
                              {item.kind === "equipment"
                                ? OVERCHARGE[tierFor(item)].label
                                : `${item.augments.length}/3 augments`}
                            </small>
                          </span>
                        </div>
                        <dl>
                          {Object.entries(itemStats(item)).map(([k, v]) => (
                            <div key={k}>
                              <dt>{label(k)}</dt>
                              <dd>+{number(v)}</dd>
                            </div>
                          ))}
                        </dl>
                        {item.slot === "weapon" && (
                          <label className="g5-filter">
                            Ready slot
                            <select
                              value={ready}
                              onChange={(e) => setReady(Number(e.target.value))}
                            >
                              {[0, 1, 2].map((n) => (
                                <option key={n} value={n}>
                                  {n + 1}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}
                        <div className="g5-actions">
                          {action(
                            isEquipped(p, item.id) ? "Unequip" : "Equip",
                            {
                              type: isEquipped(p, item.id)
                                ? "unequip"
                                : "equip",
                              itemId: item.id,
                              ...(!isEquipped(p, item.id) &&
                              item.slot === "weapon"
                                ? { ready }
                                : {}),
                            },
                            false,
                            "g5-primary",
                          )}
                          {action(item.locked ? "Unlock" : "Lock", {
                            type: "lock",
                            itemId: item.id,
                            locked: !item.locked,
                          })}
                        </div>
                        {item.kind === "equipment" && (
                          <>
                            <div className="g5-divider" />
                            <h3>Forge & overcharge</h3>
                            <div className="g5-tier-path">
                              {Object.entries(OVERCHARGE).map(([id, t]) => (
                                <span
                                  key={id}
                                  className={
                                    id === tierFor(item) ? "active" : ""
                                  }
                                >
                                  {t.cap}%<small>{t.label}</small>
                                </span>
                              ))}
                            </div>
                            <label className="g5-filter">
                              Enchant stone
                              <select
                                value={stone}
                                onChange={(e) => setStone(e.target.value)}
                              >
                                {[3, 6, 9, 12, 15].map((n) => (
                                  <option key={n} value={`enchant-${n}`}>
                                    +{n}% · {p.materials[`enchant-${n}`] || 0}{" "}
                                    owned
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="g5-filter">
                              Protection
                              <select
                                value={protection}
                                onChange={(e) => setProtection(e.target.value)}
                              >
                                <option value="">
                                  None — destruction risk
                                </option>
                                <option value="protection">
                                  Protection · {p.materials.protection || 0}
                                </option>
                                <option value="celestialProtection">
                                  Celestial ·{" "}
                                  {p.materials.celestialProtection || 0}
                                </option>
                              </select>
                            </label>
                            <p className="g5-footnote">
                              Success:{" "}
                              {percent(
                                enchantChance(
                                  Math.min(
                                    OVERCHARGE[tierFor(item)].cap,
                                    item.enchant + MATERIALS[stone].percent,
                                  ),
                                ),
                              )}
                              . Protection required from 90%; celestial
                              protection from 160%. Wings also consume a
                              talisman.
                            </p>
                            <button
                              disabled={
                                busy ||
                                item.locked ||
                                item.enchant >= OVERCHARGE[tierFor(item)].cap
                              }
                              className="g5-primary g5-wide"
                              onClick={() =>
                                ask(
                                  "Enchant this item?",
                                  `Consumes one ${MATERIALS[stone].name}, applicable protection, and silver. Failure may destroy unprotected equipment above 54%.`,
                                  {
                                    type: "enchant",
                                    itemId: item.id,
                                    material: stone,
                                    ...(protection ? { protection } : {}),
                                  },
                                )
                              }
                            >
                              Attempt enchantment
                            </button>
                            {OVERCHARGE[tierFor(item)].next && (
                              <button
                                disabled={
                                  busy ||
                                  item.locked ||
                                  item.enchant !== OVERCHARGE[tierFor(item)].cap
                                }
                                className="g5-wide"
                                onClick={() =>
                                  ask(
                                    "Unlock overcharge?",
                                    `Costs ${number(OVERCHARGE[tierFor(item)].silver)} silver and ${OVERCHARGE[tierFor(item)].cp} CP. This unlocks the next ceiling; it does not add enchantment.`,
                                    { type: "overcharge", itemId: item.id },
                                  )
                                }
                              >
                                Unlock{" "}
                                {OVERCHARGE[OVERCHARGE[tierFor(item)].next].cap}
                                % ceiling
                              </button>
                            )}
                            {action(
                              `Refine · Stage ${item.stage + 1} · ${item.stage + 1} jade`,
                              { type: "refine", itemId: item.id },
                              item.locked ||
                                item.stage >= CULTIVATION.refinementCap,
                              "g5-wide",
                            )}
                            <label className="g5-filter">
                              Socket jade
                              <select
                                value={gem}
                                onChange={(e) => setGem(e.target.value)}
                              >
                                {["attackGem", "defenseGem", "healthGem"].map(
                                  (g) => (
                                    <option key={g} value={g}>
                                      {MATERIALS[g].name}
                                    </option>
                                  ),
                                )}
                              </select>
                            </label>
                            {action(
                              `Socket · ${item.sockets.length}/${RARITIES[item.rarity].sockets}`,
                              { type: "socket", itemId: item.id, gem },
                              item.locked ||
                                item.sockets.length >=
                                  RARITIES[item.rarity].sockets,
                              "g5-wide",
                            )}
                          </>
                        )}
                        <button
                          className="g5-danger g5-wide"
                          disabled={
                            busy || item.locked || isEquipped(p, item.id)
                          }
                          onClick={() =>
                            ask(
                              "Salvage equipment?",
                              `${item.name} will be permanently removed from this character and converted into refinement jade.`,
                              { type: "salvage", itemId: item.id },
                            )
                          }
                        >
                          Salvage item
                        </button>
                      </>
                    )}
                  </Panel>
                </div>
              )}
              {tab === "vanity" && (
                <>
                  <div
                    className="g5-segment g5-owner"
                    role="group"
                    aria-label="Vanity owner"
                  >
                    {["character", "mount"].map((value) => (
                      <button
                        key={value}
                        aria-pressed={owner === value}
                        onClick={() => setOwner(value)}
                      >
                        {value === "character"
                          ? "Player vanity"
                          : "Mount vanity"}
                      </button>
                    ))}
                  </div>
                  <div className="g5-columns">
                    <Panel
                      title={
                        owner === "character"
                          ? "Your visual layers"
                          : "Your mount’s visual layers"
                      }
                      eyebrow="FOUR EQUIPPABLE SLOTS"
                    >
                      {slotGrid(
                        VANITY_SLOTS,
                        owner === "character" ? p.vanity : p.mount.vanity,
                      )}
                      <p>
                        Appearance layers remain separate from equipment.
                        Uploaded art can bind to these slots later; this
                        workbench does not generate or replace character assets.
                      </p>
                      <p className="g5-footnote">
                        Player augments apply while equipped. Mount augments
                        apply during absorption at the active sharing
                        percentage.
                      </p>
                    </Panel>
                    <Panel
                      title="Augment library"
                      eyebrow="SILVER CARDS / GOLD SCROLLS"
                    >
                      <p>
                        Silver adds 1–3% attack speed or critical chance. Gold
                        replaces one augment with 4–8% attack or 5–10% skill
                        damage. Three augments per item.
                      </p>
                      {p.inventory
                        .filter((i) => i.kind === "vanity" && i.owner === owner)
                        .map((i) => (
                          <article className="g5-vanity-card" key={i.id}>
                            <header>
                              <Feather size={20} />
                              <h3>{i.name}</h3>
                              {action(
                                isEquipped(p, i.id) ? "Unequip" : "Equip",
                                {
                                  type: isEquipped(p, i.id)
                                    ? "unequip"
                                    : "equip",
                                  itemId: i.id,
                                },
                              )}
                            </header>
                            {i.augments.map((a, index) => (
                              <div className="g5-augment" key={index}>
                                <span>
                                  {label(a.stat)}{" "}
                                  <strong>
                                    +
                                    {a.unit === "ratio"
                                      ? percent(a.value)
                                      : number(a.value)}
                                  </strong>
                                </span>
                                <button
                                  disabled={
                                    busy || i.locked || !p.materials.goldScroll
                                  }
                                  onClick={() =>
                                    ask(
                                      "Replace this augment?",
                                      `Consumes one gold scroll and replaces ${label(a.stat)}. The outcome is random.`,
                                      { type: "reroll", itemId: i.id, index },
                                    )
                                  }
                                >
                                  Reroll
                                </button>
                              </div>
                            ))}
                            {action(
                              <>
                                <Plus size={14} /> Add augment ·{" "}
                                {i.augments.length}/3
                              </>,
                              { type: "augment", itemId: i.id },
                              i.locked ||
                                i.augments.length >= 3 ||
                                !p.materials.silverCard,
                              "g5-wide",
                            )}
                          </article>
                        ))}
                    </Panel>
                  </div>
                </>
              )}
              {tab === "halo" && (
                <div className="g5-columns">
                  <div className="g5-stack">
                    <Panel title="Head halo" eyebrow="ATTRIBUTE CULTIVATION">
                      <div className="g5-rank">
                        <Crown size={35} />
                        <strong>
                          {p.headHalo}
                          <small> / {CULTIVATION.headHaloCap}</small>
                        </strong>
                      </div>
                      <p>
                        Each rank adds one to all four attributes. Current
                        development success rate: 65%. Failure loses one rank
                        unless protected.
                      </p>
                      <div className="g5-actions">
                        <button
                          disabled={
                            busy || p.headHalo >= CULTIVATION.headHaloCap
                          }
                          className="g5-primary"
                          onClick={() =>
                            ask(
                              "Protected halo attempt?",
                              "Costs 100 CP, 1,000,000 silver and one guardian scroll. The scroll prevents rank loss, not failure.",
                              { type: "headHalo", protect: true },
                            )
                          }
                        >
                          Advance with guardian
                        </button>
                        <button
                          disabled={
                            busy || p.headHalo >= CULTIVATION.headHaloCap
                          }
                          onClick={() =>
                            ask(
                              "Unprotected halo attempt?",
                              "Costs 100 CP and 1,000,000 silver. Failure removes one rank.",
                              { type: "headHalo", protect: false },
                            )
                          }
                        >
                          Risk unprotected attempt
                        </button>
                      </div>
                    </Panel>
                    <Panel title="Spiritual wings" eyebrow="WING HALO">
                      <div className="g5-rank">
                        <Feather size={35} />
                        <strong>
                          {p.wingHalo}
                          <small> / {CULTIVATION.wingHaloCap}</small>
                        </strong>
                      </div>
                      <p>
                        Requires equipped wings enchanted to at least 120%. Each
                        rank adds 1% to equipment stats. Your vanity wing layer
                        remains separate.
                      </p>
                      {action(
                        `Advance · ${(p.wingHalo + 1) * 100} CP + ${p.wingHalo + 1} feathers`,
                        { type: "wingHalo" },
                        p.wingHalo >= CULTIVATION.wingHaloCap,
                        "g5-primary",
                      )}
                      <p className="g5-footnote">
                        Wing and halo visual effects will use the future
                        supplied sumi-e assets.
                      </p>
                    </Panel>
                  </div>
                  <Panel
                    title="Attributes"
                    eyebrow={`${p.points} UNASSIGNED POINTS`}
                  >
                    <div className="g5-attributes">
                      {Object.entries(p.attributes).map(([key, value]) => (
                        <div key={key}>
                          <div>
                            <small>{label(key)}</small>
                            <strong>{value}</strong>
                          </div>
                          {action(
                            <>
                              <Plus size={14} /> 1
                            </>,
                            { type: "allocate", stat: key, points: 1 },
                            !p.points,
                          )}
                        </div>
                      ))}
                    </div>
                    <p>
                      Strength supports attack and hit. Vitality supports health
                      and evasion. Agility supports defense, evasion and
                      critical chance. Spirit supports your energy pool and
                      attack.
                    </p>
                    <div className="g5-divider" />
                    <h3>Title {p.title} / 12</h3>
                    {action(
                      `Advance title · ${Math.round(800 + p.title * (9200 / 11))} CP`,
                      { type: "title" },
                      p.title >= 12,
                      "g5-wide",
                    )}
                    <p className="g5-footnote">
                      Refinement and halo caps retain the existing development
                      rules while the dictated stage limits are resolved. This
                      is not final MMO balance.
                    </p>
                  </Panel>
                </div>
              )}
              {tab === "combat" && (
                <div className="g5-columns">
                  <Panel title="Training ground" eyebrow="SANDBOX COMBAT LOGIC">
                    <Meter name="Health" value={p.combat.hp} max={s.maxHp} />
                    <Meter
                      name="Spirit"
                      value={p.combat.spirit}
                      max={s.maxSpirit}
                    />
                    <div className="g5-actions">
                      {["sparring", "patrol", "elite"].map((encounter) =>
                        action(
                          label(encounter),
                          { type: "encounter", encounter },
                          liveEncounter || p.combat.hp <= 0,
                        ),
                      )}
                      {action("Recover", { type: "recover" }, liveEncounter)}
                    </div>
                    {p.encounter && (
                      <div className="g5-targets">
                        <small>
                          {p.encounter.finished
                            ? `ENCOUNTER ${p.encounter.outcome.toUpperCase()}`
                            : "ACTIVE ENCOUNTER"}
                        </small>
                        {p.encounter.targets.map((t) => (
                          <Meter
                            key={t.id}
                            name={t.name}
                            value={t.hp}
                            max={t.maxHp}
                          />
                        ))}
                      </div>
                    )}
                    <div className="g5-skills">
                      {ARCHETYPES[s.archetype].skills.map((id, index) => (
                        <button
                          key={id}
                          disabled={
                            busy ||
                            !liveEncounter ||
                            data.serverTime < (p.combat.cooldowns[id] || 0)
                          }
                          onClick={() => attack(id)}
                        >
                          <kbd>{index + 1}</kbd>
                          <Swords size={22} />
                          <strong>{SKILLS[id].name}</strong>
                          <small>
                            {SKILLS[id].cost} spirit ·{" "}
                            {SKILLS[id].cooldown / 1000}s
                          </small>
                        </button>
                      ))}
                    </div>
                    <div className="g5-actions">
                      {action(
                        p.combat.guardSince !== null
                          ? "Lower guard"
                          : "Raise guard",
                        { type: "guard", active: p.combat.guardSince === null },
                        !liveEncounter,
                      )}
                      {action(
                        "Health tonic",
                        { type: "potion", material: "healthPotion" },
                        !p.materials.healthPotion,
                      )}
                      {action("Retreat", { type: "retreat" }, !liveEncounter)}
                    </div>
                    <p className="g5-footnote">
                      Keys 1–3 activate equipped skills while this panel has
                      focus. World movement, rendering and multiplayer are not
                      simulated by this combat panel.
                    </p>
                  </Panel>
                  <Panel title="Recent actions" eyebrow="COMBAT / PROGRESSION">
                    <ol className="g5-journal">
                      {p.history.slice(0, 12).map((entry, index) => (
                        <li key={`${entry.at}-${index}`}>
                          <small>
                            {new Date(entry.at).toLocaleTimeString()}
                          </small>
                          <p>{entry.message}</p>
                        </li>
                      ))}
                    </ol>
                  </Panel>
                </div>
              )}
              {tab === "supplies" && (
                <div className="g5-columns">
                  <Panel title="Travel supplies" eyebrow="SILVER ONLY">
                    <div className="g5-list">
                      {SHOP.map((i) => (
                        <div key={i.id}>
                          <span>
                            <strong>{MATERIALS[i.id].name}</strong>
                            <small>
                              {p.materials[i.id] || 0} owned · {number(i.price)}{" "}
                              silver
                            </small>
                          </span>
                          {action("Buy one", {
                            type: "buy",
                            itemId: i.id,
                            quantity: 1,
                          })}
                        </div>
                      ))}
                    </div>
                    <p className="g5-footnote">
                      Development economy only. No real-money checkout or cash
                      sale of equipment or CP.
                    </p>
                  </Panel>
                  <div className="g5-stack">
                    <Panel
                      title="Spirit companions"
                      eyebrow={`${p.pets.length} COMPANIONS`}
                    >
                      <div className="g5-list">
                        {p.pets.map((pet) => (
                          <div key={pet.id}>
                            <span>
                              <strong>{label(pet.species)}</strong>
                              <small>
                                Tier {pet.tier + 1} · {pet.growth}% growth
                              </small>
                            </span>
                            {action(
                              p.activePet === pet.id ? "Active" : "Select",
                              { type: "selectPet", petId: pet.id },
                              p.activePet === pet.id,
                            )}
                          </div>
                        ))}
                      </div>
                      {action(
                        "Hatch companion egg",
                        { type: "hatchPet" },
                        !p.materials.petEgg,
                        "g5-wide",
                      )}
                    </Panel>
                    <Panel title="Material pouch" eyebrow="OWNED RESOURCES">
                      <div className="g5-materials">
                        {Object.entries(p.materials)
                          .filter(([, n]) => n > 0)
                          .map(([id, count]) => (
                            <span key={id}>
                              {MATERIALS[id]?.name || id}
                              <strong>{count}</strong>
                            </span>
                          ))}
                      </div>
                    </Panel>
                  </div>
                </div>
              )}
              <footer className="g5-footer">
                <span>
                  <Layers size={13} /> Sumi-e system study · Game 5 only
                </span>
                {mode === "sandbox" && (
                  <button
                    disabled={busy}
                    onClick={() =>
                      ask(
                        "Reset the local workbench?",
                        "Only this browser’s simulated character is reset. Authenticated accounts are unaffected.",
                        { type: "__reset" },
                      )
                    }
                  >
                    Reset sandbox
                  </button>
                )}
              </footer>
            </>
          )}
        </main>
      </div>
      {confirmation && (
        <Confirm
          data={confirmation}
          close={() => setConfirmation(null)}
          confirm={act}
        />
      )}
    </div>
  );
}
