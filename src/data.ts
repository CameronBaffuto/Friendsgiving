import { getFirebaseApp } from './firebase';
import { connectDatabaseEmulator, getDatabase, onValue, ref, runTransaction, serverTimestamp, set } from 'firebase/database';
import type { Dish, DishInput } from './model';

export type Store = {
  listen: (receive: (dishes: Dish[]) => void, fail: () => void) => () => void;
  connection: (receive: (connected: boolean) => void) => () => void;
  save: (id: string, input: DishInput, previous?: Dish) => Promise<void>;
  remove: (dish: Dish) => Promise<void>;
};

export function firebaseStore(token: string): Store | null {
  const env = import.meta.env;
  const app = getFirebaseApp();
  if (!app) return null;
  const db = getDatabase(app);
  if (import.meta.env.DEV && env.VITE_USE_EMULATORS === 'true') connectDatabaseEmulator(db, '127.0.0.1', 9000);
  const base = `events/${token}/entries`;
  return {
    listen(receive, fail) {
      return onValue(ref(db, base), snapshot => {
        const values = snapshot.val() ?? {};
        receive(Object.entries(values).map(([id, value]) => ({ ...(value as Omit<Dish, 'id'>), id })));
      }, fail);
    },
    connection(receive) { return onValue(ref(db, '.info/connected'), snapshot => receive(snapshot.val() === true)); },
    async save(id, input, previous) {
      const target = ref(db, `${base}/${id}`);
      const value = { ...input, updatedAt: serverTimestamp(), revision: crypto.randomUUID() };
      if (!previous) {
        await set(target, { ...value, createdAt: serverTimestamp() });
      } else {
        const result = await runTransaction(target, current => {
          if (!current || current.revision !== previous.revision) return;
          return { ...value, createdAt: current.createdAt };
        }, { applyLocally: false });
        if (!result.committed) throw new Error('Someone changed or removed this dish. Close this form and reopen the latest entry before editing.');
      }
    },
    async remove(dish) {
      const result = await runTransaction(ref(db, `${base}/${dish.id}`), current => {
        if (!current || current.revision !== dish.revision) return;
        return null;
      }, { applyLocally: false });
      if (!result.committed) throw new Error('Someone changed or removed this dish. Close this form and check the latest list.');
    },
  };
}
