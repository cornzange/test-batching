import { useEffect, useMemo, useRef, useState } from 'react';
import { debounce, throttle } from '../utils';

type Props = {
    items: number[],
    send: (msg: any) => void,
    selectedItems: number[],
    search: string,
    setSearch: (search: string) => void
    setOpen: (flag: boolean) => void
}
export default function LeftList({ items, send, selectedItems, search, setSearch, setOpen }: Props) {
    const [offset, setOffset] = useState(0);

    // Keep latest search in a ref to avoid stale closures inside throttled handler
    const searchRef = useRef(search);
    useEffect(() => {
        searchRef.current = search;
    }, [search]);

    useEffect(() => {
        // when search changes, trigger initial load with zero offset
        load(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    function load(isZeroOffset = false) {
        if (isZeroOffset) {
            setOffset(0);
            send({ type: 'FETCH', list: 'left', search: searchRef.current, offset: 0 });
            return;
        }
        // Use functional update so we don't depend on captured "offset"
        setOffset(prev => {
            const next = prev + 20;
            send({ type: 'FETCH', list: 'left', search: searchRef.current, offset: next });
            return next;
        });
    }

    const LOAD_THRESHOLD = 150;

    // Create throttled scroll handler once. It reads latest search via ref and uses
    // functional setState, so it remains correct across renders.
    const throttledHandleScroll = useMemo(() => throttle((e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        if (distanceToBottom < LOAD_THRESHOLD) {
            load();
        }
    }, 500), []);

    const filteredItems = items.filter(item => !selectedItems.includes(item))

    const handleSearch = (e: any) => {
        const value = e.target.value;
        setSearch(value);
        setOffset(0);
        // Use ref to ensure the dispatched search matches the input value immediately
        searchRef.current = value;
        send({ type: 'FETCH', list: 'left', search: value, offset: 0 });
    }

    return (
        <div>
            <h3>Left</h3>
            <input value={search} onChange={handleSearch} />

            <div onScroll={throttledHandleScroll} style={{ height: 300, overflow: 'auto' }}>
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
