import { Mic } from "lucide-react";

export default function RecordButton({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="pointer-events-none fixed bottom-10 left-0 right-0 z-20 flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={active}
        aria-label={active ? "Stop recording" : "Start recording"}
        className={`pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full bg-background transition-colors duration-200 ${
          active ? "border border-foreground" : "border border-brand"
        }`}
      >
        <Mic
          className="text-foreground"
          size={22}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </button>
      <span className="font-sans text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
        {active ? "Listening" : "Hold a thought"}
      </span>
    </div>
  );
}
