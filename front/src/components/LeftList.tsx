import { useEffect, useState } from 'react';

export default function LeftList({ items, send, selectedItems }: { items: number[], send: (msg: any) => void, selectedItems: number[] }) {
    const [search, setSearch] = useState('');
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        // setItems([])
        // setOffset(0)
        load(true)
    }, [search]);

    function load(isZeroOffset = false) {
        const next = offset + 20;
        setOffset(next);
        send({ type: 'FETCH', list: 'left', search, offset: isZeroOffset ? 0 : next });
    }

    const LOAD_THRESHOLD = 150;

    function handleScroll(e: React.UIEvent<HTMLDivElement>) {
        const el = e.currentTarget;

        const distanceToBottom =
            el.scrollHeight - el.scrollTop - el.clientHeight;

        if (distanceToBottom < LOAD_THRESHOLD) {
            load();
        }
    }

    const filteredItems = items.filter(item => !selectedItems.includes(item))

    const handleSearch = (e: any) => {
        setSearch(e.target.value)
        setOffset(0)
        send({ type: 'FETCH', list: 'left', search, offset: 0 });
    }

    return (
        <div>
            <h3>Left</h3>
            <input value={search} onChange={handleSearch} />
            <button onClick={() => send({ type: 'ADD', id: Date.now() })}>Add</button>

            <div onScroll={handleScroll} style={{ height: 300, overflow: 'auto' }}>
                {filteredItems.map(id => (
                    <div key={id}>
                        {id}
                        <button onClick={() => send({ type: 'SELECT', id })}>+</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
