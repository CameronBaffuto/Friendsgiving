import { useEffect, useState } from 'react';
import type { Store } from './data';
import type { Dish } from './model';
import { FoodList } from './components/FoodList';
import { DishForm } from './components/DishForm';
import { DishDetails } from './components/DishDetails';
import { Illustration, categoryArt } from './components/Illustration';
import { Sheet } from './components/Sheet';
type Surface = {
    kind: 'add';
} | {
    kind: 'details';
    dish: Dish;
} | {
    kind: 'edit';
    dish: Dish;
} | {
    kind: 'success';
    dish: Dish;
} | null;
export function App({ store, issue, demo }: {
    store: Store | null;
    issue: string;
    demo: boolean;
}) {
    const [dishes, setDishes] = useState<Dish[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [connected, setConnected] = useState(false);
    const [failed, setFailed] = useState(false);
    const [surface, setSurface] = useState<Surface>(null);
    const [notice, setNotice] = useState('');
    useEffect(() => {
        if (!store)
            return;
        const stopList = store.listen(values => { setDishes(values); setLoaded(true); setFailed(false); }, () => { setFailed(true); setLoaded(true); });
        const stopConnection = store.connection(setConnected);
        return () => { stopList(); stopConnection(); };
    }, [store]);
    useEffect(() => { if (!notice)
        return; const timer = setTimeout(() => setNotice(''), 6000); return () => clearTimeout(timer); }, [notice]);
    function reopen(id: string) { const latest = dishes.find(d => d.id === id); setSurface(latest ? { kind: 'details', dish: latest } : null); if (!latest)
        setNotice('That dish has been removed. The menu is up to date.'); }
    return <main className="page">
    <header className="hero">
      <Illustration name="orange-ribbon" className="hero-orange"/><Illustration name="candle" className="hero-candle"/>
      <p className="hero-note">A little bit Thanksgiving,<br />a little bit Christmas,<br />a whole lot of fun</p>
      <h1>Baffuto</h1>
      <h1>Friendsgiving</h1>
      <img className="hero-bow" src="/assets/decorations/bow-divider.png" alt=""/>
      <p className="tagline">Good food. Better company.</p>
      <button id="bring-button" className="primary-button bring-button" disabled={!store || !loaded || failed} onClick={() => setSurface({ kind: 'add' })}><span aria-hidden="true">＋</span> I’m bringing something <span aria-hidden="true">→</span></button>
      <Illustration name="greenery" className="hero-greenery"/>
    </header>
    <div className="gingham" aria-hidden="true"/>
    <section className="feast" aria-labelledby="feast-heading"><div className="feast-heading"><h2 id="feast-heading">The Feast</h2><span className="dish-total">{loaded ? `${dishes.length} ${dishes.length === 1 ? 'dish' : 'dishes'}` : 'a place for everyone'}</span></div>
      {!store || failed ? <div className="page-message" role="alert"><h3>{failed ? 'The menu needs a moment' : 'You’re invited to the feast'}</h3><p>{failed ? 'We couldn’t open this menu. Check your connection and the full invitation link, then try again.' : issue}</p>{failed ? <button className="secondary-button" onClick={() => location.reload()}>Try again</button> : import.meta.env.DEV ? <a className="secondary-button" href="/?demo">Preview the menu</a> : null}</div> : !loaded ? <p className="loading-copy" role="status">Setting the table. Getting everyone’s dishes…</p> : <><FoodList dishes={dishes} onOpen={dish => setSurface({ kind: 'details', dish })}/><p className={`connection ${connected ? '' : 'offline'}`} role="status">{connected ? demo ? '' : 'The menu updates live' : 'Offline · showing the last update. Reconnect to save.'}</p></>}
    </section>
    <footer className="closing"><img src="/assets/decorations/leaf-divider.png" alt=""/><p>There’s always room at our table.</p><span>Made with love 2026</span></footer>
    <div className={`toast ${notice ? 'visible' : ''}`} role="status" aria-live="polite">{notice}</div>
    {surface?.kind === 'add' || surface?.kind === 'edit' ? store ? <DishForm key={surface.kind === 'edit' ? surface.dish.id : 'new'} store={store} dish={surface.kind === 'edit' ? surface.dish : undefined} dishes={dishes} connected={connected && !failed} onClose={() => setSurface(null)} onLatest={reopen} onSaved={(dish, editing) => { if (editing) {
        setSurface(null);
        setNotice('Your dish has been updated.');
    }
    else
        setSurface({ kind: 'success', dish }); }}/> : null : null}
    {surface?.kind === 'details' && store ? <DishDetails store={store} dish={surface.dish} latest={dishes.find(d => d.id === surface.dish.id)} connected={connected && !failed} onClose={() => setSurface(null)} onEdit={() => setSurface({ kind: 'edit', dish: surface.dish })} onLatest={() => reopen(surface.dish.id)} onRemoved={() => { setSurface(null); setNotice('Dish removed from the menu.'); }}/> : null}
    {surface?.kind === 'success' ? <Sheet titleId="success-heading" className="success-sheet" onClose={() => setSurface(null)}><h2 id="success-heading">You’re on<br />the menu!</h2><Illustration name={categoryArt[surface.dish.category]} className="success-art"/><h3>{surface.dish.dish}</h3><p>has been added to the feast.</p><div className="success-actions"><button className="primary-button" onClick={() => setSurface({ kind: 'add' })}>Add another dish</button><button className="secondary-button" onClick={() => setSurface(null)}>Back to the menu</button></div><img className="success-divider" src="/assets/decorations/leaf-divider.png" alt=""/></Sheet> : null}
  </main>;
}
