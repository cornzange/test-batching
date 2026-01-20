import { useEffect, useState } from 'react';
import LeftList from './components/LeftList';
import RightList from './components/RightList';
import { socket } from './socket';

const mergeUnique = (a: number[], b: number[]) => Array.from(new Set([...a, ...b]));

export default function App() {
  const [leftItems, setLeftItems] = useState<number[]>([])
  const [rightItems, setRightItems] = useState<number[]>([])
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      const data: { type: string, selectedItems: number[], list: string, offset: number, items: number[], search: string } = JSON.parse(event.data);
      if (data.type === 'STATE') {
        setRightItems(data.selectedItems);
      }
      if (data.type === 'ITEMS' && data.list === 'left') {
        if (data?.offset === 0) {
          setLeftItems(data.items);
        } else {
          setLeftItems(prev => mergeUnique(prev, data.items));
        }
      }
    };

    socket.addEventListener('message', handleMessage);

    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket]);

  const send = (msg: any) => {
    socket.send(JSON.stringify(msg));
  };
  return (
    <div style={{ display: 'flex', gap: 20, padding: 20 }}>
      {socket.readyState === WebSocket.OPEN ? <LeftList items={leftItems} selectedItems={rightItems} send={send} search={search} setSearch={setSearch} /> : "connecting"}
      {socket.readyState === WebSocket.OPEN ? <RightList items={rightItems} send={send} setItems={setRightItems} /> : "connecting"}
    </div>
  );
}
