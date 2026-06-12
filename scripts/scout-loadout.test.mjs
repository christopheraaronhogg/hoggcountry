import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

// workspace-store resolves SCOUT_WORKSPACE_DATA_DIR at call time (workspaceRoot()
// runs on every read/write), but we still set it before importing the store so no
// other resolution path can ever win.
const dataDir = mkdtempSync(join(tmpdir(), 'scout-loadout-'));
process.env.SCOUT_WORKSPACE_DATA_DIR = dataDir;

// workspace-store imports `$lib/...` (SvelteKit alias). Map it onto the source
// tree for plain-node test runs.
const libRoot = new URL('../apps/openclaw-web/src/lib/', import.meta.url);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('$lib/')) {
      return nextResolve(new URL(`${specifier.slice('$lib/'.length)}.ts`, libRoot).href, context);
    }
    return nextResolve(specifier, context);
  }
});

const { computeLoadoutSummary, formatOz, sanitizeLoadoutLink } = await import('../apps/openclaw-web/src/lib/loadout.ts');
const {
  addWorkspaceLoadoutItem,
  getWorkspace,
  removeWorkspaceLoadoutItem,
  replaceWorkspaceLoadout,
  updateWorkspaceLoadoutItem
} = await import('../apps/openclaw-web/src/lib/server/workspace-store.ts');

const betaProfile = {
  email: 'loadout-test@hoggcountry.local',
  name: 'Loadout Tester',
  trailName: 'Tester'
};

test('computeLoadoutSummary buckets base, worn, and consumable weight', () => {
  const summary = computeLoadoutSummary([
    { weightOz: 10, quantity: 2, worn: false, consumable: false },
    { weightOz: 5, quantity: 1, worn: true, consumable: false },
    { weightOz: 3, quantity: 3, worn: false, consumable: true }
  ]);

  assert.deepEqual(summary, {
    baseWeightOz: 20,
    wornWeightOz: 5,
    consumableWeightOz: 9,
    totalWeightOz: 29,
    itemCount: 6
  });
});

test('computeLoadoutSummary excludes worn weight from the carried total', () => {
  const summary = computeLoadoutSummary([
    { weightOz: 16, quantity: 1, worn: true, consumable: false }
  ]);

  assert.equal(summary.wornWeightOz, 16);
  assert.equal(summary.totalWeightOz, 0);
});

test('computeLoadoutSummary tolerates non-finite weights and quantities', () => {
  const summary = computeLoadoutSummary([
    { weightOz: Number.NaN, quantity: 1, worn: false, consumable: false },
    { weightOz: 4, quantity: Number.POSITIVE_INFINITY, worn: false, consumable: false },
    { weightOz: -3, quantity: 2, worn: false, consumable: false }
  ]);

  assert.equal(summary.baseWeightOz, 0);
  assert.equal(summary.totalWeightOz, 0);
});

test('formatOz switches from ounces to pounds at 16 oz', () => {
  assert.equal(formatOz(0), '0.0 oz');
  assert.equal(formatOz(12.5), '12.5 oz');
  assert.equal(formatOz(15.9), '15.9 oz');
  assert.equal(formatOz(16), '1 lb');
  assert.equal(formatOz(20.5), '1 lb 4.5 oz');
  assert.equal(formatOz(31.99), '2 lb');
  assert.equal(formatOz(15.96), '1 lb');
  assert.equal(formatOz(15.94), '15.9 oz');
});

test('sanitizeLoadoutLink only lets http(s) URLs through', () => {
  assert.equal(sanitizeLoadoutLink('https://example.com/gear'), 'https://example.com/gear');
  assert.equal(sanitizeLoadoutLink('http://example.com'), 'http://example.com');
  assert.equal(sanitizeLoadoutLink('javascript:alert(1)'), null);
  assert.equal(sanitizeLoadoutLink('data:text/html,<script>1</script>'), null);
  assert.equal(sanitizeLoadoutLink('not a url'), null);
  assert.equal(sanitizeLoadoutLink(''), null);
  assert.equal(sanitizeLoadoutLink(null), null);
});

