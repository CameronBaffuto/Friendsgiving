import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../src/App';
import type { Store } from '../src/data';
import type { Dish } from '../src/model';

beforeEach(() => {
  localStorage.clear();
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
afterEach(cleanup);

function makeStore(overrides: Partial<Store> = {}, dishes: Dish[] = []): Store {
  return { listen(receive) { receive(dishes); return () => {}; }, connection(receive) { receive(true); return () => {}; }, save: vi.fn().mockResolvedValue(undefined), remove: vi.fn().mockResolvedValue(undefined), ...overrides };
}

async function fillDish() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Add what you’re bringing' }));
  await user.type(screen.getByLabelText('Your name'), 'Alex');
  await user.type(screen.getByLabelText('Dish', { exact: true }), 'Mashed potatoes');
  return user;
}

test('success waits for server acknowledgement and repeated submission is disabled', async () => {
  let finish!: () => void;
  const save = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
  render(<App store={makeStore({ save })} issue="" demo={false} />);
  const user = await fillDish();
  await user.click(screen.getByRole('button', { name: 'Save dish' }));
  expect(screen.getByRole('button', { name: 'Saving…' }).hasAttribute('disabled')).toBe(true);
  expect(screen.queryByText('Mashed potatoes saved ✓')).toBeNull();
  expect(save).toHaveBeenCalledTimes(1);
  await act(async () => finish());
  expect(screen.getByText('Mashed potatoes saved ✓')).toBeTruthy();
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('failed saves retain input and retries reuse the same entry ID', async () => {
  const save = vi.fn().mockRejectedValueOnce(new Error('network')).mockResolvedValue(undefined);
  render(<App store={makeStore({ save })} issue="" demo={false} />);
  const user = await fillDish();
  await user.click(screen.getByRole('button', { name: 'Save dish' }));
  expect(await screen.findByRole('alert')).toBeTruthy();
  expect((screen.getByLabelText('Dish', { exact: true }) as HTMLInputElement).value).toBe('Mashed potatoes');
  await user.click(screen.getByRole('button', { name: 'Save dish' }));
  expect(save.mock.calls[0][0]).toBe(save.mock.calls[1][0]);
});

test('offline guests can draft but cannot submit', async () => {
  const store = makeStore({ connection(receive) { receive(false); return () => {}; } });
  render(<App store={store} issue="" demo={false} />);
  await fillDish();
  expect(screen.getByRole('button', { name: 'Save dish' }).hasAttribute('disabled')).toBe(true);
  expect(store.save).not.toHaveBeenCalled();
});

test('remove requires confirmation and cancel preserves the entry', async () => {
  const dish: Dish = { id: 'one', name: 'Cam', dish: 'Turkey', category: 'mains', note: '', createdAt: 1, updatedAt: 1, revision: 'one' };
  const store = makeStore({}, [dish]);
  render(<App store={store} issue="" demo={false} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Edit Turkey from Cam' }));
  await user.click(screen.getByRole('button', { name: 'Remove dish' }));
  expect(store.remove).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Keep dish' }));
  expect(store.remove).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Remove dish' }));
  await user.click(screen.getByRole('button', { name: 'Remove dish' }));
  expect(store.remove).toHaveBeenCalledWith(dish);
  expect(screen.getByText('Dish removed.')).toBeTruthy();
});

test('category shortcut prefills the category and saved names are remembered', async () => {
  localStorage.setItem('friendsgivingmas:name:v1', 'Alex');
  render(<App store={makeStore()} issue="" demo={false} />);
  await userEvent.click(screen.getByRole('button', { name: 'Add a dish to Appetizers' }));
  expect((screen.getByLabelText('Category') as HTMLSelectElement).value).toBe('appetizers');
  expect((screen.getByLabelText('Your name') as HTMLInputElement).value).toBe('Alex');
});
