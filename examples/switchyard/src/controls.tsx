type ActionProps =
  | { kind: 'link'; text: string; href: string }
  | { kind: 'command'; text: string; onActivate: () => void };

/** Choose navigation or a local command explicitly; their required props differ. */
export function ActionControl(props: ActionProps) {
  return props.kind === 'link'
    ? <a href={props.href}>{props.text}</a>
    : <button type="button" onClick={props.onActivate}>{props.text}</button>;
}

/** Report job state without inferring success from a button click. */
export function JobStatus({ phase, detail }: { phase: 'idle' | 'working' | 'complete'; detail: string }) {
  return <p role="status" aria-live="polite" data-phase={phase}>{detail}</p>;
}
