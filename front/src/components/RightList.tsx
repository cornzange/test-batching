import { useState, useMemo, useEffect } from 'react';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';
import { throttle } from '../utils';

type Props = {
    items: number[];                 // все элементы, уже загруженные
    loaded: Set<number>;             // какие страницы уже загружены
    loadPage: (page: number) => void; // функция запроса страницы
    send: (msg: any) => void;       // WS для REORDER/DESELECT
    search: string;
    setSearch: (search: string) => void;
};

export default function RightList({ items, send, loaded, loadPage, search, setSearch }: Props) {
    const PAGE_SIZE = 20;
    const LOAD_THRESHOLD = 150;

    const [localSearch, setLocalSearch] = useState(search);

    const filteredItems = useMemo(
        () => items.filter(i => i.toString().includes(localSearch)),
        [items, localSearch]
    );


    useEffect(() => {
        // при изменении search начинаем загрузку заново
        console.log("load page")
        loadPage(0); // первая загрузка
    }, [search]);

    // lazy loading страниц при скролле
    const handleScroll = throttle((e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;

        if (distanceToBottom < LOAD_THRESHOLD) {
            const nextPage = Math.floor(items.length / PAGE_SIZE);
            if (!loaded.has(nextPage)) {
                loaded.add(nextPage);
                loadPage(nextPage);
            }
        }
    }, 500);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = items.indexOf(active.id as number);
        const newIndex = items.indexOf(over.id as number);
        if (oldIndex === -1 || newIndex === -1) return;

        const newOrder = arrayMove(items, oldIndex, newIndex);
        send({ type: 'REORDER', orderedIds: newOrder });
    };

    const handleDeselect = (id: number) => {
        send({ type: 'DESELECT', id });
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setLocalSearch(value);
        setSearch(value); // sync с App
    };

    return (
        <div style={{ flex: 1 }}>
            <h3>Right</h3>
            <input
                value={localSearch}
                onChange={handleSearchChange}
                placeholder="Search..."
            />

            <div
                style={{ height: 300, overflow: 'auto', border: '1px solid #ccc', padding: 5 }}
                onScroll={handleScroll}
            >
                <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={items} strategy={verticalListSortingStrategy}>
                        {filteredItems.map(id => (
                            <div
                                key={id}
                                style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}
                            >
                                <SortableItem id={id} />
                                <button onClick={() => handleDeselect(id)}>−</button>
                            </div>
                        ))}
                    </SortableContext>
                </DndContext>
            </div>
        </div>
    );
}
