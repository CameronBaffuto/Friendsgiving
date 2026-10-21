import { categories } from '../model';
import type { Category, Dish } from '../model';
import { categoryArt, Chevron, Illustration } from './Illustration';
export function FoodList({ dishes, onAdd, onOpen }: {
    dishes: Dish[];
    onAdd: (category: Category) => void;
    onOpen: (dish: Dish) => void;
}) {
    const ordered = [...dishes].sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
    return <div className="food-list">{categories.map(([id, label]) => {
            const group = ordered.filter(dish => dish.category === id);
            return <section className="food-group" key={id} aria-labelledby={`menu-category-${id}`}>
      <button type="button" className="category-illustration" onClick={() => onAdd(id)} aria-label={`Add something to ${label}`} title={`Add something to ${label}`}><Illustration name={categoryArt[id]} className={`category-art art-${id}`} loading="lazy"/></button>
      <div className="category-menu"><div className="category-heading"><h3 id={`menu-category-${id}`}>{label}</h3><span className="ink-line"/><span className="category-count">{group.length} {group.length === 1 ? 'dish' : 'dishes'}</span></div>
      {group.length ? <ul>{group.map(dish => <li key={dish.id}><button className="food-row" onClick={() => onOpen(dish)} aria-label={`${dish.dish}, brought by ${dish.name}. View details`}><span className="dish-name">{dish.dish}</span><span className="contributor">{dish.name}</span><Chevron /></button></li>)}</ul> : <p className="empty-category">A little room for something delicious.</p>}</div>
    </section>;
        })}</div>;
}
