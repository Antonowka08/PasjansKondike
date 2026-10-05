import React from 'react';
import { Undo2, Sparkles, Volume2, VolumeX, BarChart2, HelpCircle, RotateCcw, Play } from 'lucide-react';
import { formatTime } from '../utils/cardUtils';

interface TopBarProps {
  score: number;
  moves: number;
  time: number;
  drawMode: 1 | 3;
  canUndo: boolean;
  soundEnabled: boolean;
  isAutoFinishAvailable: boolean;
  onUndo: () => void;
  onHint: () => void;
  onAutoFinish: () => void;
  onNewGame: (drawMode?: 1 | 3) => void;
  onRestart: () => void;
  onToggleSound: () => void;
  onOpenStats: () => void;
  onOpenRules: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  score,
  moves,
  time,
  drawMode,
  canUndo,
  soundEnabled,
  isAutoFinishAvailable,
  onUndo,
  onHint,
  onAutoFinish,
  onNewGame,
  onRestart,
  onToggleSound,
  onOpenStats,
  onOpenRules,
}) => {
  return (
    <header className="w-full bg-white border-b border-zinc-200/90 sticky top-0 z-30 px-3 sm:px-6 py-2.5 sm:py-3 transition-colors">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* ZONE 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-lg sm:text-xl font-semibold tracking-tight text-zinc-900 select-none">
            Pasjans
          </span>

          {/* Segmented Control for Draw 1 / Draw 3 (Apple macOS / iOS style) */}
          <div className="hidden md:flex items-center p-0.5 bg-zinc-100 rounded-lg border border-zinc-200/70 text-xs font-medium">
            <button
              onClick={() => onNewGame(1)}
              className={`px-2.5 py-1 rounded-md transition-all ${
                drawMode === 1
                  ? 'bg-white text-zinc-900 shadow-sm font-semibold'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              1 karta
            </button>
            <button
              onClick={() => onNewGame(3)}
              className={`px-2.5 py-1 rounded-md transition-all ${
                drawMode === 3
                  ? 'bg-white text-zinc-900 shadow-sm font-semibold'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              3 karty
            </button>
          </div>
        </div>

        {/* ZONE 2: Clean unboxed stats with typographic separators */}
        <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm font-medium text-zinc-600 select-none">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400 text-xs font-normal">Czas</span>
            <span className="font-mono tabular-nums text-zinc-900 font-semibold">
              {formatTime(time)}
            </span>
          </div>

          <span className="text-zinc-300 font-normal" aria-hidden="true">·</span>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400 text-xs font-normal">Ruchy</span>
            <span className="font-mono tabular-nums text-zinc-900 font-semibold">
              {moves}
            </span>
          </div>

          <span className="text-zinc-300 font-normal" aria-hidden="true">·</span>

          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400 text-xs font-normal">Wynik</span>
            <span className="font-mono tabular-nums text-zinc-900 font-semibold">
              {score}
            </span>
          </div>
        </div>

        {/* ZONE 3: Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Auto-finish button when puzzle is solved */}
          {isAutoFinishAvailable && (
            <button
              onClick={onAutoFinish}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm animate-pulse whitespace-nowrap"
              title="Automatycznie dokończ grę"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Dokończ</span>
            </button>
          )}

          {/* Hint button */}
          <button
            onClick={onHint}
            className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors flex items-center gap-1"
            title="Podpowiedź"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="hidden md:inline">Podpowiedź</span>
          </button>

          {/* Undo button */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
              canUndo
                ? 'text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100'
                : 'text-zinc-300 cursor-not-allowed'
            }`}
            title="Cofnij ostatni ruch"
          >
            <Undo2 className="w-4 h-4" />
            <span className="hidden md:inline">Cofnij</span>
          </button>

          {/* Sound toggle */}
          <button
            onClick={onToggleSound}
            className="p-1.5 sm:p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
            title={soundEnabled ? 'Wycisz dźwięki' : 'Włącz dźwięki'}
            aria-label={soundEnabled ? 'Dźwięk włączony' : 'Dźwięk wyłączony'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4 text-zinc-400" />
            )}
          </button>

          {/* Stats modal button */}
          <button
            onClick={onOpenStats}
            className="p-1.5 sm:p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
            title="Statystyki"
            aria-label="Statystyki"
          >
            <BarChart2 className="w-4 h-4" />
          </button>

          {/* Rules modal button */}
          <button
            onClick={onOpenRules}
            className="p-1.5 sm:p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
            title="Zasady gry"
            aria-label="Zasady gry"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* New Game Button */}
          <button
            onClick={() => onNewGame()}
            className="ml-1 px-3 py-1.5 text-xs font-semibold text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors whitespace-nowrap shadow-sm"
          >
            Nowa gra
          </button>
        </div>
      </div>
    </header>
  );
};
