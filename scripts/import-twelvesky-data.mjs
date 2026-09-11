import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '..');
const serverRoot = path.join(repoRoot, 'third_party', 'twelvesky2-fenrir-server');
const seedRoot = path.join(serverRoot, 'Database', 'Migrations', 'Seed', 'world');
const outputRoot = path.join(repoRoot, 'public', 'twelvesky-data');

const SOURCES = {
  levels: '001_levels.sql',
  skills: '002_skills.sql',
  skillDescriptions: '003_skill_descriptions.sql',
  skillGrades: '004_skill_grades.sql',
  items: '005_items.sql',
  itemBonusSkills: '006_item_bonus_skills.sql',
  zones: '007_zones.sql',
  starterSkills: '010_starter_kit_skills.sql',
  starterHotkeys: '011_starter_kit_hotkeys.sql',
  tribeSkillEquivalences: '012_tribe_skill_equivalences.sql',
  tribeItemEquivalences: '013_tribe_item_equivalences.sql',
  tribeCostumeEquivalences: '014_tribe_costume_equivalences.sql',
  monsters: '015_monsters.sql',
  npcs: '016_npcs.sql',
  zoneNpcSpawns: '017_zone_npc_spawns.sql',
  zonePortals: '018_zone_portals.sql',
  zoneSpawnPoints: '019_zone_spawn_points.sql',
  monsterSpawnRegions: '020_monster_spawn_regions.sql',
  gemSockets: '021_gem_sockets.sql',
  quests: '022_quests.sql',
  questRewards: '023_quest_rewards.sql',
  questSpeeches: '024_quest_speeches.sql',
  bloodExchange: '026_blood_exchange_catalog.sql',
};

function assertSourceTree() {
  if (!fs.existsSync(seedRoot)) {
    throw new Error(
      `Fenrir seed data not found at ${seedRoot}. Clone with submodules first: git submodule update --init --recursive`,
    );
  }
}

function splitTopLevel(input, delimiter = ',') {
  const out = [];
  let start = 0;
  let depth = 0;
  let inString = false;
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (ch === "'") {
      if (inString && input[i + 1] === "'") {
        i += 1;
        continue;
      }
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === '(') depth += 1;
    else if (ch === ')') depth -= 1;
    else if (ch === delimiter && depth === 0) {
      out.push(input.slice(start, i).trim());
      start = i + 1;
    }
  }
  out.push(input.slice(start).trim());
  return out;
}

function extractTuples(valuesText) {
  const tuples = [];
  let depth = 0;
  let inString = false;
  let start = -1;
  for (let i = 0; i < valuesText.length; i += 1) {
    const ch = valuesText[i];
    if (ch === "'") {
      if (inString && valuesText[i + 1] === "'") {
        i += 1;
        continue;
      }
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === '(') {
      if (depth === 0) start = i + 1;
      depth += 1;
    } else if (ch === ')') {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        tuples.push(valuesText.slice(start, i));
        start = -1;
      }
    }
  }
  return tuples;
}

function decodeSqlValue(raw) {
  const value = raw.trim();
  if (!value || /^NULL$/i.test(value)) return null;
  if (/^(N)?'.*'$/s.test(value)) {
    const firstQuote = value.indexOf("'");
    const body = value.slice(firstQuote + 1, -1);
    return body.replace(/''/g, "'");
  }
  if (/^-?\d+$/.test(value)) return Number.parseInt(value, 10);
  if (/^-?(?:\d+\.\d*|\d*\.\d+)$/.test(value)) return Number.parseFloat(value);
  if (/^(true|false)$/i.test(value)) return value.toLowerCase() === 'true';
  return value;
}

function parseSeed(sql, filename) {
  const insertMatch = sql.match(/INSERT\s+INTO\s+([\w.]+)\s*\(([^)]*)\)\s*VALUES\s*/i);
  if (!insertMatch) throw new Error(`No INSERT ... VALUES block found in ${filename}`);

  const columns = insertMatch[2].split(',').map((x) => x.trim()).filter(Boolean);
  const valuesStart = insertMatch.index + insertMatch[0].length;
  let inString = false;
  let end = sql.length;
  for (let i = valuesStart; i < sql.length; i += 1) {
    const ch = sql[i];
    if (ch === "'") {
      if (inString && sql[i + 1] === "'") {
        i += 1;
        continue;
      }
      inString = !inString;
    } else if (ch === ';' && !inString) {
      end = i;
      break;
    }
  }

  const rows = extractTuples(sql.slice(valuesStart, end)).map((tuple, rowIndex) => {
    const values = splitTopLevel(tuple).map(decodeSqlValue);
    if (values.length !== columns.length) {
      throw new Error(
        `${filename}: row ${rowIndex + 1} has ${values.length} values for ${columns.length} columns`,
      );
    }
    return Object.fromEntries(columns.map((column, index) => [column, values[index]]));
  });

  return {
    table: insertMatch[1],
    columns,
    rows,
  };
}

function writeJson(name, value) {
  fs.writeFileSync(path.join(outputRoot, `${name}.json`), `${JSON.stringify(value)}\n`, 'utf8');
}

assertSourceTree();
fs.mkdirSync(outputRoot, { recursive: true });

const selected = process.argv.includes('--core')
  ? ['levels', 'skills', 'skillDescriptions', 'skillGrades', 'zones', 'monsters', 'quests', 'questRewards']
  : Object.keys(SOURCES);

const catalog = {
  source: 'TwelveSky-Fenrir/Server',
  sourcePath: 'third_party/twelvesky2-fenrir-server',
  generatedAt: new Date().toISOString(),
  format: 1,
  tables: {},
};

for (const name of selected) {
  const filename = SOURCES[name];
  const fullPath = path.join(seedRoot, filename);
  if (!fs.existsSync(fullPath)) {
    console.warn(`[twelvesky] skipping missing ${filename}`);
    continue;
  }
  const parsed = parseSeed(fs.readFileSync(fullPath, 'utf8'), filename);
  writeJson(name, parsed.rows);
  catalog.tables[name] = {
    file: `${name}.json`,
    source: filename,
    table: parsed.table,
    rows: parsed.rows.length,
    columns: parsed.columns,
  };
  console.log(`[twelvesky] ${name}: ${parsed.rows.length.toLocaleString()} rows`);
}

writeJson('catalog', catalog);
console.log(`[twelvesky] wrote ${Object.keys(catalog.tables).length} tables to ${outputRoot}`);
