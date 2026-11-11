import { useState } from 'react';
import { Button, DateRangePicker, Notice } from '@harness-demo/fieldwork';

type Dates = { start: string; end: string };
type State =
  | { status: 'editing'; dates: Dates; error: string | null }
  | { status: 'submitting'; dates: Dates }
  | { status: 'failed'; dates: Dates }
  | { status: 'confirmed'; dates: Dates; reference: string };

// This example uses an injected service; the preview service is explicitly simulated.
export function Reservation({ reserve }: { reserve: (dates: Dates) => Promise<string> }) {
  const [state, setState] = useState<State>({ status: 'editing', dates: { start: '', end: '' }, error: null });
  async function submit() {
    if (state.status !== 'editing') return;
    const { dates } = state;
    if (!dates.start || !dates.end || dates.end <= dates.start) {
      setState({ status: 'editing', dates, error: 'Choose a departure after your arrival.' });
      return;
    }
    setState({ status: 'submitting', dates });
    try { setState({ status: 'confirmed', dates, reference: await reserve(dates) }); }
    catch { setState({ status: 'failed', dates }); }
  }
  return <main className="fw-card">
    <p className="fw-eyebrow">Fieldwork / cabin stays</p>
    <h1>A little room to breathe.</h1>
    <p>Choose your dates. Review the stay before you commit.</p>
    {state.status === 'confirmed' ? <>
      <Notice tone="success" message={`Reservation ${state.reference} confirmed: ${state.dates.start} to ${state.dates.end}.`} />
      <Button type="button" onClick={() => setState({ status: 'editing', dates: state.dates, error: null })}>Choose another stay</Button>
    </> : state.status === 'failed' ? <Notice tone="error" message="We couldn’t reserve your stay. Your dates are saved."
      retry={() => setState({ status: 'editing', dates: state.dates, error: null })} /> :
      <form noValidate onSubmit={e => { e.preventDefault(); void submit(); }} aria-busy={state.status === 'submitting'}>
        <fieldset disabled={state.status === 'submitting'} className="fw-form">
          <DateRangePicker id="stay" label="Your stay" {...state.dates}
            onChange={dates => setState({ status: 'editing', dates, error: null })} />
          {state.status === 'editing' && state.error && <p role="alert">{state.error}</p>}
          <Button type="submit" disabled={state.status === 'submitting'}>{state.status === 'submitting' ? 'Reserving…' : 'Confirm reservation'}</Button>
        </fieldset>
      </form>}
    <p className="fw-footnote">Demonstration only. No payment or real booking occurs.</p>
  </main>;
}
