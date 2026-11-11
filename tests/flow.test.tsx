import { test, expect, afterAll } from 'bun:test';
import { Window } from 'happy-dom';
import { act } from 'react';
import { Reservation } from '../examples/fieldwork/consumer/Reservation';

const window = new Window();
Object.assign(globalThis, { window, document: window.document, navigator: window.navigator,
  HTMLElement: window.HTMLElement, HTMLInputElement: window.HTMLInputElement,
  IS_REACT_ACT_ENVIRONMENT: true });
const { createRoot } = await import('react-dom/client');
afterAll(() => window.happyDOM.abort());

test('reservation validates, preserves dates after failure, blocks duplicate submit, and confirms', async () => {
  const container = document.createElement('div'); document.body.append(container);
  const root = createRoot(container);
  let calls = 0;
  let resolveReservation: (value: string) => void = () => {};
  async function reserve() {
    calls++;
    if (calls === 1) throw new Error('Simulated service failure');
    return new Promise<string>(resolve => { resolveReservation = resolve; });
  }
  async function submit() {
    await act(async () => { container.querySelector('form')!.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }) as unknown as Event); });
  }
  async function date(id: string, value: string) {
    await act(async () => {
      const input = container.querySelector<HTMLInputElement>(id)!;
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!.call(input, value);
      input.dispatchEvent(new window.Event('change', { bubbles: true }) as unknown as Event);
    });
  }
  try {
    await act(async () => { root.render(<Reservation reserve={reserve} />); });
    await submit(); expect(calls).toBe(0); expect(container.querySelector('[role=alert]')?.textContent).toContain('departure');
    await date('#stay-start', '2026-12-10'); await date('#stay-end', '2026-12-09');
    await submit(); expect(calls).toBe(0);
    await date('#stay-end', '2026-12-12'); await submit();
    expect(calls).toBe(1); expect(container.querySelector('[role=alert]')?.textContent).toContain('dates are saved');
    await act(async () => { container.querySelector<HTMLButtonElement>('button')!.click(); });
    expect(container.querySelector<HTMLInputElement>('#stay-start')!.value).toBe('2026-12-10');
    expect(container.querySelector<HTMLInputElement>('#stay-end')!.value).toBe('2026-12-12');
    await submit(); expect(calls).toBe(2);
    expect(container.querySelector<HTMLButtonElement>('button')!.disabled).toBe(true);
    await submit(); expect(calls).toBe(2);
    await act(async () => { resolveReservation('BOOK-42'); });
    expect(container.querySelector('[role=status]')?.textContent).toContain('BOOK-42');
    expect(container.textContent).toContain('2026-12-10 to 2026-12-12');
  } finally {
    await act(async () => { root.unmount(); }); container.remove();
  }
});
