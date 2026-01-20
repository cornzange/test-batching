import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';

export default function RightList({ items, send, setItems }: { items: number[], send: (msg: any) => void, setItems: (items: number[]) => void }) {

    function onDragEnd(e: DragEndEvent) {
        if (!e.over) return;
        const oldIndex = items.indexOf(e.active.id as number);
        const newIndex = items.indexOf(e.over.id as number);
        const next = arrayMove(items, oldIndex, newIndex);
        setItems(next);
        send({ type: 'REORDER', orderedIds: next });
    }

    return (
        <DndContext onDragEnd={onDragEnd}>
            <h3>Right</h3>
            {items.map(id => (
                <div key={id}>
                    {id}
                    <button onClick={() => send({ type: 'DESELECT', id })}>x</button>
                </div>
            ))}
        </DndContext>
    );
}
