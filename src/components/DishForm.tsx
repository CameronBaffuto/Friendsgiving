import { useEffect, useRef, useState } from 'react';
import { categories, rememberName, validateInput } from '../model';
import type { Category, Dish, DishInput } from '../model';
import type { Store } from '../data';
import { Sheet } from './Sheet';
import { categoryArt, Illustration } from './Illustration';
const normalize = (value: string) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
export function DishForm({ store, dish, dishes, connected, onClose, onSaved, onLatest }: {
    store: Store;
    dish?: Dish;
    dishes: Dish[];
    connected: boolean;
    onClose: () => void;
    onSaved: (dish: Dish, editing: boolean) => void;
    onLatest: (id: string) => void;
}) {
    const [id] = useState(() => dish?.id ?? crypto.randomUUID());
    const [input, setInput] = useState(() => ({ name: dish?.name ?? rememberName(), dish: dish?.dish ?? '', category: dish?.category ?? '' as Category | '', note: dish?.note ?? '' }));
    const [busy, setBusy] = useState(false);
    const [slow, setSlow] = useState(false);
    const [error, setError] = useState('');
    const pending = useRef(false);
    const similar = input.dish.trim() ? dishes.find(item => item.id !== id && normalize(item.dish) === normalize(input.dish)) : undefined;
    useEffect(() => {
        if (!busy)
            return;
        const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
        window.addEventListener('beforeunload', warn);
        const timer = window.setTimeout(() => setSlow(true), 7000);
        return () => { clearTimeout(timer); window.removeEventListener('beforeunload', warn); };
    }, [busy]);
    function field(key: keyof DishInput, value: string) { setInput(previous => ({ ...previous, [key]: value })); setError(''); }
    async function commit() {
        if (pending.current)
            return;
        if (!connected) {
            setError('You’re offline. Your changes are still here; reconnect, then save.');
            return;
        }
        if (!input.category) {
            setError('Choose a category for your dish.');
            document.getElementById('category-mains')?.focus();
            return;
        }
        const cleaned: DishInput = { ...input, category: input.category, name: input.name.trim(), dish: input.dish.trim(), note: input.note.trim() };
        const validation = validateInput(cleaned);
        if (validation) {
            setError(validation);
            return;
        }
        pending.current = true;
        setBusy(true);
        setSlow(false);
        setError('');
        try {
            await store.save(id, cleaned, dish);
            rememberName(cleaned.name);
            onSaved({ ...cleaned, id, createdAt: dish?.createdAt ?? Date.now(), updatedAt: Date.now(), revision: dish?.revision ?? '' }, !!dish);
        }
        catch (cause) {
            const message = cause instanceof Error ? cause.message : '';
            setError(message.startsWith('Someone') ? message : 'That didn’t save. Your changes are still here. Check your connection and try again.');
        }
        finally {
            pending.current = false;
            setBusy(false);
        }
    }
    return <Sheet titleId="form-heading" busy={busy} onClose={onClose}>
    <header className="sheet-heading"><Illustration name="rosemary"/><h2 id="form-heading">{dish ? 'Edit your dish' : 'Add your dish'}</h2><p>Tell us what you’re bringing</p></header>
    <form onSubmit={event => { event.preventDefault(); void commit(); }}>
      <div className="form-content"><fieldset className="input-fields" disabled={busy}>
        <label htmlFor="guest-name">Your name</label><input id="guest-name" autoFocus name="name" autoComplete="given-name" required maxLength={60} value={input.name} onChange={e => field('name', e.target.value)} placeholder="e.g. Alex"/>
        <label htmlFor="dish-name">What are you bringing?</label><input id="dish-name" name="dish" required maxLength={100} value={input.dish} onChange={e => field('dish', e.target.value)} placeholder="e.g. Sweet potato casserole"/>
        <fieldset className="category-fieldset"><legend>Category <span className="sr-only">(required)</span></legend><div className="category-options">{categories.map(([value, label]) => <label className={`category-option ${input.category === value ? 'selected' : ''}`} key={value}>
          <input id={`category-${value}`} type="radio" name="category" value={value} checked={input.category === value} onChange={() => field('category', value)} required/><Illustration name={categoryArt[value]}/><span>{label}</span>
        </label>)}</div></fieldset>
        <label htmlFor="dish-note">Notes <span className="optional">(optional)</span></label><textarea id="dish-note" name="note" maxLength={300} rows={3} value={input.note} onChange={e => field('note', e.target.value)} placeholder="e.g. Vegetarian, gluten-free, needs a little oven space…"/>
      </fieldset>
      {similar ? <p className="similar-warning" role="status">A delicious coincidence! {similar.name} is also bringing {similar.dish}. You can still add yours.</p> : null}
      {error ? <div className="form-error" role="alert"><p>{error}</p>{error.startsWith('Someone') && dish ? <button type="button" className="text-button" onClick={() => onLatest(dish.id)}>Reopen the latest version</button> : null}</div> : null}
      {!connected ? <p className="form-error" role="status">You’re offline. Your input stays here; reconnect before saving.</p> : null}
      {busy ? <p className="save-status" role="status">{slow ? 'Still waiting for confirmation. Keep this page open; we’ll finish when connected.' : 'Adding a little deliciousness…'}</p> : null}
      </div><div className="sheet-actions"><button type="submit" className="primary-button handwritten-button" disabled={busy || !connected}>{busy ? 'Saving…' : dish ? 'Save changes' : 'Add to the feast'}<span aria-hidden="true"> →</span></button></div>
    </form>
  </Sheet>;
}
