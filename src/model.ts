export const categories = [
  ['appetizers', 'Appetizers'], ['mains', 'Mains'], ['sides', 'Sides'],
  ['desserts', 'Desserts'], ['drinks', 'Drinks & extras'],
] as const;

export type Category = typeof categories[number][0];
export type DishInput = { name: string; dish: string; category: Category; note: string };
export type Dish = DishInput & { id: string; createdAt: number; updatedAt: number; revision: string };
export const tokenPattern = /^[A-Za-z0-9_-]{32}$/;

export function eventFromHash(hash: string) {
  const token = new URLSearchParams(hash.replace(/^#/, '')).get('event') ?? '';
  return tokenPattern.test(token) ? token : null;
}

export function validateInput(value: DishInput) {
  if (!value.name.trim() || value.name.trim().length > 60) return 'Enter a name (up to 60 characters).';
  if (!value.dish.trim() || value.dish.trim().length > 100) return 'Enter a dish (up to 100 characters).';
  if (!categories.some(([id]) => id === value.category)) return 'Choose a category.';
  if (value.note.length > 300) return 'Keep your note under 300 characters.';
  return null;
}

export function rememberName(name?: string) {
  try {
    if (name !== undefined) localStorage.setItem('friendsgivingmas:name:v1', name);
    return localStorage.getItem('friendsgivingmas:name:v1') ?? '';
  } catch { return ''; }
}
