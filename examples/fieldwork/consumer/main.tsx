import { createRoot } from 'react-dom/client';
import { Reservation } from './Reservation';
import './style.css';

createRoot(document.getElementById('root')!).render(<Reservation reserve={async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return 'DEMO-104';
}} />);
