import type { Store } from './data';
import { validateInput } from './model';
import type { Dish } from './model';
// Explicit development sandbox. This key never contains the live event menu.
const key = 'friendsgivingmas:demo:v3';
export function demoStore(): Store {
    function read(fallback: Dish[] = []): Dish[] {
        try {
            const stored = localStorage.getItem(key);
            if (stored === null) return [];
            const value: unknown = JSON.parse(stored);
            if (Array.isArray(value) && value.every(d => typeof d === 'object' && d && !validateInput(d) && typeof d.id === 'string' && typeof d.revision === 'string' && typeof d.createdAt === 'number'))
                return value;
        }
        catch { /* Storage may be unavailable. */ }
        return fallback;
    }
    let dishes = read();
    const listeners = new Set<(dishes: Dish[]) => void>();
    const notify = () => listeners.forEach(listener => listener([...dishes]));
    function persist(next: Dish[]) { try {
        localStorage.setItem(key, JSON.stringify(next));
    }
    catch { /* In-memory demo still works. */ } dishes = next; notify(); }
    function check(previous: Dish) { if (dishes.find(d => d.id === previous.id)?.revision !== previous.revision)
        throw new Error('Someone changed or removed this dish. Reopen the latest version before editing.'); }
    const sync = (event: StorageEvent) => { if (event.key === key) {
        dishes = read();
        notify();
    } };
    return {
        listen(receive) { if (!listeners.size)
            window.addEventListener('storage', sync); listeners.add(receive); receive([...dishes]); return () => { listeners.delete(receive); if (!listeners.size)
            window.removeEventListener('storage', sync); }; },
        connection(receive) { receive(true); return () => { }; },
        async save(id, input, previous) {
            dishes = read(dishes);
            if (previous)
                check(previous);
            persist([...dishes.filter(dish => dish.id !== id), { ...input, id, createdAt: previous?.createdAt ?? Date.now(), updatedAt: Date.now(), revision: crypto.randomUUID() }]);
        },
        async remove(dish) { dishes = read(dishes); check(dish); persist(dishes.filter(item => item.id !== dish.id)); },
    };
}
