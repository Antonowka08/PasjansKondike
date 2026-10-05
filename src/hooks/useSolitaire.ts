import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardLocation, GameStats, MoveAction, SolitaireState } from '../types/solitaire';
import {
  canAutoFinish,
  dealNewGame,
  findAutoMoveDestination,
  findHint,
  getNextAutoFinishMove,
  HintResult,
  isValidFoundationMove,
  isValidTableauMove,
} from '../utils/cardUtils';
import { sound } from '../utils/audio';

const STATS_KEY = 'pasjans_apple_stats';

const DEFAULT_STATS: GameStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  currentStreak: 0,
  bestStreak: 0,
  bestTime: null,
  bestScore: 0,
};

export function useSolitaire() {
  const [state, setState] = useState<SolitaireState>(() => dealNewGame(1));
  const [selectedLocation, setSelectedLocation] = useState<CardLocation | null>(null);
  const [hint, setHint] = useState<HintResult | null>(null);
  const [isAutoFinishing, setIsAutoFinishing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => sound.getSoundEnabled());

  // Statistics
  const [stats, setStats] = useState<GameStats>(() => {
    try {
      const saved = localStorage.getItem(STATS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_STATS;
  });

  const saveStats = useCallback((newStats: GameStats) => {
    setStats(newStats);
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
    } catch {
      // ignore
    }
  }, []);

  // Timer loop
  useEffect(() => {
    if (!state.isGameActive || state.isWon) return;

    const timer = setInterval(() => {
      setState((prev) => ({
        ...prev,
        time: prev.time + 1,
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [state.isGameActive, state.isWon]);

  // Check victory condition
  useEffect(() => {
    if (state.isWon) return;

    const totalInFoundations = state.foundations.reduce(
      (acc, pile) => acc + pile.length,
      0
    );

    if (totalInFoundations === 52) {
      sound.playVictory();
      setState((prev) => ({ ...prev, isWon: true }));

      // Record win stats
      saveStats({
        gamesPlayed: stats.gamesPlayed,
        gamesWon: stats.gamesWon + 1,
        currentStreak: stats.currentStreak + 1,
        bestStreak: Math.max(stats.bestStreak, stats.currentStreak + 1),
        bestTime:
          stats.bestTime === null
            ? state.time
            : Math.min(stats.bestTime, state.time),
        bestScore: Math.max(stats.bestScore, state.score),
      });
    }
  }, [state.foundations, state.isWon, state.time, state.score, stats, saveStats]);

  // Clear hint on state change
  const clearHint = useCallback(() => {
    setHint(null);
  }, []);

  // Start new game
  const startNewGame = useCallback((drawMode: 1 | 3 = state.drawMode) => {
    sound.playCardSlide();
    setSelectedLocation(null);
    setHint(null);
    setIsAutoFinishing(false);

    setState((prev) => {
      // Record loss if game was in progress with moves > 0
      if (!prev.isWon && prev.moves > 2) {
        setStats((curr) => {
          const updated = {
            ...curr,
            gamesPlayed: curr.gamesPlayed + 1,
            currentStreak: 0,
          };
          try {
            localStorage.setItem(STATS_KEY, JSON.stringify(updated));
          } catch {
            // ignore
          }
          return updated;
        });
      } else {
        setStats((curr) => {
          const updated = {
            ...curr,
            gamesPlayed: curr.gamesPlayed + 1,
          };
          try {
            localStorage.setItem(STATS_KEY, JSON.stringify(updated));
          } catch {
            // ignore
          }
          return updated;
        });
      }

      return dealNewGame(drawMode);
    });
  }, [state.drawMode]);

  // Restart current game (same mode, fresh board)
  const restartGame = useCallback(() => {
    startNewGame(state.drawMode);
  }, [startNewGame, state.drawMode]);

  // Stock click (Draw card)
  const drawCards = useCallback(() => {
    clearHint();
    setSelectedLocation(null);

    setState((prev) => {
      if (prev.stock.length === 0) {
        // Recycle waste back into stock
        if (prev.waste.length === 0) return prev;
        sound.playCardSlide();

        const newStock = [...prev.waste].reverse().map((c) => ({
          ...c,
          faceUp: false,
        }));

        const moveAction: MoveAction = {
          from: { pileType: 'waste' },
          to: { pileType: 'stock' },
          cards: [...prev.waste],
          previousWasteCards: [...prev.waste],
          scoreDelta: -20, // Small penalty on recycle
        };

        return {
          ...prev,
          stock: newStock,
          waste: [],
          moves: prev.moves + 1,
          score: Math.max(0, prev.score - 20),
          history: [...prev.history, moveAction],
          redoStack: [],
        };
      }

      // Draw 1 or 3 cards
      sound.playCardFlip();
      const count = Math.min(prev.drawMode, prev.stock.length);
      const drawn = prev.stock.slice(prev.stock.length - count).map((c) => ({
        ...c,
        faceUp: true,
      }));
      const remainingStock = prev.stock.slice(0, prev.stock.length - count);

      const moveAction: MoveAction = {
        from: { pileType: 'stock' },
        to: { pileType: 'waste' },
        cards: drawn,
        scoreDelta: 0,
      };

      return {
        ...prev,
        stock: remainingStock,
        waste: [...prev.waste, ...drawn],
        moves: prev.moves + 1,
        history: [...prev.history, moveAction],
        redoStack: [],
      };
    });
  }, [clearHint]);

  // Execute a valid move and handle score, history & card reveal
  const executeMove = useCallback((
    from: CardLocation,
    to: CardLocation,
    cards: Card[]
  ) => {
    clearHint();
    setSelectedLocation(null);

    setState((prev) => {
      let scoreDelta = 0;
      let turnedCardOver = false;

      // Copy collections
      const newFoundations = prev.foundations.map((f) => [...f]) as typeof prev.foundations;
      const newTableau = prev.tableau.map((t) => [...t]) as typeof prev.tableau;
      let newWaste = [...prev.waste];
      let newStock = [...prev.stock];

      // Remove cards from origin
      if (from.pileType === 'waste') {
        newWaste = newWaste.slice(0, newWaste.length - cards.length);
      } else if (from.pileType === 'tableau' && from.pileIndex !== undefined) {
        const col = newTableau[from.pileIndex];
        const startIdx = from.cardIndex ?? (col.length - cards.length);
        newTableau[from.pileIndex] = col.slice(0, startIdx);

        // Turn over top card of origin column if it was face down
        const remainingInCol = newTableau[from.pileIndex];
        if (remainingInCol.length > 0) {
          const topCard = remainingInCol[remainingInCol.length - 1];
          if (!topCard.faceUp) {
            topCard.faceUp = true;
            turnedCardOver = true;
            scoreDelta += 5; // Points for revealing card
            sound.playCardFlip();
          }
        }
      } else if (from.pileType === 'foundation' && from.pileIndex !== undefined) {
        newFoundations[from.pileIndex] = newFoundations[from.pileIndex].slice(
          0,
          newFoundations[from.pileIndex].length - cards.length
        );
        scoreDelta -= 15; // Penalty for moving card out of foundation
      }

      // Add cards to destination
      if (to.pileType === 'foundation' && to.pileIndex !== undefined) {
        newFoundations[to.pileIndex].push(...cards);
        scoreDelta += 10; // Points for foundation move
        sound.playFoundation(cards[0].rank);
      } else if (to.pileType === 'tableau' && to.pileIndex !== undefined) {
        newTableau[to.pileIndex].push(...cards);
        if (from.pileType === 'waste') {
          scoreDelta += 5; // Points for moving waste to tableau
        }
        sound.playCardPlace();
      }

      const moveAction: MoveAction = {
        from,
        to,
        cards,
        turnedCardOver,
        scoreDelta,
      };

      return {
        ...prev,
        stock: newStock,
        waste: newWaste,
        foundations: newFoundations,
        tableau: newTableau,
        score: Math.max(0, prev.score + scoreDelta),
        moves: prev.moves + 1,
        history: [...prev.history, moveAction],
        redoStack: [],
      };
    });
  }, [clearHint]);

  // Click / Auto-move single card
  const handleCardClick = useCallback((card: Card, location: CardLocation) => {
    clearHint();

    // If card is face-down in tableau:
    if (!card.faceUp) {
      if (location.pileType === 'tableau' && location.pileIndex !== undefined) {
        const col = state.tableau[location.pileIndex];
        // If it's the topmost card in column, flip it
        if (location.cardIndex === col.length - 1) {
          setState((prev) => {
            const newTableau = prev.tableau.map((t) => [...t]) as typeof prev.tableau;
            const c = newTableau[location.pileIndex!][location.cardIndex!];
            c.faceUp = true;
            sound.playCardFlip();
            return {
              ...prev,
              tableau: newTableau,
              score: prev.score + 5,
              moves: prev.moves + 1,
            };
          });
        }
      }
      return;
    }

    // If a card is already selected and user clicks this card/location:
    if (selectedLocation) {
      // If clicking same location, deselect
      if (
        selectedLocation.pileType === location.pileType &&
        selectedLocation.pileIndex === location.pileIndex &&
        selectedLocation.cardIndex === location.cardIndex
      ) {
        setSelectedLocation(null);
        return;
      }

      // Try to move previously selected card(s) onto this card's pile
      const fromCards = getCardsAtLocation(state, selectedLocation);
      if (fromCards.length > 0) {
        const cardToPlace = fromCards[0];

        // If target is a tableau column
        if (location.pileType === 'tableau' && location.pileIndex !== undefined) {
          const targetCol = state.tableau[location.pileIndex];
          if (isValidTableauMove(cardToPlace, targetCol)) {
            executeMove(selectedLocation, { pileType: 'tableau', pileIndex: location.pileIndex }, fromCards);
            return;
          }
        }

        // If target is a foundation
        if (location.pileType === 'foundation' && location.pileIndex !== undefined) {
          const targetPile = state.foundations[location.pileIndex];
          if (fromCards.length === 1 && isValidFoundationMove(cardToPlace, targetPile)) {
            executeMove(selectedLocation, { pileType: 'foundation', pileIndex: location.pileIndex }, fromCards);
            return;
          }
        }
      }
    }

    // Direct auto-move check! (Single-click / tap quick move)
    const cardsToMove = getCardsAtLocation(state, location);
    if (cardsToMove.length > 0) {
      const autoDest = findAutoMoveDestination(card, state, location);
      if (autoDest) {
        executeMove(location, autoDest.to, cardsToMove);
        return;
      }
    }

    // If no direct move found, select card for tap-to-move
    setSelectedLocation(location);
    sound.playTap();
  }, [clearHint, selectedLocation, state, executeMove]);

  // Click on empty slot
  const handleEmptySlotClick = useCallback((targetLocation: CardLocation) => {
    clearHint();

    if (!selectedLocation) {
      if (targetLocation.pileType === 'stock') {
        drawCards();
      }
      return;
    }

    const cardsToMove = getCardsAtLocation(state, selectedLocation);
    if (cardsToMove.length === 0) {
      setSelectedLocation(null);
      return;
    }

    const firstCard = cardsToMove[0];

    // Empty tableau column: only King allowed
    if (targetLocation.pileType === 'tableau' && targetLocation.pileIndex !== undefined) {
      const col = state.tableau[targetLocation.pileIndex];
      if (col.length === 0 && firstCard.rank === 13) {
        executeMove(selectedLocation, targetLocation, cardsToMove);
        return;
      }
    }

    // Empty foundation: only Ace allowed
    if (targetLocation.pileType === 'foundation' && targetLocation.pileIndex !== undefined) {
      const pile = state.foundations[targetLocation.pileIndex];
      if (pile.length === 0 && cardsToMove.length === 1 && firstCard.rank === 1) {
        executeMove(selectedLocation, targetLocation, cardsToMove);
        return;
      }
    }

    // If invalid click, deselect
    setSelectedLocation(null);
  }, [clearHint, selectedLocation, state, drawCards, executeMove]);

  // Double click for immediate fast send to foundation
  const handleDoubleClick = useCallback((card: Card, location: CardLocation) => {
    if (!card.faceUp) return;
    const cards = getCardsAtLocation(state, location);
    if (cards.length !== 1) return;

    for (let fIdx = 0; fIdx < 4; fIdx++) {
      if (isValidFoundationMove(card, state.foundations[fIdx])) {
        executeMove(location, { pileType: 'foundation', pileIndex: fIdx }, cards);
        return;
      }
    }
  }, [state, executeMove]);

  // Undo move
  const undo = useCallback(() => {
    clearHint();
    setSelectedLocation(null);

    setState((prev) => {
      if (prev.history.length === 0) return prev;

      const lastMove = prev.history[prev.history.length - 1];
      const remainingHistory = prev.history.slice(0, prev.history.length - 1);

      sound.playCardPlace();

      // Reverse the move
      const newFoundations = prev.foundations.map((f) => [...f]) as typeof prev.foundations;
      const newTableau = prev.tableau.map((t) => [...t]) as typeof prev.tableau;
      let newWaste = [...prev.waste];
      let newStock = [...prev.stock];

      // If it was a stock recycle:
      if (lastMove.from.pileType === 'waste' && lastMove.to.pileType === 'stock') {
        newWaste = lastMove.previousWasteCards ? [...lastMove.previousWasteCards] : [];
        newStock = [];
        return {
          ...prev,
          stock: newStock,
          waste: newWaste,
          history: remainingHistory,
          redoStack: [lastMove, ...prev.redoStack],
          score: Math.max(0, prev.score - lastMove.scoreDelta),
          moves: prev.moves + 1,
        };
      }

      // If it was a draw from stock to waste:
      if (lastMove.from.pileType === 'stock' && lastMove.to.pileType === 'waste') {
        const count = lastMove.cards.length;
        const returnedToStock = prev.waste.slice(prev.waste.length - count).map((c) => ({
          ...c,
          faceUp: false,
        }));
        newWaste = prev.waste.slice(0, prev.waste.length - count);
        newStock = [...prev.stock, ...returnedToStock];

        return {
          ...prev,
          stock: newStock,
          waste: newWaste,
          history: remainingHistory,
          redoStack: [lastMove, ...prev.redoStack],
          moves: prev.moves + 1,
        };
      }

      // Remove from 'to' location
      if (lastMove.to.pileType === 'foundation' && lastMove.to.pileIndex !== undefined) {
        newFoundations[lastMove.to.pileIndex] = newFoundations[lastMove.to.pileIndex].slice(
          0,
          newFoundations[lastMove.to.pileIndex].length - lastMove.cards.length
        );
      } else if (lastMove.to.pileType === 'tableau' && lastMove.to.pileIndex !== undefined) {
        newTableau[lastMove.to.pileIndex] = newTableau[lastMove.to.pileIndex].slice(
          0,
          newTableau[lastMove.to.pileIndex].length - lastMove.cards.length
        );
      }

      // Restore to 'from' location
      if (lastMove.from.pileType === 'waste') {
        newWaste.push(...lastMove.cards);
      } else if (lastMove.from.pileType === 'tableau' && lastMove.from.pileIndex !== undefined) {
        // If previous move turned a card over, turn it back down!
        if (lastMove.turnedCardOver) {
          const col = newTableau[lastMove.from.pileIndex];
          if (col.length > 0) {
            col[col.length - 1].faceUp = false;
          }
        }
        newTableau[lastMove.from.pileIndex].push(...lastMove.cards);
      } else if (lastMove.from.pileType === 'foundation' && lastMove.from.pileIndex !== undefined) {
        newFoundations[lastMove.from.pileIndex].push(...lastMove.cards);
      }

      return {
        ...prev,
        stock: newStock,
        waste: newWaste,
        foundations: newFoundations,
        tableau: newTableau,
        score: Math.max(0, prev.score - lastMove.scoreDelta),
        moves: prev.moves + 1,
        history: remainingHistory,
        redoStack: [lastMove, ...prev.redoStack],
      };
    });
  }, [clearHint]);

  // Request hint
  const triggerHint = useCallback(() => {
    const foundHint = findHint(state);
    if (foundHint) {
      sound.playTap();
      setHint(foundHint);
    } else {
      sound.playCardPlace();
      setHint({
        from: { pileType: 'stock' },
        to: { pileType: 'stock' },
        description: 'Brak dostępnych ruchów — spróbuj cofnąć lub zrestartować.',
      });
    }
  }, [state]);

  // Auto-finish solver
  const autoFinishTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoFinish = useCallback(() => {
    if (isAutoFinishing) return;
    setIsAutoFinishing(true);
    setSelectedLocation(null);
    clearHint();
  }, [isAutoFinishing, clearHint]);

  useEffect(() => {
    if (!isAutoFinishing || state.isWon) {
      if (autoFinishTimerRef.current) {
        clearTimeout(autoFinishTimerRef.current);
        autoFinishTimerRef.current = null;
      }
      return;
    }

    const nextMove = getNextAutoFinishMove(state);
    if (nextMove) {
      autoFinishTimerRef.current = setTimeout(() => {
        const col = state.tableau[nextMove.fromColIdx];
        const card = col[col.length - 1];
        executeMove(
          {
            pileType: 'tableau',
            pileIndex: nextMove.fromColIdx,
            cardIndex: col.length - 1,
          },
          { pileType: 'foundation', pileIndex: nextMove.toFoundationIdx },
          [card]
        );
      }, 120);
    } else {
      setIsAutoFinishing(false);
    }

    return () => {
      if (autoFinishTimerRef.current) {
        clearTimeout(autoFinishTimerRef.current);
      }
    };
  }, [isAutoFinishing, state, executeMove]);

  // Check if auto-finish is eligible
  const isAutoFinishAvailable = canAutoFinish(state) && !state.isWon;

  // Toggle sound
  const toggleSound = useCallback(() => {
    const val = sound.toggleSound();
    setSoundEnabled(val);
  }, []);

  return {
    state,
    stats,
    selectedLocation,
    hint,
    isAutoFinishing,
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
    setSelectedLocation,
    clearHint,
  };
}

function getCardsAtLocation(state: SolitaireState, loc: CardLocation): Card[] {
  if (loc.pileType === 'waste') {
    return state.waste.length > 0 ? [state.waste[state.waste.length - 1]] : [];
  }
  if (loc.pileType === 'tableau' && loc.pileIndex !== undefined) {
    const col = state.tableau[loc.pileIndex];
    const startIdx = loc.cardIndex ?? col.length - 1;
    return col.slice(startIdx);
  }
  if (loc.pileType === 'foundation' && loc.pileIndex !== undefined) {
    const pile = state.foundations[loc.pileIndex];
    return pile.length > 0 ? [pile[pile.length - 1]] : [];
  }
  return [];
}
