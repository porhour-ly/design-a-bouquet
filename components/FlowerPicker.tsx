"use client";

const FLOWERS = ["🌸", "🌷", "🌹", "🌻", "🌺", "💐"];

interface FlowerPickerProps {
  onSelect: (type: string) => void;
}

export default function FlowerPicker({ onSelect }: FlowerPickerProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex gap-2 rounded-full bg-white/80 backdrop-blur-sm px-4 py-2 shadow-lg">
      {FLOWERS.map((flower) => (
        <button
          key={flower}
          onClick={() => onSelect(flower)}
          className="text-4xl p-1 rounded-full transition-transform active:scale-90"
        >
          {flower}
        </button>
      ))}
    </div>
  );
}
