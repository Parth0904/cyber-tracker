type Props = {
  open: boolean;

  onClose: () => void;

  children: React.ReactNode;
};

export default function HistoryModal({
  open,
  onClose,
  children,
}: Props) {

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

      <div className="bg-slate-900 rounded-xl p-8 max-w-3xl w-full">

        <button
          onClick={onClose}
          className="mb-4"
        >
          Close
        </button>

        {children}

      </div>

    </div>
  );
}