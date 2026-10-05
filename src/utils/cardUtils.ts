import { Card, CardColor, CardLocation, SolitaireState, Suit } from '../types/solitaire';

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        faceUp: false,
      });
    }
  }
  return deck;
}

export function shuffleDeck(cards: Card[]): Card[] {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealNewGame(drawMode: 1 | 3 = 1): SolitaireState {
  const deck = shuffleDeck(createDeck());

  const tableau: [Card[], Card[], Card[], Card[], Card[], Card[], Card[]] = [
    [],
    [],
    [],
    [],
    [],
    [],
    [],
  ];

  let deckIdx = 0;
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = { ...deck[deckIdx] };
      // Top card in each tableau pile starts face up
      card.faceUp = row === col;
      tableau[col].push(card);
      deckIdx++;
    }
  }

  // Remaining 24 cards go to stock (face down)
  const stock: Card[] = [];
  while (deckIdx < deck.length) {
    stock.push({ ...deck[deckIdx], faceUp: false });
    deckIdx++;
  }

  return {
    stock,
    waste: [],
    foundations: [[], [], [], []],
    tableau,
    drawMode,
    score: 0,
    moves: 0,
    time: 0,
    isGameActive: true,
    isWon: false,
    history: [],
    redoStack: [],
  };
}

export function getCardColor(suit: Suit): CardColor {
  return suit === 'hearts' || suit === 'diamonds' ? 'red' : 'black';
}

export function getRankDisplay(rank: number): string {
  switch (rank) {
    case 1:
      return 'A';
    case 11:
      return 'J';
    case 12:
      return 'Q';
    case 13:
      return 'K';
    default:
      return String(rank);
  }
}

export function getRankName(rank: number): string {
  switch (rank) {
    case 1:
      return 'As';
    case 11:
      return 'Walet';
    case 12:
      return 'Dama';
    case 13:
      return 'Król';
    default:
      return String(rank);
  }
}

export function getSuitSymbol(suit: Suit): string {
  switch (suit) {
    case 'spades':
      return '♠';
    case 'hearts':
      return '♥';
    case 'diamonds':
      return '♦';
    case 'clubs':
      return '♣';
  }
}

export function getSuitNamePl(suit: Suit): string {
  switch (suit) {
    case 'spades':
      return 'Pik';
    case 'hearts':
      return 'Kier';
    case 'diamonds':
      return 'Karo';
    case 'clubs':
      return 'Trefl';
  }
}

export function isValidFoundationMove(card: Card, foundationPile: Card[]): boolean {
  if (foundationPile.length === 0) {
    // Only Ace (rank 1) can start a foundation pile
    return card.rank === 1;
  }
  const topCard = foundationPile[foundationPile.length - 1];
  return topCard.suit === card.suit && card.rank === topCard.rank + 1;
}

export function isValidTableauMove(cardToPlace: Card, targetColumn: Card[]): boolean {
  if (targetColumn.length === 0) {
    // Only King (rank 13) can go on empty column
    return cardToPlace.rank === 13;
  }
  const topCard = targetColumn[targetColumn.length - 1];
  if (!topCard.faceUp) return false;

  // Alternating colors
  const isOppositeColor = getCardColor(cardToPlace.suit) !== getCardColor(topCard.suit);
  // Sequential descending rank
  const isOneRankLower = cardToPlace.rank === topCard.rank - 1;

  return isOppositeColor && isOneRankLower;
}

/**
 * Finds the first valid target for a card: Foundation first, then Tableau.
 */
export function findAutoMoveDestination(
  card: Card,
  state: SolitaireState,
  fromLocation: CardLocation
): { to: CardLocation; isFoundation: boolean } | null {
  // 1. Try Foundations first (always preferred)
  for (let fIdx = 0; fIdx < 4; fIdx++) {
    if (isValidFoundationMove(card, state.foundations[fIdx])) {
      return {
        to: { pileType: 'foundation', pileIndex: fIdx },
        isFoundation: true,
      };
    }
  }

  // 2. Try Tableau columns
  // Don't move a King to an empty column if it's already the bottom-most card in its column!
  const isBottomCardOfCol =
    fromLocation.pileType === 'tableau' && fromLocation.cardIndex === 0;

  for (let tIdx = 0; tIdx < 7; tIdx++) {
    if (fromLocation.pileType === 'tableau' && fromLocation.pileIndex === tIdx) {
      continue; // Skip same column
    }

    const targetCol = state.tableau[tIdx];
    if (isValidTableauMove(card, targetCol)) {
      // If target is empty and card is already bottom of its column, useless move
      if (targetCol.length === 0 && isBottomCardOfCol) {
        continue;
      }
      return {
        to: { pileType: 'tableau', pileIndex: tIdx },
        isFoundation: false,
      };
    }
  }

  return null;
}

/**
 * Checks if the game can be auto-completed:
 * All face-down cards in tableau are revealed and stock is empty (or already cycled).
 */
export function canAutoFinish(state: SolitaireState): boolean {
  if (state.stock.length > 0 || state.waste.length > 0) {
    return false;
  }
  // Check if every card in every tableau column is face-up
  for (const col of state.tableau) {
    for (const card of col) {
      if (!card.faceUp) return false;
    }
  }
  return true;
}

/**
 * Find the next legal move for auto-finish step
 */
