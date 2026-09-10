#!/usr/bin/env node
/* Records docs/demo.gif — the walkthrough at the top of README.md.
 *
 *   node record_demo.js          # writes docs/demo.gif
 *
 * The demo goes stale every time the interface changes, so it is built by a
 * script instead of by hand. The script drives a Chrome that is already on the
 * machine over the DevTools Protocol, with node built-ins only: the project has
 * no package.json and no build step, and this does not add one. `ffmpeg` turns
 * the frames into the GIF.
 *
 * It needs: a Chrome (see CHROME below) and ffmpeg on the PATH.
 */
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CHROME = [
  process.env.CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean).find((p) => fs.existsSync(p))
  || (function () {
    // Whatever `npx puppeteer browsers install chrome` last put down.
    const root = path.join(os.homedir(), '.cache/puppeteer/chrome');
    if (!fs.existsSync(root)) return null;
    for (const build of fs.readdirSync(root).sort().reverse()) {
      const hit = path.join(root, build, 'chrome-mac-arm64',
        'Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing');
      if (fs.existsSync(hit)) return hit;
    }
    return null;
  })();

const PAGE = 'file://' + path.join(__dirname, 'index.html');
const FRAMES = fs.mkdtempSync(path.join(os.tmpdir(), 'kjuge-demo-'));
const GIF = path.join(__dirname, 'docs', 'demo.gif');
const PORT = 9333;
const W = 390, H = 844;          // a phone, which is where the app is used

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function debuggerUrl() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch('http://127.0.0.1:' + PORT + '/json/list')).json();
      const page = list.find((t) => t.type === 'page');
      if (page) return page.webSocketDebuggerUrl;
    } catch (e) { /* not up yet */ }
    await sleep(250);
  }
  throw new Error('Chrome did not open its debugging port');
}

// A very small DevTools Protocol client: send a method, get its result back.
function connect(url) {
  const ws = new WebSocket(url);
  const waiting = new Map();
  let id = 0;
  const open = new Promise((res) => { ws.onopen = res; });
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (!msg.id || !waiting.has(msg.id)) return;
    const { res, rej } = waiting.get(msg.id);
    waiting.delete(msg.id);
    msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
  };
  const send = (method, params) => open.then(() => new Promise((res, rej) => {
    const n = ++id;
    waiting.set(n, { res, rej });
    ws.send(JSON.stringify({ id: n, method, params: params || {} }));
  }));
  return { send, close: () => ws.close() };
}

(async () => {
  if (!CHROME) throw new Error('No Chrome found. Set CHROME=/path/to/chrome');
  console.log('chrome  ', CHROME);
  console.log('frames  ', FRAMES);

  const chrome = spawn(CHROME, [
    '--remote-debugging-port=' + PORT,
    '--headless=new', '--hide-scrollbars', '--disable-gpu',
    '--no-first-run', '--no-default-browser-check',
    '--user-data-dir=' + path.join(os.tmpdir(), 'kjuge-demo-profile'),
    'about:blank',
  ], { stdio: 'ignore' });

  const cdp = connect(await debuggerUrl());
  let n = 0;

  // `hold` repeats the frame, which is how a GIF pauses on a step.
  const shoot = async (label, hold = 1) => {
    const { data } = await cdp.send('Page.captureScreenshot', { format: 'png' });
    for (let i = 0; i < hold; i++) {
      fs.writeFileSync(path.join(FRAMES, String(++n).padStart(2, '0') + '-' + label + '.png'),
        Buffer.from(data, 'base64'));
    }
    console.log('  frame', n, label);
  };
  const run = async (expression) => {
    const r = await cdp.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(expression + ' -> ' + r.exceptionDetails.text);
    return r.result && r.result.value;
  };

  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: true });
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'dark' }] });

  await cdp.send('Page.navigate', { url: PAGE });
  await sleep(6000);
  await run("localStorage.setItem('kjuge.ticks','[]')");   // start with nothing ticked
  await run('location.href=location.pathname');
  await sleep(6000);

  await shoot('peek', 2);                                   // the sheet at rest

  await run("document.getElementById('grab').click()");     // the walk
  await sleep(900);
  await shoot('walk', 2);

  await run("document.querySelectorAll('#walkList .myrow')[0].click()");   // a block page
  await sleep(2600);
  await shoot('block', 2);

  await run("document.querySelectorAll('#sbody .ptick')[1].click()");      // tick one off
  await sleep(1200);
  await shoot('ticked', 2);

  await run("document.querySelector('#sbody .strip img').click()");        // the topo
  await sleep(2200);
  await shoot('photo', 2);
  await run("document.getElementById('lbClose').click();document.getElementById('sclose').click()");
  await sleep(600);

  await run("document.getElementById('grab').click()");                    // pick another circuit
  await sleep(500);
  await run("document.getElementById('tabCircuits').click()");
  await sleep(700);
  await shoot('circuits', 2);
  await run("[...document.querySelectorAll('#listSel .listrow')].find(r=>r.innerText.indexOf('The highballs')===0).click()");
  await sleep(1400);
  await shoot('picked', 2);

  await run("document.getElementById('grab').click()");                    // the two, merged
  await sleep(2600);
  await shoot('merged', 3);

  await run("document.getElementById('grab').click()");                    // narrow it down
  await sleep(400);
  await run("document.getElementById('tabFilters').click()");
  await sleep(700);
  await run("document.getElementById('gNone').click()");
  await sleep(500);
  await run("['6A','6A+','6B','6B+'].forEach(g=>[...document.querySelectorAll('#grades .chip')].find(c=>c.dataset.g===g).click())");
  await sleep(900);
  await shoot('filters', 2);

  await run("document.getElementById('grab').click()");                    // what is left
  await sleep(2600);
  await shoot('filtered', 3);

  cdp.close();
  chrome.kill();

  fs.mkdirSync(path.dirname(GIF), { recursive: true });
  const ff = spawnSync('ffmpeg', ['-v', 'error', '-y',
    '-framerate', '1.35', '-pattern_type', 'glob', '-i', path.join(FRAMES, '*.png'),
    '-vf', 'scale=400:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=224[p];[b][p]paletteuse=dither=bayer:bayer_scale=3',
    '-loop', '0', GIF], { stdio: 'inherit' });
  if (ff.status !== 0) throw new Error('ffmpeg failed');

  fs.rmSync(FRAMES, { recursive: true, force: true });
  console.log('wrote', GIF, (fs.statSync(GIF).size / 1024).toFixed(0) + ' KB,', n, 'frames');
  process.exit(0);
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
