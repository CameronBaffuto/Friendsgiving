import { useEffect, useState } from 'react';
import type { Store } from './data';
import type { Category, Dish } from './model';
import { FoodList } from './components/FoodList';
import { DishForm } from './components/DishForm';

export function App({ store, issue, demo }: { store: Store | null; issue: string; demo: boolean }) {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [connected, setConnected] = useState(false);
  const [failed, setFailed] = useState(false);
  const [form, setForm] = useState<{ category: Category; dish?: Dish } | null>(null);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (!store) return;
    const stopList = store.listen(values => { setDishes(values); setLoaded(true); setFailed(false); }, () => { setFailed(true); setLoaded(true); });
    const stopConnection = store.connection(setConnected);
    return () => { stopList(); stopConnection(); };
  }, [store]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 6000); return () => clearTimeout(timer); }, [notice]);

  return <main className="page">
    {demo ? <div className="preview-banner">Local preview · sample dishes · changes aren’t shared</div> : null}
    <header className="page-header"><h1>Friendsgivingmas</h1><p>Food signup</p>
      {store && !failed ? <><button className="primary-button add-button" disabled={!loaded} onClick={() => setForm({ category: 'sides' })}>Add what you’re bringing</button><div className={`connection ${connected ? '' : 'offline'}`} role="status"><span className="status-dot" />{!loaded ? 'Loading the food list…' : connected ? 'Updates live' : 'Offline · showing the last update'}</div></> : null}
    </header>
    {!store || failed ? <div className="page-message" role="alert"><h2>{failed ? 'This list isn’t available' : 'Let’s get you to the food list'}</h2><p>{failed ? 'Check that you opened the full link from your invitation. If it still won’t open, ask the host for a fresh link.' : issue}</p>{failed ? <button className="secondary-button" onClick={() => location.reload()}>Try again</button> : null}</div> : loaded ? <FoodList dishes={dishes} onAdd={category => setForm({ category })} onEdit={dish => setForm({ category: dish.category, dish })} /> : <p className="loading-copy">Getting everyone’s dishes…</p>}
    <div className="toast" role="status" aria-live="polite">{notice}</div>
    {form && store ? <DishForm store={store} {...form} connected={connected && !failed} onClose={() => setForm(null)} onSaved={message => { setNotice(message); setForm(null); }} /> : null}
  </main>;
}
