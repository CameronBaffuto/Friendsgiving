import { categories } from '../model';
import type { Category, Dish } from '../model';

export function FoodList({ dishes, onAdd, onEdit }: {
  dishes: Dish[]; onAdd: (category: Category) => void; onEdit: (dish: Dish) => void;
}) {
  const ordered = [...dishes].sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
  return <div className="food-list">{categories.map(([id, label]) => {
    const group = ordered.filter(dish => dish.category === id);
    return <section className="food-group" key={id} aria-labelledby={`category-${id}`}>
      <h2 id={`category-${id}`}>{label}</h2>
      {group.length ? <ul>{group.map(dish => <li className="food-row" key={dish.id}>
        <div className="dish-details"><span className="dish-name">{dish.dish}</span>{dish.note ? <span className="dish-note">{dish.note}</span> : null}</div>
        <span className="contributor">{dish.name}</span>
        <button className="edit-button" onClick={() => onEdit(dish)} aria-label={`Edit ${dish.dish} from ${dish.name}`}>Edit</button>
      </li>)}</ul> : <div className="empty-category"><span>Nothing here yet.</span><button className="text-button" onClick={() => onAdd(id)} aria-label={`Add a dish to ${label}`}>Add a dish</button></div>}
    </section>;
  })}</div>;
}
