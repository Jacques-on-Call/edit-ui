import { render } from 'preact'
import VConsole from 'vconsole';
import './index.css'
import { App } from './app.jsx'

// --- VCONSOLE DEBUGGER ---
// Normally, this is wrapped in `if (import.meta.env.DEV)` to keep it out of production.
// It is temporarily enabled for all builds to allow for live mobile debugging.
// TODO: Re-wrap this in the DEV check once debugging is complete.
const vConsole = new VConsole();

// Add "Copy All" button to the Log tab toolbar
const logPlugin = vConsole.getPlugin('log');
if (logPlugin) {
  logPlugin.once('renderToolbar', (e) => {
    const toolbar = e.target;
    const btn = document.createElement('button');
    btn.className = 'vc-tool';
    btn.innerText = 'Copy All';
    btn.onclick = () => {
      const logContent = document.querySelector('.vc-log .vc-content')?.innerText;
      if (logContent && navigator.clipboard) {
        navigator.clipboard.writeText(logContent)
          .then(() => vConsole.showToast('Logs copied!'))
          .catch(err => vConsole.showToast('Copy failed!'));
      } else {
        vConsole.showToast('Could not copy logs.');
      }
    };
    toolbar.appendChild(btn);
  });
}


render(<App />, document.getElementById('app'))


// --- VCONSOLE DEBUGGER ---
// Moved to the end of the file to ensure the app renders first.
// Normally, this is wrapped in `if (import.meta.env.DEV)` to keep it out of production.
// It is temporarily enabled for all builds to allow for live mobile debugging.
// TODO: Re-wrap this in the DEV check once debugging is complete.
const vConsole = new VConsole();

// Add "Copy All" button to the Log tab toolbar
const logPlugin = vConsole.getPlugin('log');
if (logPlugin) {
  logPlugin.once('renderToolbar', (e) => {
    const toolbar = e.target;
    const btn = document.createElement('button');
    btn.className = 'vc-tool';
    btn.innerText = 'Copy All';
    btn.onclick = () => {
      const logContent = document.querySelector('.vc-log .vc-content')?.innerText;
      if (logContent && navigator.clipboard) {
        navigator.clipboard.writeText(logContent)
          .then(() => vConsole.showToast('Logs copied!'))
          .catch(err => vConsole.showToast('Copy failed!'));
      } else {
        vConsole.showToast('Could not copy logs.');
      }
    };
    toolbar.appendChild(btn);
  });
}
