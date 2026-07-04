type Props = {
  isSaved: boolean;
  onSave: () => void;
};

export default function SaveBar({
  isSaved,
  onSave,
}: Props) {
  return (
    <div className="
    sticky
    bottom-6
    z-20
    flex
    justify-end
    mt-8
    ">

      <button
        onClick={onSave}
        className={`
        rounded-2xl
        px-8
        py-4
        font-bold
        shadow-xl
        transition-all
        ${
          isSaved
            ? "bg-emerald-500 text-white"
            : "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
        }
        `}
      >

        {isSaved
          ? "✓ Saved"
          : "Save Today's Log"}

      </button>

    </div>
  );
}