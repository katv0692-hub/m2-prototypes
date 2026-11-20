// One-off CDP eval: evaluate JS in a Yandex Browser tab over port 9222.
// Usage: node cdp_eval.js <targetSubstring> <expression> [timeoutMs]
import WebSocket from 'ws';
const [targetSub, expr, timeoutMs = '30000'] = process.argv.slice(2);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  let tab = null;
  for (let i = 0; i < 20; i++) {
    const res = await fetch('http://127.0.0.1:9222/json/list');
    const tabs = await res.json();
    tab = tabs.find(t => t.type === 'page' && (t.url.includes(targetSub) || t.title.includes(targetSub)));
    if (tab) break;
    await sleep(500);
  }
  if (!tab) { console.error('NO_TAB: ' + targetSub); process.exit(2); }
  const ws = new WebSocket(tab.webSocketDebuggerUrl, { handshakeTimeout: 5000 });
  let id = 0; const pending = new Map();
  const tmo = parseInt(timeoutMs, 10);
  function send(method, params = {}, perTmo = tmo) {
    const msgId = ++id;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { pending.delete(msgId); reject(new Error('TIMEOUT_' + method)); }, perTmo);
      pending.set(msgId, { resolve, reject, timer });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }
  ws.on('message', (raw) => {
    const m = JSON.parse(raw.toString());
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); clearTimeout(p.timer); pending.delete(m.id);
      if (m.error) p.reject(new Error(JSON.stringify(m.error))); else p.resolve(m.result);
    }
  });
  ws.on('error', (e) => { console.error('WS_ERR ' + e.message); process.exit(3); });
  await new Promise(r => ws.on('open', r));
  try {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) {
      console.error('EXC: ' + JSON.stringify(r.exceptionDetails.exception?.description || r.exceptionDetails.text).slice(0, 2000));
      process.exit(1);
    }
    const v = r.result.value;
    console.log(typeof v === 'string' ? v : JSON.stringify(v));
  } finally {
    ws.close();
  }
}
main().catch(e => { console.error('FATAL: ' + e.message); process.exit(1); });
