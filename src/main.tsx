import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { sounds } from './audio/sound';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

let started = false;
window.addEventListener(
  'pointerdown',
  () => {
    sounds.play('click');
    if (!started) {
      started = true;
      sounds.startBg();
    }
  },
  { passive: true }
);