export function getNextAutoFinishMove(state: SolitaireState): {
  fromColIdx: number;
  toFoundationIdx: number;
} | null {
  for (let colIdx = 0; colIdx < 7; colIdx++) {
    const col = state.tableau[colIdx];
    if (col.length === 0) continue;
    const card = col[col.length - 1];

    for (let fIdx = 0; fIdx < 4; fIdx++) {
      if (isValidFoundationMove(card, state.foundations[fIdx])) {
        return { fromColIdx: colIdx, toFoundationIdx: fIdx };
      }
    }
  }
  return null;
}

export interface HintResult {
  from: CardLocation;
  to: CardLocation;
  description: string;
}

export function findHint(state: SolitaireState): HintResult | null {
  // 1. Check if waste card can go to foundation
  if (state.waste.length > 0) {
    const wasteCard = state.waste[state.waste.length - 1];
    for (let fIdx = 0; fIdx < 4; fIdx++) {
      if (isValidFoundationMove(wasteCard, state.foundations[fIdx])) {
        return {
          from: { pileType: 'waste', cardIndex: state.waste.length - 1 },
          to: { pileType: 'foundation', pileIndex: fIdx },
          description: `Przełóż ${getRankDisplay(wasteCard.rank)}${getSuitSymbol(wasteCard.suit)} z odrzuconych na pole bazowe`,
        };
      }
    }
  }

  // 2. Check if tableau cards can go to foundation
  for (let cIdx = 0; cIdx < 7; cIdx++) {
    const col = state.tableau[cIdx];
    if (col.length === 0) continue;
    const topCard = col[col.length - 1];
    if (!topCard.faceUp) continue;

    for (let fIdx = 0; fIdx < 4; fIdx++) {
      if (isValidFoundationMove(topCard, state.foundations[fIdx])) {
        return {
          from: { pileType: 'tableau', pileIndex: cIdx, cardIndex: col.length - 1 },
          to: { pileType: 'foundation', pileIndex: fIdx },
          description: `Przełóż ${getRankDisplay(topCard.rank)}${getSuitSymbol(topCard.suit)} na pole bazowe`,
        };
      }
    }
  }

  // 3. Check if any tableau move reveals a hidden card
  for (let cIdx = 0; cIdx < 7; cIdx++) {
    const col = state.tableau[cIdx];
    if (col.length === 0) continue;

    // Find the first face-up card in this column
    const firstFaceUpIdx = col.findIndex((c) => c.faceUp);
    if (firstFaceUpIdx > 0) {
      // There are face-down cards underneath!
      const cardToMove = col[firstFaceUpIdx];
      for (let targetIdx = 0; targetIdx < 7; targetIdx++) {
        if (targetIdx === cIdx) continue;
        const targetCol = state.tableau[targetIdx];
        if (isValidTableauMove(cardToMove, targetCol)) {
          return {
            from: { pileType: 'tableau', pileIndex: cIdx, cardIndex: firstFaceUpIdx },
            to: { pileType: 'tableau', pileIndex: targetIdx },
            description: `Przenieś ${getRankDisplay(cardToMove.rank)}${getSuitSymbol(cardToMove.suit)}, aby odsłonić zakrytą kartę`,
          };
        }
      }
    }
  }

  // 4. Check if waste card can go to tableau
  if (state.waste.length > 0) {
    const wasteCard = state.waste[state.waste.length - 1];
    for (let cIdx = 0; cIdx < 7; cIdx++) {
      const targetCol = state.tableau[cIdx];
      if (isValidTableauMove(wasteCard, targetCol)) {
        return {
          from: { pileType: 'waste', cardIndex: state.waste.length - 1 },
          to: { pileType: 'tableau', pileIndex: cIdx },
          description: `Przełóż ${getRankDisplay(wasteCard.rank)}${getSuitSymbol(wasteCard.suit)} do kolumny ${cIdx + 1}`,
        };
      }
    }
  }

  // 5. Check other valid tableau-to-tableau moves
  for (let cIdx = 0; cIdx < 7; cIdx++) {
    const col = state.tableau[cIdx];
    if (col.length === 0) continue;

    const firstFaceUpIdx = col.findIndex((c) => c.faceUp);
    if (firstFaceUpIdx >= 0) {
      const cardToMove = col[firstFaceUpIdx];
      // Avoid moving a King from an empty slot to another empty slot
      if (cardToMove.rank === 13 && firstFaceUpIdx === 0) {
        continue;
      }
      for (let targetIdx = 0; targetIdx < 7; targetIdx++) {
        if (targetIdx === cIdx) continue;
        const targetCol = state.tableau[targetIdx];
        if (isValidTableauMove(cardToMove, targetCol)) {
          return {
            from: { pileType: 'tableau', pileIndex: cIdx, cardIndex: firstFaceUpIdx },
            to: { pileType: 'tableau', pileIndex: targetIdx },
            description: `Przenieś ${getRankDisplay(cardToMove.rank)}${getSuitSymbol(cardToMove.suit)} do kolumny ${targetIdx + 1}`,
          };
        }
      }
    }
  }

  // 6. Draw from stock
  if (state.stock.length > 0 || state.waste.length > 0) {
    return {
      from: { pileType: 'stock' },
      to: { pileType: 'waste' },
      description: state.stock.length > 0 ? 'Dobierz kartę z talii' : 'Przetasuj talie z odrzuconych',
    };
  }

  return null;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
