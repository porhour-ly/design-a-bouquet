"use client";

import { motion } from "framer-motion";

const FLOWERS = ["🌸", "🌷", "🌹", "🌻", "🌺", "💐"];

interface FlowerPickerProps {
  onSelect: (type: string) => void;
}

export default function FlowerPicker({ onSelect }: FlowerPickerProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-6 pt-3 pointer-events-none">
      <div className="flex gap-2 rounded-full bg-white/80 backdrop-blur-sm px-4 py-2 shadow-lg pointer-events-auto">
        {FLOWERS.map((flower) => (
          <motion.button
            key={flower}
            whileTap={{ scale: 0.85 }}
            onTap={() => onSelect(flower)}
            className="text-4xl p-1 active:bg-black/5 rounded-full transition-colors"
          >
            {flower}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
