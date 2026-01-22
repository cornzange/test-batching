const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const crypto = require('crypto');

const app = express();
app.use(cors());

/* ================= CONFIG ================= */

const PAGE_SIZE = 20;

/* ================= HASH ================= */

function hash(data) {
  return crypto
    .createHash('sha1')
    .update(JSON.stringify(data))
    .digest('hex');
}

/* ================= DATA ================= */

const allItems = new Set();
const selectedSet = new Set();
let selectedItems = [];

for (let i = 1; i <= 1_000_000; i++) {
  allItems.add(i);
}

/* ================= QUEUES ================= */

const actionQueue = [];
const addQueue = [];

const actionDedupe = new Set();
const addDedupe = new Set();

function enqueue(action) {
  if (actionDedupe.has(action.key)) return;
  actionDedupe.add(action.key);
  actionQueue.push(action);
}

function enqueueAdd(action) {
  if (addDedupe.has(action.key)) return;
  addDedupe.add(action.key);
  addQueue.push(action);
}

/* ================= APPLY ================= */

function applyAction(action) {
  switch (action.type) {
    case 'SELECT':
      if (!selectedSet.has(action.id) && allItems.has(action.id)) {
        selectedSet.add(action.id);
        selectedItems.push(action.id);
      }
      break;

    case 'DESELECT':
      selectedSet.delete(action.id);
      selectedItems = selectedItems.filter(i => i !== action.id);
      break;

    case 'REORDER':
      selectedItems = action.orderedIds.filter(id => selectedSet.has(id));
      break;
  }
}

/* ===== SELECT / DESELECT / REORDER — 1s ===== */

setInterval(() => {
  const batch = actionQueue.splice(0);
  if (!batch.length) return;

  batch.forEach(a => {
    applyAction(a);
    actionDedupe.delete(a.key);
  });

  notifyUpdate('left');
  notifyUpdate('right');
}, 1_000);

/* ===== ADD — 10s ===== */

setInterval(() => {
  const batch = addQueue.splice(0);
  if (!batch.length) return;

  batch.forEach(a => {
    allItems.add(a.id);
    addDedupe.delete(a.key);
  });

  notifyUpdate('left');
}, 10_000);

/* ================= LIST HELPERS ================= */

function getList(list, search = '') {
  const src =
    list === 'left'
      ? [...allItems].filter(i => !selectedSet.has(i))
      : selectedItems;

  return src.filter(i => i.toString().includes(search));
}

function getPage(list, search, page) {
  const from = page * PAGE_SIZE;
  return getList(list, search).slice(from, from + PAGE_SIZE);
}

/* ================= WS ================= */

const server = app.listen(3001);
const wss = new WebSocket.Server({ server });

function send(ws, data) {
  ws.send(JSON.stringify(data));
}

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(
    c => c.readyState === WebSocket.OPEN && c.send(msg)
  );
}

/* ================= NOTIFY ================= */

function notifyUpdate(list) {
  broadcast({
    type: 'LIST_UPDATED',
    list
  });
}

/* ================= CONNECTION ================= */

wss.on('connection', ws => {
  ws.on('message', raw => {
    const msg = JSON.parse(raw.toString());

    /* ===== PAGE FETCH ===== */

    if (msg.type === 'FETCH') {
      send(ws, {
        type: 'ITEMS',
        list: msg.list,
        page: msg.page,
        search: msg.search,
        items: getPage(msg.list, msg.search, msg.page)
      });
    }

    /* ===== FULL HASH CHECK (PREFIX-BASED) ===== */
    if (msg.type === 'CHECK_HASH') {
      const full = getList(msg.list, msg.search);

      const prefix = full.slice(0, msg.count);
      const serverHash = hash(prefix);

      send(ws, {
        type: 'HASH_RESULT',
        list: msg.list,
        same: serverHash === msg.hash,
        total: full.length,
        search: msg.search,
        pages: Math.ceil(full.length / PAGE_SIZE)
      });
    }

    /* ===== PAGE HASH CHECK ===== */

    if (msg.type === 'CHECK_PAGE') {
      const { list, search, page, hash: clientHash } = msg;
      const pageData = getPage(list, search, page);
      const serverHash = hash(pageData);

      if (serverHash !== clientHash) {
        send(ws, {
          type: 'PAGE_DATA',
          list,
          page,
          items: pageData
        });
      }
    }

    /* ===== ACTIONS ===== */

    if (msg.type === 'SELECT')
      enqueue({ key: `S_${msg.id}`, type: 'SELECT', id: msg.id });

    if (msg.type === 'DESELECT')
      enqueue({ key: `D_${msg.id}`, type: 'DESELECT', id: msg.id });

    if (msg.type === 'REORDER')
      enqueue({
        key: 'R',
        type: 'REORDER',
        orderedIds: msg.orderedIds
      });

    if (msg.type === 'ADD')
      enqueueAdd({ key: `A_${msg.id}`, type: 'ADD', id: msg.id });
  });
});

console.log('WS backend (prefix hash aware) on :3001');
