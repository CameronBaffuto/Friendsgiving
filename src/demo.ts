import type { Store } from './data';
import type { Dish } from './model';

// Explicit local development preview only; never used for a guest's live signup.
export function demoStore(): Store {
  let dishes: Dish[] = [
    { id: '1', name: 'Cam', dish: 'Roast turkey', category: 'mains', note: '' },
    { id: '2', name: 'Alex', dish: 'Mashed potatoes', category: 'sides', note: 'Enough for 10' },
    { id: '3', name: 'Jordan', dish: 'Green bean casserole', category: 'sides', note: '' },
    { id: '4', name: 'Sam', dish: 'Apple pie', category: 'desserts', note: '' },
  ].map((dish, index) => ({ ...dish, category: dish.category as Dish['category'], createdAt: index, updatedAt: index, revision: String(index) }));
  const listeners = new Set<(dishes: Dish[]) => void>();
  const notify = () => listeners.forEach(listener => listener([...dishes]));
  return {
    listen(receive) { listeners.add(receive); receive([...dishes]); return () => { listeners.delete(receive); }; },
    connection(receive) { receive(true); return () => {}; },
    async save(id, input, previous) {
      dishes = [...dishes.filter(dish => dish.id !== id), { ...input, id, createdAt: previous?.createdAt ?? Date.now(), updatedAt: Date.now(), revision: crypto.randomUUID() }]; notify();
    },
    async remove(dish) { dishes = dishes.filter(item => item.id !== dish.id); notify(); },
  };
}
