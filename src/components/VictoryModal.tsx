import React from 'react';
import { Trophy, Clock, CheckCircle2, RotateCcw } from 'lucide-react';
import { formatTime } from '../utils/cardUtils';

interface VictoryModalProps {
  isOpen: boolean;
  score: number;
  moves: number;
  time: number;
  onPlayAgain: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  score,
  moves,
  time,
  onPlayAgain,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs select-none">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-zinc-200/90 shadow-2xl p-6 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Apple-style celebration badge */}
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-600 mb-4">
          <Trophy className="w-7 h-7" />
        </div>

        <h2 className="text-xl font-bold tracking-tight text-zinc-900 mb-1">
          Gratulacje!
        </h2>
        <p className="text-xs text-zinc-500 mb-6">
          Wszystkie 52 karty trafiły na pola bazowe.
        </p>

        {/* Clean Unboxed Stats */}
        <div className="w-full grid grid-cols-3 gap-2 p-3 bg-zinc-50 rounded-xl border border-zinc-200/60 mb-6">
          <div className="flex flex-col items-center">
            <span className="text-[11px] text-zinc-400 font-medium mb-0.5">Czas</span>
            <span className="text-sm font-semibold text-zinc-900 font-mono tabular-nums">
              {formatTime(time)}
            </span>
          </div>

          <div className="flex flex-col items-center border-x border-zinc-200/60">
            <span className="text-[11px] text-zinc-400 font-medium mb-0.5">Ruchy</span>
            <span className="text-sm font-semibold text-zinc-900 font-mono tabular-nums">
              {moves}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[11px] text-zinc-400 font-medium mb-0.5">Wynik</span>
            <span className="text-sm font-semibold text-zinc-900 font-mono tabular-nums">
              {score}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onPlayAgain}
          className="w-full py-2.5 px-4 text-sm font-medium text-white bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <RotateCcw className="w-4 h-4" />
          Zagraj ponownie
        </button>
      </div>
    </div>
  );
};
