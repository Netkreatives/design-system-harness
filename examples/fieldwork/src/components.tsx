import type { ReactNode } from 'react';

export type ButtonProps = {
  /** Use an action and its object, such as Confirm reservation. */
  children: ReactNode;
  type: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
};

/** The primary action in a small task. Explicit type prevents accidental form submission. */
export function Button({ children, type, disabled, onClick }: ButtonProps) {
  return <button className="fw-button" type={type} disabled={disabled} onClick={onClick}>{children}</button>;
}

type DateRangeProps = {
  id: string;
  label: string;
  start: string;
  end: string;
  /** Local calendar dates, not UTC instants. */
  onChange: (value: { start: string; end: string }) => void;
};

/** Select arrival and departure as local calendar dates. The consumer validates the range. */
export function DateRangePicker({ id, label, start, end, onChange }: DateRangeProps) {
  return <fieldset className="fw-dates">
    <legend>{label}</legend>
    <label htmlFor={`${id}-start`}>Arrival</label>
    <input id={`${id}-start`} name="arrival" type="date" required value={start}
      onChange={e => onChange({ start: e.currentTarget.value, end })} />
    <label htmlFor={`${id}-end`}>Departure</label>
    <input id={`${id}-end`} name="departure" type="date" required min={start || undefined} value={end}
      onChange={e => onChange({ start, end: e.currentTarget.value })} />
  </fieldset>;
}

// A discriminated union: retry is required only for error notices.
type NoticeProps =
  | { tone: 'success'; message: string }
  | { tone: 'error'; message: string; retry: () => void };

/** Keep recovery next to the problem. A success notice has no retry action. */
export function Notice(props: NoticeProps) {
  return <div className={`fw-notice fw-${props.tone}`} role={props.tone === 'error' ? 'alert' : 'status'}>
    <p>{props.message}</p>
    {props.tone === 'error' && <Button type="button" onClick={props.retry}>Try again</Button>}
  </div>;
}

/** Deliberately generic: the reference extractor reports this as unsupported. */
export function ExperimentalList<T>({ items, render }: { items: T[]; render: (item: T) => ReactNode }) {
  return <ul>{items.map((item, index) => <li key={index}>{render(item)}</li>)}</ul>;
}
