import { useEffect, useRef, useState } from 'react';
import LeftList from './components/LeftList';
import RightList from './components/RightList';
import Popup from './components/Popup';
import { socket } from './socket';

/* ================= TYPES ================= */

type PageMap = Map<number, number[]>;

/* ================= UTILS ================= */

function flattenPages(pages: PageMap) {
  return Array.from(pages.entries())
    .sort(([a], [b]) => a - b)
    .flatMap(([, items]) => items);
}

/* ================= HASH ================= */
/* тот же алгоритм, что и на бэке */

async function hash(data: any) {
  const buf = await crypto.subtle.digest(
    'SHA-1',
    new TextEncoder().encode(JSON.stringify(data))
  );
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/* ================= APP ================= */

export default function App() {
  const [leftPages, setLeftPages] = useState<PageMap>(new Map());
  const [rightPages, setRightPages] = useState<PageMap>(new Map());

  const [popupOpen, setPopupOpen] = useState(false);

  const leftLoaded = useRef<Set<number>>(new Set());
  const rightLoaded = useRef<Set<number>>(new Set());

  const [leftSearch, setLeftSearch] = useState('');
  const [rightSearch, setRightSearch] = useState('');

  const leftSearchRef = useRef('');
  const rightSearchRef = useRef('');

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  const getItems = (list: "left" | "right", page: number) => {
    const pages = list === "left" ? leftPages : rightPages
    return pages.get(page)
  }

  /* ================= SYNC search -> ref ================= */

  useEffect(() => {
    leftSearchRef.current = leftSearch;
  }, [leftSearch]);

  useEffect(() => {
    rightSearchRef.current = rightSearch;
  }, [rightSearch]);

  /* ================= WS ================= */

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3001');
    setSocket(ws);
    const onOpen = () => setConnected(true);
    const onClose = () => setConnected(false);
    const onMessage = async (e: MessageEvent) => {
      const msg = JSON.parse(e.data);

      /* ===== LIST UPDATED ===== */

      if (msg.type === 'LIST_UPDATED') {
        console.log("LIST_UPDATED", msg)
        sync(ws, msg.list);
      }

      /* ===== FULL HASH RESULT ===== */

      if (msg.type === 'HASH_RESULT') {
        const loaded =
          msg.list === 'left'
            ? leftLoaded.current
            : rightLoaded.current;


        if (msg.same) return;

        // проверяем ТОЛЬКО загруженные страницы
        for (const page of loaded) {
          ws.send(
            JSON.stringify({
              type: 'CHECK_PAGE',
              list: msg.list,
              page,
              search: msg.search,
              hash: await hash(getItems(msg.list, page))
            })
          );
        }
      }

      /* ===== PAGE DATA ===== */

      if (msg.type === 'PAGE_DATA') {
        const setter = msg.list === 'left' ? setLeftPages : setRightPages;
        setter(prev => {
          const next = new Map(prev);
          next.set(msg.page, msg.items);
          return next;
        });
      }

      /* ===== INITIAL PAGE FETCH ===== */

      if (msg.type === 'ITEMS') {
        const setter = msg.list === 'left' ? setLeftPages : setRightPages;
        const loaded =
          msg.list === 'left'
            ? leftLoaded.current
            : rightLoaded.current;

        setter(prev => {
          const next = new Map(prev);
          next.set(msg.page, msg.items);
          return next;
        });

        loaded.add(msg.page);
      }
    };

    ws.addEventListener('open', onOpen);
    ws.addEventListener('close', onClose);
    ws.addEventListener('message', onMessage);

    return () => ws.close();
  }, []);

  /* ================= SYNC ================= */

  const sync = async (ws: WebSocket, list: 'left' | 'right') => {
    const pages = list === 'left' ? leftPages : rightPages;
    const items = flattenPages(pages);
    ws.send(
      JSON.stringify({
        type: 'CHECK_HASH',
        list,
        search: list === "left" ? leftSearchRef.current : rightSearchRef.current,
        count: items.length,
        hash: "await hash(items)"
      })
    );
  }

  /* ================= ACTIONS ================= */

  const send = (msg: any) => {
    if (!socket) {
      console.log("socket is", socket)
      return
    }
    socket.send(JSON.stringify(msg));
    if (msg.type === 'SELECT') {
      socket.send(JSON.stringify({ type: 'FETCH', list: 'right', page: 0, search: rightSearch }));
    }
  };

  const addElement = (id: number) => {
    send({ type: 'ADD', id });
    setPopupOpen(false);
  };

  /* ================= RENDER ================= */
  return (
    <div>
      <button onClick={() => setPopupOpen(true)}>
        Add element
      </button>

      <Popup
        isOpen={popupOpen}
        onClose={() => setPopupOpen(false)}
        onSubmit={addElement}
      />

      <div style={{ display: 'flex', gap: 20, padding: 20 }}>
        {connected ? <LeftList
          items={flattenPages(leftPages)}
          loadPage={(page: number) =>
            send({ type: 'FETCH', list: 'left', page, search: leftSearch })
          }
          loaded={leftLoaded.current}
          send={send}
          search={leftSearch}
          setSearch={setLeftSearch}
        /> : "connecting"}

        {connected ? <RightList
          items={flattenPages(rightPages)}
          loadPage={(page: number) =>
            send({ type: 'FETCH', list: 'right', page, search: rightSearch })
          }
          loaded={rightLoaded.current}
          send={send}
          search={rightSearch}
          setSearch={setRightSearch}
        /> : "connecting"}
      </div>
    </div>
  );
}
