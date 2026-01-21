import { useSortable } from "@dnd-kit/sortable";
import { CSS } from '@dnd-kit/utilities';

export function SortableItem({ id }: { id: number }) {
    const { attributes, listeners, setNodeRef, transform, transition } =
        useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <p ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {id}
        </p>
    );
}