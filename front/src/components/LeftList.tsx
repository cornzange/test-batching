import { useEffect, useMemo, useRef, useState } from 'react';
import { throttle } from '../utils';

type Props = {
    items: number[];
    send: (msg: any) => void;
    loaded: Set<number>;      // какие страницы уже загружены
    loadPage: (page: number) => void; // функция для запроса страницы с бэка
    search: string;
    setSearch: (search: string) => void;
};

export default function LeftList({ items, send, loaded, loadPage, search, setSearch }: Props) {

    // // Ref для последнего search, чтобы throttle работал корректно
    // const searchRef = useRef(search);
    // useEffect(() => {
    //     searchRef.current = search;
    // }, [search]);

    useEffect(() => {
        // при изменении search начинаем загрузку заново
        loadPage(0); // первая загрузка
    }, [search]);

    const PAGE_SIZE = 20;
    const LOAD_THRESHOLD = 150;

    const throttledScroll = useMemo(
        () =>
            throttle((e: React.UIEvent<HTMLDivElement>) => {
                const el = e.currentTarget;
                const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;

                if (distanceToBottom < LOAD_THRESHOLD) {
                    const nextPage = Math.floor(items.length / PAGE_SIZE);
                    if (!loaded.has(nextPage)) {
                        loaded.add(nextPage);
                        loadPage(nextPage);
                    }
                }
            }, 500),
        [items.length, loaded, loadPage]
    );

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearch(value);
    };

    const filteredItems = items; // Здесь фильтруем на фронте по search можно, если нужно

    return (
        <div style={{ flex: 1 }}>
            <h3>Left</h3>
            <input value={search} onChange={handleSearch} placeholder="Search..." />

            <div
                style={{ height: 300, overflow: 'auto', border: '1px solid #ccc', padding: 5 }}
                onScroll={throttledScroll}
            >
                {filteredItems.map((id) => (
                    <div key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                        <span>{id}</span>
                        <button onClick={() => send({ type: 'SELECT', id })}>+</button>
                    </div>
                ))}
            </div>
        </div>
    );
}
