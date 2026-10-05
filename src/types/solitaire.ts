export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type CardColor = 'red' | 'black';

export interface Card {
  id: string; // e.g. "hearts-1", "spades-13"
  suit: Suit;
  rank: number; // 1 (Ace) to 13 (King)
  faceUp: boolean;
}

export type PileType = 'stock' | 'waste' | 'foundation' | 'tableau';

export interface CardLocation {
  pileType: PileType;
  pileIndex?: number; // 0-3 for foundation, 0-6 for tableau
  cardIndex?: number; // position within the pile
}

export interface MoveAction {
  from: CardLocation;
  to: CardLocation;
  cards: Card[];
  turnedCardOver?: boolean; // did this move reveal a face-down card?
  previousWasteCards?: Card[]; // for stock recycle
  scoreDelta: number;
}

export interface SolitaireState {
  stock: Card[];
  waste: Card[];
  foundations: [Card[], Card[], Card[], Card[]];
  tableau: [Card[], Card[], Card[], Card[], Card[], Card[], Card[]];
  drawMode: 1 | 3;
  score: number;
  moves: number;
  time: number; // in seconds
  isGameActive: boolean;
  isWon: boolean;
  history: MoveAction[];
  redoStack: MoveAction[];
}

export interface GameStats {
  gamesPlayed: number;
  gamesWon: number;
  currentStreak: number;
  bestStreak: number;
  bestTime: number | null; // in seconds
  bestScore: number;
}
