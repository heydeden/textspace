interface ConfirmModalProps {
  show: boolean;
  title: string;
  msg: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ show, title, msg, confirmLabel, danger, onConfirm, onCancel }: ConfirmModalProps) {
  if (!show) return null;
  // ignore the second click of a double-click: the menu behind may still be
  // closing and the dblclick could land on this button unintentionally
  const handleConfirm = (e: React.MouseEvent) => {
    if (e.detail > 1) return;
    onConfirm();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onCancel}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
        <p className="text-zinc-400 text-sm mb-6">{msg}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-5 py-2 rounded-xl text-sm text-zinc-300 border border-zinc-700 hover:bg-zinc-800 transition">Cancel</button>
          <button onClick={handleConfirm} className={`px-5 py-2 rounded-xl text-sm text-white font-medium transition ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
