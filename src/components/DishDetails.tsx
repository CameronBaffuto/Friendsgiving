import { useEffect, useRef, useState } from 'react';
import type { Store } from '../data';
import { categories } from '../model';
import type { Dish } from '../model';
import { Sheet } from './Sheet';
import { categoryArt, Illustration } from './Illustration';
export function DishDetails({ store, dish, latest, connected, onClose, onEdit, onLatest, onRemoved }: {
    store: Store;
    dish: Dish;
    latest?: Dish;
    connected: boolean;
    onClose: () => void;
    onEdit: () => void;
    onLatest: () => void;
    onRemoved: () => void;
}) {
    const [confirm, setConfirm] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const pending = useRef(false);
    const stale = !latest || latest.revision !== dish.revision;
    useEffect(() => { if (!busy)
        return; const warn = (e: BeforeUnloadEvent) => e.preventDefault(); window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [busy]);
    async function remove() {
        if (pending.current || !connected || stale)
            return;
        pending.current = true;
        setBusy(true);
        setError('');
        try {
            await store.remove(dish);
            onRemoved();
        }
        catch (cause) {
            setError(cause instanceof Error && cause.message.startsWith('Someone') ? cause.message : 'That didn’t remove. Check your connection and try again.');
        }
        finally {
            pending.current = false;
            setBusy(false);
        }
    }
    return <Sheet titleId="detail-heading" busy={busy} onClose={onClose} className="details-sheet"><div className="detail-content"><Illustration name={categoryArt[dish.category]} className="detail-art"/><p className="detail-category">{categories.find(([id]) => id === dish.category)?.[1]}</p><h2 id="detail-heading">{dish.dish}</h2><p className="detail-contributor">Brought with love by <strong>{dish.name}</strong></p>{dish.note ? <p className="detail-note">{dish.note}</p> : null}
    {stale ? <div className="form-error" role="alert"><p>Someone changed or removed this dish. Open the latest version before making changes.</p><button className="text-button" onClick={onLatest}>Reopen the latest version</button></div> : null}
    {error ? <div className="form-error" role="alert"><p>{error}</p>{error.startsWith('Someone') ? <button className="text-button" onClick={onLatest}>Reopen the latest version</button> : null}</div> : null}
    {!connected ? <p className="form-error" role="status">You’re offline. Reconnect to edit or remove.</p> : null}
    {confirm ? <div className="remove-confirm"><h3>Remove this dish?</h3><p>“{dish.dish}” will leave the shared menu.</p><button type="button" className="danger-button" disabled={busy || !connected || stale} onClick={() => void remove()}>{busy ? 'Removing… waiting for confirmation' : 'Yes, remove dish'}</button><button type="button" className="secondary-button" disabled={busy} onClick={() => setConfirm(false)}>Keep it on the menu</button></div> : <div className="detail-actions"><button className="primary-button" disabled={!connected || stale} onClick={onEdit}>Edit dish</button><button className="text-button remove-button" disabled={!connected || stale} onClick={() => setConfirm(true)}>Remove dish</button></div>}
    </div></Sheet>;
}
