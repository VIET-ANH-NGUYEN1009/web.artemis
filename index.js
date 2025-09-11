const tblBody = document.querySelector('#tbl tbody');
const logEl = document.getElementById('log');
const totalChip = document.getElementById('total-chip');
const connDot = document.getElementById('conn-dot');
const connText = document.getElementById('conn-text');

// Sử dụng biến HOST thay vì gán location.host
const HOST = "localhost:3000";
let ws;

function log(msg) {
  const line = document.createElement('div');
  line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  logEl.prepend(line);
}

async function loadData() {
  const res = await fetch('/api.artemis/get');
  const rows = await res.json();
  tblBody.innerHTML = '';
  rows.forEach(r => appendRow(r));
  totalChip.textContent = `Total: ${rows.length}`;
}

function appendRow(r, isNew=false) {
  const tr = document.createElement('tr');
  if (isNew) tr.classList.add('new');
  tr.innerHTML = `<td>${r.id||''}</td><td>${r.qr_code}</td><td>${r.user_id}</td><td>${r.date}</td>`;
  tblBody.prepend(tr);
}

function connectWS() {
  ws = new WebSocket(`ws://${HOST}/api.artemis/socket`);
  document.getElementById('ws-url').textContent = ws.url;
  document.getElementById('http-get').textContent = location.origin + '/api.artemis/get';

  ws.onopen = () => { 
    connDot.style.background = 'lime'; 
    connText.textContent = 'Connected'; 
    log('WebSocket opened'); 
  };
  ws.onclose = () => { 
    connDot.style.background = 'orange'; 
    connText.textContent = 'Closed'; 
    log('WebSocket closed'); 
  };
  ws.onmessage = (ev) => {
    const data = JSON.parse(ev.data);
    appendRow(data, true);
    log(`New scan: ${data.qr_code} by ${data.user_id}`);
  };
}

document.getElementById('btn-refresh').onclick = loadData;

document.getElementById('btn-insert-test').onclick = async () => {
  await fetch('/api.artemis/insert-test');
  loadData();
};

document.getElementById('btn-export').onclick = () => {
  let csv = 'id,qr_code,user_id,date\n';
  [...tblBody.querySelectorAll('tr')].forEach(tr => {
    csv += [...tr.children].map(td => td.textContent).join(',') + '\n';
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'qr_data.csv';
  a.click();
};

document.getElementById('send-form').onsubmit = (e) => {
  e.preventDefault();
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      qr_code: document.getElementById('inp-qr').value,
      user_id: document.getElementById('inp-user').value
    }));
    log('Sent new QR via WS');
  }
};

document.getElementById('btn-connect').onclick = connectWS;
document.getElementById('btn-disconnect').onclick = () => ws?.close();

// init
loadData();
connectWS();