test('normalizeLoadout tolerates garbage records on read', async () => {
  const workspaceId = 'loadout-garbage';
  writeFileSync(
    join(dataDir, `${workspaceId}.json`),
    JSON.stringify({
      workspaceId,
      betaProfile,
      loadout: [
        'not-an-object',
        42,
        { category: 'shelter' },
        { name: '   ' },
        {
          name: '  Mystery Box  ',
          category: 'time-machine',
          weightOz: 'abc',
          quantity: 0,
          worn: 'yes',
          notes: 7,
          link: '   '
        },
        {
          name: 'Tent',
          category: 'shelter',
          weightOz: '36.8',
          quantity: 2.9,
          worn: false,
          consumable: false,
          notes: ' Body + fly ',
          link: ' https://example.com/tent '
        }
      ]
    })
  );

  const workspace = await getWorkspace(workspaceId, betaProfile);

  assert.equal(workspace.loadout.length, 2);

  const tent = workspace.loadout.find((item) => item.name === 'Tent');
  assert.ok(tent);
  assert.equal(tent.category, 'shelter');
  assert.equal(tent.weightOz, 36.8);
  assert.equal(tent.quantity, 2);
  assert.equal(tent.notes, 'Body + fly');
  assert.equal(tent.link, 'https://example.com/tent');

  const mystery = workspace.loadout.find((item) => item.name === 'Mystery Box');
  assert.ok(mystery);
  assert.equal(mystery.category, 'other');
  assert.equal(mystery.weightOz, 0);
  assert.equal(mystery.quantity, 1);
  assert.equal(mystery.worn, true);
  assert.equal(mystery.notes, '');
  assert.equal(mystery.link, null);
});

test('loadout mutators add, update, and remove items in a temp workspace', async () => {
  const workspaceId = 'loadout-mutators';

  const afterAdd = await addWorkspaceLoadoutItem(workspaceId, betaProfile, {
    name: '  Durston 1+ Tent  ',
    category: 'shelter',
    weightOz: 36.8,
    quantity: 1,
    worn: false,
    consumable: false,
    notes: '',
    link: null
  });

  assert.equal(afterAdd.loadout.length, 1);
  const added = afterAdd.loadout[0];
  assert.equal(added.name, 'Durston 1+ Tent');
  assert.match(added.id, /^loadout/u);
  assert.equal(added.createdAt, added.updatedAt);

  await assert.rejects(
    addWorkspaceLoadoutItem(workspaceId, betaProfile, {
      name: '   ',
      category: 'other',
      weightOz: 0,
      quantity: 1,
      worn: false,
      consumable: false,
      notes: '',
      link: null
    }),
    /name is required/u
  );

  const afterUpdate = await updateWorkspaceLoadoutItem(workspaceId, betaProfile, added.id, {
    weightOz: 30.2,
    notes: 'Swapped to lighter stakes'
  });
  const updated = afterUpdate.loadout.find((item) => item.id === added.id);
  assert.ok(updated);
  assert.equal(updated.weightOz, 30.2);
  assert.equal(updated.notes, 'Swapped to lighter stakes');
  assert.equal(updated.name, 'Durston 1+ Tent');

  await assert.rejects(
    updateWorkspaceLoadoutItem(workspaceId, betaProfile, 'missing-item', { weightOz: 1 }),
    /Loadout item not found\./u
  );

  const afterRemove = await removeWorkspaceLoadoutItem(workspaceId, betaProfile, added.id);
  assert.equal(afterRemove.loadout.length, 0);
});

test('replaceWorkspaceLoadout swaps the whole bag and sorts by category then name', async () => {
  const workspaceId = 'loadout-replace';

  const item = (name, category, weightOz, extra = {}) => ({
    name,
    category,
    weightOz,
    quantity: 1,
    worn: false,
    consumable: false,
    notes: '',
    link: null,
    ...extra
  });

  const workspace = await replaceWorkspaceLoadout(workspaceId, betaProfile, [
    item('Water Filter', 'water', 2),
    item('Osprey Atmos', 'pack', 67),
    item('Trail Mix', 'other', 12, { consumable: true }),
    item('Buff', 'worn', 2.3, { worn: true }),
    item('Anker Battery', 'electronics', 23.5)
  ]);

  assert.deepEqual(
    workspace.loadout.map((entry) => entry.name),
    ['Osprey Atmos', 'Anker Battery', 'Buff', 'Water Filter', 'Trail Mix']
  );

  const summary = computeLoadoutSummary(workspace.loadout);
  assert.equal(summary.baseWeightOz, 92.5);
  assert.equal(summary.wornWeightOz, 2.3);
  assert.equal(summary.consumableWeightOz, 12);
  assert.equal(summary.totalWeightOz, 104.5);
  assert.equal(summary.itemCount, 5);
});
