import React from 'react';
import { X, Award, Flame, Clock, Play } from 'lucide-react';
import { GameStats } from '../types/solitaire';
import { formatTime } from '../utils/cardUtils';

interface StatsModalProps {
  isOpen: boolean;
  stats: GameStats;
  onClose: () => void;
  onResetStats: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  stats,
  onClose,
  onResetStats,
}) => {
  if (!isOpen) return null;

  const winRate =
    stats.gamesPlayed > 0
      ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
      : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl border border-zinc-200/90 shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
          aria-label="Zamknij"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-lg font-bold tracking-tight text-zinc-900 mb-4">
          Statystyki gier
        </h3>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/60 flex flex-col">
            <span className="text-xs text-zinc-400 font-medium">Rozegrane gry</span>
            <span className="text-xl font-bold text-zinc-900 font-mono tabular-nums mt-1">
              {stats.gamesPlayed}
            </span>
          </div>

          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/60 flex flex-col">
            <span className="text-xs text-zinc-400 font-medium">Wygrane gry</span>
            <span className="text-xl font-bold text-emerald-600 font-mono tabular-nums mt-1">
              {stats.gamesWon}
            </span>
          </div>

          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/60 flex flex-col">
            <span className="text-xs text-zinc-400 font-medium">% Zwycięstw</span>
            <span className="text-xl font-bold text-zinc-900 font-mono tabular-nums mt-1">
              {winRate}%
            </span>
          </div>

          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/60 flex flex-col">
            <span className="text-xs text-zinc-400 font-medium">Rekord punktowy</span>
            <span className="text-xl font-bold text-zinc-900 font-mono tabular-nums mt-1">
              {stats.bestScore}
            </span>
          </div>

          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/60 flex flex-col">
            <span className="text-xs text-zinc-400 font-medium">Najlepszy czas</span>
            <span className="text-xl font-bold text-zinc-900 font-mono tabular-nums mt-1">
              {stats.bestTime !== null ? formatTime(stats.bestTime) : '--:--'}
            </span>
          </div>

          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200/60 flex flex-col">
            <span className="text-xs text-zinc-400 font-medium">Najdłuższa seria</span>
            <span className="text-xl font-bold text-amber-600 font-mono tabular-nums mt-1">
              {stats.bestStreak}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
          <button
            onClick={() => {
              if (window.confirm('Czy na pewno chcesz wyczyścić statystyki?')) {
                onResetStats();
              }
            }}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium transition-colors"
          >
            Resetuj statystyki
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
          >
            Gotowe
          </button>
        </div>
      </div>
    </div>
  );
};
