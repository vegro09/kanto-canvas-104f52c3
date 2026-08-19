import { Plus } from "lucide-react";

interface AddNodeButtonProps {
  onClick: () => void;
}

export default function AddNodeButton({ onClick }: AddNodeButtonProps) {
  return (
    <div className="pointer-events-none fixed bottom-8 left-0 right-0 z-20 flex flex-col items-center select-none">
      <button
        type="button"
        onClick={onClick}
        aria-label="Add new node"
        className="pointer-events-auto flex items-center gap-2 rounded-full border border-[#F5F5DC] bg-[#000000] px-6 py-3.5 text-[#FFFFFF] shadow-2xl transition-all duration-200 hover:bg-[#F5F5DC] hover:text-[#000000] hover:scale-105 active:scale-95 group"
      >
        <Plus size={15} strokeWidth={2.2} className="transition-transform group-hover:rotate-90" />
        <span className="font-sans text-xs font-semibold uppercase tracking-[0.24em]">
          + ADD NODE
        </span>
      </button>
    </div>
  );
}
