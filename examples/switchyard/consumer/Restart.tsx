import { useState } from 'react';
import { Action, Status } from '@harness-demo/switchyard';

type State = { phase: 'idle' } | { phase: 'working' } | { phase: 'complete' } | { phase: 'failed' };

export function Restart({ restart }: { restart: () => Promise<void> }) {
  const [state, setState] = useState<State>({ phase: 'idle' });
  async function run() {
    setState({ phase: 'working' });
    try { await restart(); setState({ phase: 'complete' }); }
    catch { setState({ phase: 'failed' }); }
  }
  return <section aria-label="Restart worker">
    {state.phase === 'failed' ? <p role="alert">Restart failed. You can retry.</p>
      : <Status phase={state.phase} detail={state.phase === 'idle' ? 'Ready to restart' : state.phase === 'working' ? 'Restarting worker' : 'Worker restarted'} />}
    {state.phase !== 'working' && <Action kind="command" text={state.phase === 'failed' ? 'Retry restart' : 'Restart worker'} onActivate={() => { void run(); }} />}
    <Action kind="link" text="Read restart guidance" href="https://example.com/restart" />
  </section>;
}
