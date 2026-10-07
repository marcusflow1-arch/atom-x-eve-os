const VAULT_ROOT = 'atom-xe-admin-project-vault';
const PACKAGES_DIR = 'packages';
const MANIFEST_FILE = '.atom-xe-vault.json';

function supported() {
  return Boolean(navigator.storage?.getDirectory);
}

async function readJson(directory, name) {
  const handle = await directory.getFileHandle(name);
  const file = await handle.getFile();
  return JSON.parse(await file.text());
}

async function getPackagesDirectory() {
  if (!supported()) return null;
  const root = await navigator.storage.getDirectory();
  const vault = await root.getDirectoryHandle(VAULT_ROOT);
  return vault.getDirectoryHandle(PACKAGES_DIR);
}

export async function listProjectVaultPackages() {
  try {
    const packagesDirectory = await getPackagesDirectory();
    if (!packagesDirectory) return [];
    const packages = [];
    for await (const [id, handle] of packagesDirectory.entries()) {
      if (handle.kind !== 'directory') continue;
      try {
        const manifest = await readJson(handle, MANIFEST_FILE);
        packages.push({ id, ...manifest });
      } catch {
        // Ignore incomplete or non-vault folders.
      }
    }
    packages.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    return packages;
  } catch {
    return [];
  }
}

async function hasAssetsPak(directory) {
  try {
    for await (const [name, handle] of directory.entries()) {
      if (handle.kind === 'file' && /^assets\d+\.pk3$/i.test(name)) return true;
    }
  } catch {}
  return false;
}

async function findBaseDirectory(directory, path = '', depth = 0) {
  if (depth > 5) return null;
  if (path.toLowerCase().endsWith('/base') || path.toLowerCase() === 'base') {
    if (await hasAssetsPak(directory)) return { directory, path };
  }

  for await (const [name, handle] of directory.entries()) {
    if (handle.kind !== 'directory') continue;
    const childPath = path ? `${path}/${name}` : name;
    const lower = childPath.toLowerCase();
    const likely = depth < 2 || lower.includes('gamedata') || lower.endsWith('/base') || lower === 'base';
    if (!likely) continue;
    const found = await findBaseDirectory(handle, childPath, depth + 1);
    if (found) return found;
  }
  return null;
}

async function collectFiles(directory, prefix = '', output = []) {
  for await (const [name, handle] of directory.entries()) {
    const path = prefix ? `${prefix}/${name}` : name;
    if (handle.kind === 'directory') {
      await collectFiles(handle, path, output);
    } else {
      const file = await handle.getFile();
      output.push({ file, path });
    }
  }
  return output;
}

export async function getProjectVaultGameFiles(packageId) {
  const packagesDirectory = await getPackagesDirectory();
  if (!packagesDirectory) throw new Error('Project Vault is unavailable in this browser.');

  const packageDirectory = await packagesDirectory.getDirectoryHandle(packageId);
  const dataDirectory = await packageDirectory.getDirectoryHandle('data');
  const found = await findBaseDirectory(dataDirectory);

  if (found) {
    return collectFiles(found.directory);
  }

  // An extracted GameData/base folder may have been imported directly, leaving
  // assets and content roots at the package root. Let the validator decide
  // whether that root is complete.
  return collectFiles(dataDirectory);
}
