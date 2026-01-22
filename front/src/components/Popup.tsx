import { type FC, useState, type ChangeEvent } from "react";

interface PopupProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (value: number) => void;
}
const styles: Record<string, React.CSSProperties> = {
    overlay: {
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    popup: {
        background: "gray",
        padding: 20,
        borderRadius: 8,
        minWidth: 300,
    },
    input: {
        padding: 8,
        marginBottom: 12,
    },
    buttons: {
        display: "flex",
        gap: 8,
        justifyContent: "flex-start",
    },
};


const Popup: FC<PopupProps> = ({ isOpen, onClose, onSubmit }) => {
    const [value, setValue] = useState<string>("");

    if (!isOpen) return null;

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value);
    };

    const handleSubmit = () => {
        const numberValue = Number(value);

        if (isNaN(numberValue)) {
            alert("Введите корректное число");
            return;
        }

        onSubmit(numberValue);
        setValue("");
        onClose();
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.popup}>
                <h3>Введите число</h3>

                <input
                    type="number"
                    value={value}
                    onChange={handleChange}
                    style={styles.input}
                />

                <div style={styles.buttons}>
                    <button onClick={handleSubmit}>Отправить</button>
                    <button onClick={onClose}>Отмена</button>
                </div>
            </div>
        </div>
    );
};

export default Popup;