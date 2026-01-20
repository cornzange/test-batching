const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');

const app = express();
app.use(cors());

/* ================= DATA ================= */

const allItems = new Set();
const selectedSet = new Set();
let selectedItems = [];

let nextId = 1;

for (; nextId <= 1_000_000; nextId++) {
  allItems.add(nextId);
}

/* ================= QUEUE ================= */

const queue = [];
const queueAdd = [];

const dedupe = new Set();
const dedupeAdd = new Set();

function enqueue(action) {
  if (dedupe.has(action.key)) return;
  dedupe.add(action.key);
  queue.push(action);
}

function enqueueAdd(action) {
  if (dedupeAdd.has(action.key)) return;
  dedupeAdd.add(action.key);
  queueAdd.push(action);
}

/* ================= APPLY ================= */

function apply(action) {
  if (action.type === 'SELECT') {
    if (!selectedSet.has(action.id) && allItems.has(action.id)) {
      selectedSet.add(action.id);
      selectedItems.push(action.id);
    }
  }

  if (action.type === 'DESELECT') {
    selectedSet.delete(action.id);
    selectedItems = selectedItems.filter(i => i !== action.id);
  }

  if (action.type === 'REORDER') {
    selectedItems = action.orderedIds.filter(id => selectedSet.has(id));
  }
}

setInterval(() => {
  const batch = queue.splice(0);
  batch.forEach(a => {
    apply(a);
    dedupe.delete(a.key);
  });
  broadcastState();
}, 1000);

setInterval(() => {
  const batch = queueAdd.splice(0);
  if (batch.length !== 0) {
    batch.forEach(a => {
      allItems.add(a.id);
      dedupeAdd.delete(a.key);
    });
    broadcastState();
  }
}, 10000);

/* ================= WS ================= */

const server = app.listen(3001);
const wss = new WebSocket.Server({ server });

function send(ws, data) {
  ws.send(JSON.stringify(data));
}

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(c => c.readyState === 1 && c.send(msg));
}

function broadcastState() {
  broadcast({
    type: 'STATE',
    selectedItems
  });
}

function getItems(type, search, offset) {
  const src =
    type === 'left'
      ? [...allItems].filter(i => !selectedSet.has(i))
      : selectedItems;

  return src
    .filter(i => i.toString().includes(search))
    .slice(offset, offset + 20);
}

/* ================= CONNECTION ================= */

wss.on('connection', ws => {
  send(ws, { type: 'STATE', selectedItems });

  ws.on('message', raw => {
    const msg = JSON.parse(raw.toString());

    if (msg.type === 'FETCH') {
      send(ws, {
        type: 'ITEMS',
        list: msg.list,
        offset: msg.offset,
        search: msg.search,
        items: getItems(msg.list, msg.search, msg.offset)
      });
    }

    if (msg.type === 'SELECT')
      enqueue({ key: `S_${msg.id}`, type: 'SELECT', id: msg.id });

    if (msg.type === 'DESELECT')
      enqueue({ key: `D_${msg.id}`, type: 'DESELECT', id: msg.id });

    if (msg.type === 'ADD')
      enqueueAdd({ key: `A_${msg.id}`, type: 'ADD', id: msg.id });

    if (msg.type === 'REORDER')
      enqueue({ key: 'R', type: 'REORDER', orderedIds: msg.orderedIds });
  });
});

console.log('WS backend on :3001');
