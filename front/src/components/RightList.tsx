import { DndContext, type DragEndEvent, closestCenter } from '@dnd-kit/core';
import { useState } from 'react';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
    arrayMove,
} from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';

export default function RightList({ items, send, setItems }: { items: number[], send: (msg: any) => void, setItems: any }) {
    const [search, setSearch] = useState('');
    function handleDragEnd(event: any) {
        const { active, over } = event;

        if (!over) return;

        if (active.id !== over.id) {
            setItems((items: any) => {
                const oldIndex = items.indexOf(active.id);
                const newIndex = items.indexOf(over.id);
                const newOrder = arrayMove<number>(items, oldIndex, newIndex);
                send({ type: 'REORDER', orderedIds: newOrder });
                return newOrder
            });

        }
    }
    const deselect = (id: number) => {
        send({ type: 'DESELECT', id })
    }
    const filteredItems = items.filter(item => item.toString().includes(search))
    return (<div>
        <h3>Right</h3>
        <input value={search} onChange={(e) => setSearch(e.target.value)} />

        <div style={{ height: 300, overflow: 'auto' }}>
            <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={items} strategy={verticalListSortingStrategy}>
                    {filteredItems.map((id) => (
                        <div style={{ display: "flex" }}>
                            <SortableItem key={id} id={id} />
                            <button onClick={() => deselect(id)}>-</button>
                        </div>
                    ))}
                </SortableContext>
            </DndContext>
        </div>
    </div>
    );
}
