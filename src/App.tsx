import React, { useState, useEffect } from 'react';
import { useSolitaire } from './hooks/useSolitaire';
import { TopBar } from './components/TopBar';
import { GameBoard } from './components/GameBoard';
import { VictoryModal } from './components/VictoryModal';
import { StatsModal } from './components/StatsModal';
import { RulesModal } from './components/RulesModal';
import { Sparkles, X } from 'lucide-react';

export default function App() {
  const {
    state,
    stats,
    selectedLocation,
    hint,
    isAutoFinishAvailable,
    soundEnabled,
    startNewGame,
    restartGame,
    drawCards,
    handleCardClick,
    handleDoubleClick,
    handleEmptySlotClick,
    executeMove,
    undo,
    triggerHint,
    startAutoFinish,
    toggleSound,
    clearHint,
  } = useSolitaire();

  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  // Keyboard shortcuts (Cmd+Z or U for undo, H for hint, D for draw, N for new game)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is in an input or modal is open
      if (isStatsOpen || isRulesOpen) {
        if (e.key === 'Escape') {
          setIsStatsOpen(false);
          setIsRulesOpen(false);
        }
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      } else if (e.key.toLowerCase() === 'u') {
        undo();
      } else if (e.key.toLowerCase() === 'h') {
        triggerHint();
      } else if (e.key.toLowerCase() === 'd' || e.key === ' ') {
        e.preventDefault();
        drawCards();
      } else if (e.key.toLowerCase() === 'n') {
        startNewGame();
      } else if (e.key === 'Escape') {
        clearHint();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, triggerHint, drawCards, startNewGame, clearHint, isStatsOpen, isRulesOpen]);

  const handleResetStats = () => {
    localStorage.removeItem('pasjans_apple_stats');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col antialiased selection:bg-zinc-200">
      {/* Apple-style Top Bar */}
      <TopBar
        score={state.score}
        moves={state.moves}
        time={state.time}
        drawMode={state.drawMode}
        canUndo={state.history.length > 0}
        soundEnabled={soundEnabled}
        isAutoFinishAvailable={isAutoFinishAvailable}
        onUndo={undo}
        onHint={triggerHint}
        onAutoFinish={startAutoFinish}
        onNewGame={startNewGame}
        onRestart={restartGame}
        onToggleSound={toggleSound}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
      />

      {/* Active Hint Banner (Apple quiet toast) */}
      {hint && (
        <div className="w-full bg-amber-50/90 border-b border-amber-200/80 px-4 py-2 flex items-center justify-between text-xs text-amber-900 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="font-medium">{hint.description}</span>
            </div>
            <button
              onClick={clearHint}
              className="p-1 text-amber-700 hover:text-amber-900 rounded-md transition-colors"
              aria-label="Zamknij podpowiedź"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Solitaire Game Area */}
      <main className="flex-1 flex flex-col items-center justify-start pt-3 sm:pt-6 pb-12 w-full overflow-x-hidden">
        <GameBoard
          state={state}
          selectedLocation={selectedLocation}
          hint={hint}
          onCardClick={handleCardClick}
          onDoubleClick={handleDoubleClick}
          onEmptySlotClick={handleEmptySlotClick}
          onStockClick={drawCards}
          onMoveCards={executeMove}
        />
      </main>

      {/* Minimal Footer */}
      <footer className="w-full border-t border-zinc-100 py-3 text-center text-xs text-zinc-400 select-none">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <span className="text-[11px]">Pasjans Klondike</span>
          <div className="flex items-center gap-3 text-[11px] text-zinc-500">
            <span>D: Dobierz</span>
            <span aria-hidden="true">·</span>
            <span>U: Cofnij</span>
            <span aria-hidden="true">·</span>
            <span>H: Podpowiedź</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <VictoryModal
        isOpen={state.isWon}
        score={state.score}
        moves={state.moves}
        time={state.time}
        onPlayAgain={() => startNewGame()}
      />

      <StatsModal
        isOpen={isStatsOpen}
        stats={stats}
        onClose={() => setIsStatsOpen(false)}
        onResetStats={handleResetStats}
      />

      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />
    </div>
  );
}
