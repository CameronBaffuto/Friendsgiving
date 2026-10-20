import { after, before, beforeEach, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { ref, set, get, remove, update, serverTimestamp } from 'firebase/database';

let env;
const token = 'a'.repeat(32);
const path = `events/${token}/entries`;
const dish = (overrides = {}) => ({ name: 'Cam', dish: 'Turkey', category: 'mains', note: '', createdAt: serverTimestamp(), updatedAt: serverTimestamp(), revision: randomUUID(), ...overrides });
before(async () => { env = await initializeTestEnvironment({ projectId: 'demo-friendsgivingmas', database: { host: '127.0.0.1', port: 9000, rules: await readFile('database.rules.json', 'utf8') } }); });
beforeEach(async () => { await env.clearDatabase(); await env.withSecurityRulesDisabled(async context => { await set(ref(context.database(), `access/${token}`), true); }); });
after(async () => { await env?.cleanup(); });

test('link holders can read, add, edit, and remove entries without login', async () => {
  const db = env.unauthenticatedContext().database();
  await assertSucceeds(get(ref(db, path)));
  await assertSucceeds(set(ref(db, `${path}/one`), dish()));
  await assertSucceeds(update(ref(db, `${path}/one`), { dish: 'Roast turkey', updatedAt: serverTimestamp(), revision: randomUUID() }));
  await assertSucceeds(remove(ref(db, `${path}/one`)));
});
test('root, access list, event list and other events cannot be read', async () => {
  const db = env.unauthenticatedContext().database();
  await assertFails(get(ref(db)));
  for (const target of ['access', `access/${token}`, 'events', `events/${token}`, `events/${'b'.repeat(32)}/entries`]) await assertFails(get(ref(db, target)));
});
test('link holders cannot grant access or replace the whole list', async () => {
  const db = env.unauthenticatedContext().database();
  await assertFails(set(ref(db, 'access/new-event'), true));
  await assertFails(set(ref(db, path), { one: dish() }));
  await assertFails(remove(ref(db, `events/${token}`)));
});
test('unknown and revoked links cannot read or write', async () => {
  const db = env.unauthenticatedContext().database();
  await assertFails(set(ref(db, `events/${'b'.repeat(32)}/entries/one`), dish()));
  await env.withSecurityRulesDisabled(async context => { await set(ref(context.database(), `access/${token}`), false); });
  await assertFails(get(ref(db, path)));
  await assertFails(set(ref(db, `${path}/one`), dish()));
});
test('invalid, oversized and extra fields are rejected', async () => {
  const db = env.unauthenticatedContext().database();
  for (const overrides of [{ name: ' ' }, { dish: '' }, { name: 'x'.repeat(61) }, { dish: 'x'.repeat(101) }, { note: 'x'.repeat(301) }, { category: 'other' }, { surprise: true }, { updatedAt: 1 }]) await assertFails(set(ref(db, `${path}/one`), dish(overrides)));
  await assertFails(set(ref(db, `${path}/one`), { name: 'Cam', dish: 'Turkey' }));
});
test('createdAt cannot be rewritten on an existing dish', async () => {
  const db = env.unauthenticatedContext().database();
  await assertSucceeds(set(ref(db, `${path}/one`), dish()));
  await assertFails(update(ref(db, `${path}/one`), { createdAt: 1, updatedAt: serverTimestamp() }));
});
