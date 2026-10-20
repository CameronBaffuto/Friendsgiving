import { useEffect, useRef, useState } from 'react';
import { categories, rememberName, validateInput } from '../model';
import type { Category, Dish, DishInput } from '../model';
import type { Store } from '../data';

export function DishForm({ store, dish, category, connected, onClose, onSaved }: {
  store: Store; dish?: Dish; category: Category; connected: boolean;
  onClose: () => void; onSaved: (message: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [id] = useState(() => dish?.id ?? crypto.randomUUID());
  const [input, setInput] = useState<DishInput>(() => ({ name: dish?.name ?? rememberName(), dish: dish?.dish ?? '', category: dish?.category ?? category, note: dish?.note ?? '' }));
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);
  const pending = useRef(false);

  useEffect(() => { dialog.current?.showModal(); return () => dialog.current?.close(); }, []);
  useEffect(() => {
    if (!busy) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    const timer = window.setTimeout(() => setSlow(true), 7000);
    return () => { clearTimeout(timer); window.removeEventListener('beforeunload', warn); };
  }, [busy]);

  function field<K extends keyof DishInput>(key: K, value: DishInput[K]) {
    setInput(previous => ({ ...previous, [key]: value })); setError('');
  }

  async function commit(remove = false) {
    if (pending.current) return;
    if (!connected) { setError('You’re offline. Your changes are still here; reconnect, then save.'); return; }
    const cleaned = { ...input, name: input.name.trim(), dish: input.dish.trim(), note: input.note.trim() };
    const validation = remove ? null : validateInput(cleaned);
    if (validation) { setError(validation); return; }
    pending.current = true; setBusy(true); setSlow(false); setError('');
    try {
      if (remove && dish) await store.remove(dish);
      else { await store.save(id, cleaned, dish); rememberName(cleaned.name); }
      onSaved(remove ? 'Dish removed.' : `${cleaned.dish} saved ✓`);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : '';
      setError(message.startsWith('Someone') ? message : 'That didn’t save. Your changes are still here. Check your connection and try again.');
    } finally { pending.current = false; setBusy(false); }
  }

  return <dialog ref={dialog} className="dish-dialog" aria-labelledby="form-heading" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <form onSubmit={event => { event.preventDefault(); void commit(); }}>
      <h2 id="form-heading">{dish ? 'Edit dish' : 'Add a dish'}</h2>
      <fieldset disabled={busy}>
        <label>Your name<input autoFocus name="name" autoComplete="given-name" required maxLength={60} value={input.name} onChange={e => field('name', e.target.value)} placeholder="e.g. Alex" /></label>
        <label>Dish<input name="dish" required maxLength={100} value={input.dish} onChange={e => field('dish', e.target.value)} placeholder="e.g. Mashed potatoes" /></label>
        <label>Category<select value={input.category} onChange={e => field('category', e.target.value as Category)}>{categories.map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></label>
        <label>Note <span className="optional">(optional)</span><textarea name="note" maxLength={300} rows={3} value={input.note} onChange={e => field('note', e.target.value)} placeholder="e.g. Feeds 8, vegetarian, needs oven space" /></label>
      </fieldset>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      {busy ? <p className="save-status" role="status">{slow ? 'Still waiting for confirmation. Keep this page open; we’ll finish when connected.' : 'Saving…'}</p> : !connected ? <p className="form-error" role="status">You’re offline. Reconnect before saving.</p> : null}
      {confirmRemove ? <div className="remove-confirm"><p>Remove {dish?.dish} from the list?</p><div className="form-actions"><button type="button" disabled={busy} className="secondary-button" onClick={() => setConfirmRemove(false)}>Keep dish</button><button type="button" disabled={busy || !connected} className="danger-button" onClick={() => void commit(true)}>{busy ? 'Removing…' : 'Remove dish'}</button></div></div> : <>
        <div className="form-actions"><button type="button" className="secondary-button" disabled={busy} onClick={onClose}>Cancel</button><button type="submit" className="primary-button" disabled={busy || !connected}>{busy ? 'Saving…' : 'Save dish'}</button></div>
        {dish ? <button type="button" className="remove-button" disabled={busy} onClick={() => setConfirmRemove(true)}>Remove dish</button> : null}
      </>}
    </form>
  </dialog>;
}
