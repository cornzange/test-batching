interface ItemProps {
  id: number;
  onClick: (id: number) => void;
  actionLabel: string;
}

export default function Item({ id, onClick, actionLabel }: ItemProps) {
  return (
    <div
      style={{
        padding: 8,
        borderBottom: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between'
      }}
    >
      <span>ID: {id}</span>
      <button onClick={() => onClick(id)}>{actionLabel}</button>
    </div>
  );
}
