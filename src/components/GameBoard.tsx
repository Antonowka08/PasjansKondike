import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardLocation, SolitaireState, Suit } from '../types/solitaire';
import { SUITS, isValidFoundationMove, isValidTableauMove } from '../utils/cardUtils';
import { CardView } from './CardView';
import { EmptySlot } from './EmptySlot';

interface GameBoardProps {
  state: SolitaireState;
  selectedLocation: CardLocation | null;
  hint: { from: CardLocation; to: CardLocation } | null;
  onCardClick: (card: Card, location: CardLocation) => void;
  onDoubleClick: (card: Card, location: CardLocation) => void;
  onEmptySlotClick: (location: CardLocation) => void;
  onStockClick: () => void;
  onMoveCards: (from: CardLocation, to: CardLocation, cards: Card[]) => void;
}

interface DragInfo {
  cards: Card[];
  from: CardLocation;
  startPos: { x: number; y: number };
  currentPos: { x: number; y: number };
  cardSize: { width: number; height: number };
  hoverTarget: CardLocation | null;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  state,
  selectedLocation,
  hint,
  onCardClick,
  onDoubleClick,
  onEmptySlotClick,
  onStockClick,
  onMoveCards,
}) => {
  const [dragInfo, setDragInfo] = useState<DragInfo | null>(null);
  const dragRef = useRef<DragInfo | null>(null);
  dragRef.current = dragInfo;

  // Pointer drag threshold tracking
  const pointerStartRef = useRef<{
    x: number;
    y: number;
    card: Card;
    location: CardLocation;
    cards: Card[];
    rect: DOMRect;
    isMoveThresholdPassed: boolean;
  } | null>(null);

  // Helper to test if a drop target is valid
  const checkValidTarget = useCallback((target: CardLocation, cardsToPlace: Card[]): boolean => {
    if (cardsToPlace.length === 0) return false;
    const leadCard = cardsToPlace[0];

    if (target.pileType === 'foundation' && target.pileIndex !== undefined) {
      if (cardsToPlace.length !== 1) return false;
      const foundationPile = state.foundations[target.pileIndex];
      return isValidFoundationMove(leadCard, foundationPile);
    }

    if (target.pileType === 'tableau' && target.pileIndex !== undefined) {
      const col = state.tableau[target.pileIndex];
      return isValidTableauMove(leadCard, col);
    }

    return false;
  }, [state.foundations, state.tableau]);

  // Pointer Down on a card
  const handlePointerDown = (
    e: React.PointerEvent,
    card: Card,
    location: CardLocation,
    cards: Card[]
  ) => {
    // Only primary button / single touch
    if (e.button !== 0) return;

    // If card is face down:
    if (!card.faceUp) {
      onCardClick(card, location);
      return;
    }

    const targetEl = e.currentTarget as HTMLElement;
    const rect = targetEl.getBoundingClientRect();

    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      card,
      location,
      cards,
      rect,
      isMoveThresholdPassed: false,
    };

    // Global window listeners for drag
    const onPointerMove = (moveEvt: PointerEvent) => {
      const start = pointerStartRef.current;
      if (!start) return;

      const dx = moveEvt.clientX - start.x;
      const dy = moveEvt.clientY - start.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (!start.isMoveThresholdPassed && dist > 5) {
        start.isMoveThresholdPassed = true;
      }

      if (start.isMoveThresholdPassed) {
        // Find hover target
        let hoverTarget: CardLocation | null = null;
        const elements = document.elementsFromPoint(moveEvt.clientX, moveEvt.clientY);
        for (const el of elements) {
          const dropType = el.getAttribute('data-drop-type');
          const dropIndexStr = el.getAttribute('data-drop-index');
          if (dropType && dropIndexStr !== null) {
            const dropIndex = parseInt(dropIndexStr, 10);
            const candidate: CardLocation = {
              pileType: dropType as 'foundation' | 'tableau',
              pileIndex: dropIndex,
            };
            if (checkValidTarget(candidate, start.cards)) {
              hoverTarget = candidate;
              break;
            }
          }
        }

        setDragInfo({
          cards: start.cards,
          from: start.location,
          startPos: { x: start.x, y: start.y },
          currentPos: { x: moveEvt.clientX, y: moveEvt.clientY },
          cardSize: { width: start.rect.width, height: start.rect.height },
          hoverTarget,
        });
      }
    };

    const onPointerUp = (upEvt: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);

      const start = pointerStartRef.current;
      pointerStartRef.current = null;

      if (!start) return;

      if (start.isMoveThresholdPassed && dragRef.current) {
        // Dropped! Check if valid target
        const currentTarget = dragRef.current.hoverTarget;
        if (currentTarget && checkValidTarget(currentTarget, start.cards)) {
          onMoveCards(start.location, currentTarget, start.cards);
        }
        setDragInfo(null);
      } else {
        // Just clicked/tapped without moving
        onCardClick(start.card, start.location);
      }
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  // Helper to check if card is part of current drag
  const isCardDragged = (location: CardLocation): boolean => {
    if (!dragInfo) return false;
    if (dragInfo.from.pileType !== location.pileType) return false;
    if (dragInfo.from.pileIndex !== location.pileIndex) return false;
    if (location.cardIndex === undefined || dragInfo.from.cardIndex === undefined) {
      return true;
    }
    return location.cardIndex >= dragInfo.from.cardIndex;
  };

  // Helper to check selection
  const isSelected = (loc: CardLocation): boolean => {
    if (!selectedLocation) return false;
    return (
      selectedLocation.pileType === loc.pileType &&
      selectedLocation.pileIndex === loc.pileIndex &&
      (loc.cardIndex === undefined || selectedLocation.cardIndex === loc.cardIndex)
    );
  };

  // Helper to check hint
  const isHintedFrom = (loc: CardLocation): boolean => {
    if (!hint) return false;
    return (
      hint.from.pileType === loc.pileType &&
      hint.from.pileIndex === loc.pileIndex &&
      (loc.cardIndex === undefined || hint.from.cardIndex === loc.cardIndex)
    );
  };

  const isHintedTo = (loc: CardLocation): boolean => {
    if (!hint) return false;
    return (
      hint.to.pileType === loc.pileType &&
      hint.to.pileIndex === loc.pileIndex
    );
  };

  // Helper to check if a drop target is hovered during drag
  const isTargetHovered = (pileType: 'foundation' | 'tableau', pileIndex: number): boolean => {
    if (!dragInfo || !dragInfo.hoverTarget) return false;
    return (
      dragInfo.hoverTarget.pileType === pileType &&
      dragInfo.hoverTarget.pileIndex === pileIndex
    );
  };

  // Waste card fan display (in draw 3 mode, show top 3 cards fanned out)
  const visibleWasteCards = state.drawMode === 3
    ? state.waste.slice(Math.max(0, state.waste.length - 3))
    : state.waste.slice(Math.max(0, state.waste.length - 1));

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 md:px-6 py-4 flex flex-col gap-6 sm:gap-8 select-none">
      {/* TOP ROW: Stock & Waste on left, 4 Foundations on right */}
      <div className="grid grid-cols-7 gap-2 sm:gap-3 md:gap-4 items-start">
        {/* Stock Pile (Column 1) */}
        <div className="relative aspect-[5/7]">
          {state.stock.length > 0 ? (
            <div
              onClick={onStockClick}
              className="cursor-pointer group relative w-full h-full"
            >
              {/* Stack depth visual hint (zero gradient, pure clean border) */}
              {state.stock.length > 1 && (
                <div className="absolute inset-0 translate-x-0.5 translate-y-0.5 rounded-xl bg-zinc-200 border border-zinc-300 pointer-events-none -z-10" />
              )}
              {state.stock.length > 3 && (
                <div className="absolute inset-0 translate-x-1 translate-y-1 rounded-xl bg-zinc-300 border border-zinc-300 pointer-events-none -z-20" />
              )}
              <CardView
                card={state.stock[state.stock.length - 1]}
                isHinted={hint?.from.pileType === 'stock'}
                className="hover:shadow-md transition-shadow"
              />
              {/* Remaining stock count badge */}
              <div className="absolute -bottom-2 -right-2 bg-zinc-900 text-white text-[10px] sm:text-xs font-semibold px-1.5 py-0.5 rounded-full pointer-events-none">
                {state.stock.length}
              </div>
            </div>
          ) : (
            <EmptySlot
              type="stock"
              isHinted={hint?.from.pileType === 'stock'}
              onClick={onStockClick}
            />
          )}
        </div>

        {/* Waste Pile (Column 2) */}
        <div className="relative aspect-[5/7]">
          {state.waste.length === 0 ? (
            <EmptySlot type="waste" />
          ) : (
            <div className="relative w-full h-full">
              {visibleWasteCards.map((card, idx) => {
                const isTopWasteCard = idx === visibleWasteCards.length - 1;
                const originalIndex = state.waste.length - visibleWasteCards.length + idx;
                const location: CardLocation = {
                  pileType: 'waste',
                  cardIndex: originalIndex,
                };
                const xOffset = state.drawMode === 3 ? idx * 14 : 0;

                return (
                  <div
                    key={card.id}
                    className="absolute inset-0 transition-transform"
                    style={{
                      transform: `translateX(${xOffset}px)`,
                      zIndex: idx + 1,
                    }}
                  >
                    <CardView
                      card={card}
                      isSelected={isTopWasteCard && isSelected(location)}
                      isHinted={isTopWasteCard && isHintedFrom(location)}
                      isDragging={isTopWasteCard && isCardDragged(location)}
                      onDoubleClick={
                        isTopWasteCard ? () => onDoubleClick(card, location) : undefined
                      }
                      onPointerDown={
                        isTopWasteCard
                          ? (e) => handlePointerDown(e, card, location, [card])
                          : undefined
                      }
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Gap column for spatial balance (Column 3) */}
        <div className="hidden sm:block" />

        {/* 4 Foundations (Columns 4, 5, 6, 7 or 3, 4, 5, 6 on mobile) */}
        {SUITS.map((suit, fIdx) => {
          const pile = state.foundations[fIdx];
          const hasCards = pile.length > 0;
          const topCard = hasCards ? pile[pile.length - 1] : null;
          const targetLocation: CardLocation = {
            pileType: 'foundation',
            pileIndex: fIdx,
          };
          const isHovered = isTargetHovered('foundation', fIdx);
          const isHintTarget = isHintedTo(targetLocation);

          return (
            <div
              key={suit}
              data-drop-type="foundation"
              data-drop-index={fIdx}
              onClick={() => {
                if (selectedLocation) {
                  onEmptySlotClick(targetLocation);
                }
              }}
              className="relative aspect-[5/7]"
            >
              {!hasCards ? (
                <EmptySlot
                  type="foundation"
                  foundationSuit={suit}
                  isDropTarget={isHovered}
                  isHinted={isHintTarget}
                  onClick={() => onEmptySlotClick(targetLocation)}
                />
              ) : (
                <div className="relative w-full h-full">
                  <CardView
                    card={topCard!}
                    isSelected={isSelected({ ...targetLocation, cardIndex: pile.length - 1 })}
                    isHinted={isHintTarget}
                    isDragging={isCardDragged({ ...targetLocation, cardIndex: pile.length - 1 })}
                    onDoubleClick={() => onDoubleClick(topCard!, targetLocation)}
                    onPointerDown={(e) =>
                      handlePointerDown(e, topCard!, targetLocation, [topCard!])
                    }
                  />
                  {/* Subtle rank watermark on complete/high stack */}
                  <div className="absolute -bottom-1.5 -right-1.5 bg-zinc-100 border border-zinc-200 text-zinc-600 text-[9px] sm:text-[10px] font-semibold px-1 py-0.2 rounded-md pointer-events-none">
                    {pile.length}/13
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* TABLEAU: 7 Columns side-by-side */}
      <div className="grid grid-cols-7 gap-2 sm:gap-3 md:gap-4 items-start min-h-[480px]">
        {state.tableau.map((col, colIdx) => {
          const isEmpty = col.length === 0;
          const isHovered = isTargetHovered('tableau', colIdx);
          const isHintTarget = isHintedTo({ pileType: 'tableau', pileIndex: colIdx });

          // Calculate vertical offsets for this column
          // Face-down cards overlap by tighter spacing (12px), face-up cards by 26px (22px on mobile)
          let currentTop = 0;
          const cardPositions = col.map((c) => {
            const pos = currentTop;
            currentTop += c.faceUp ? 26 : 12;
            return pos;
          });

          return (
            <div
              key={colIdx}
              data-drop-type="tableau"
              data-drop-index={colIdx}
              onClick={() => {
                if (isEmpty && selectedLocation) {
                  onEmptySlotClick({ pileType: 'tableau', pileIndex: colIdx });
                }
              }}
              className="relative flex flex-col items-center w-full min-h-[300px] sm:min-h-[420px]"
            >
              {isEmpty ? (
                <EmptySlot
                  type="tableau"
                  isDropTarget={isHovered}
                  isHinted={isHintTarget}
                  onClick={() => onEmptySlotClick({ pileType: 'tableau', pileIndex: colIdx })}
                />
              ) : (
                <div className="relative w-full h-full">
                  {col.map((card, cardIdx) => {
                    const location: CardLocation = {
                      pileType: 'tableau',
                      pileIndex: colIdx,
                      cardIndex: cardIdx,
                    };
                    const isCardSelected = isSelected(location);
                    const isCardHinted = isHintedFrom(location);
                    const isDragging = isCardDragged(location);
                    const isLastCard = cardIdx === col.length - 1;
                    const topPos = cardPositions[cardIdx];

                    // Stack of cards from this card to the end of the column
                    const cardsToDrag = card.faceUp ? col.slice(cardIdx) : [card];

                    return (
                      <div
                        key={card.id}
                        className="absolute w-full aspect-[5/7] transition-all duration-100"
                        style={{
                          top: `${topPos}px`,
                          zIndex: cardIdx + 1,
                        }}
                      >
                        <CardView
                          card={card}
                          isSelected={isCardSelected}
                          isHinted={isCardHinted}
                          isDragging={isDragging}
                          onDoubleClick={
                            isLastCard && card.faceUp
                              ? () => onDoubleClick(card, location)
                              : undefined
                          }
                          onPointerDown={(e) =>
                            handlePointerDown(e, card, location, cardsToDrag)
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* FLOATING DRAGGED CARDS OVERLAY */}
      {dragInfo && (
        <div
          className="fixed pointer-events-none z-50 transition-none"
          style={{
            left: `${dragInfo.currentPos.x - dragInfo.cardSize.width / 2}px`,
            top: `${dragInfo.currentPos.y - 20}px`,
            width: `${dragInfo.cardSize.width}px`,
            filter: 'drop-shadow(0 14px 28px rgba(0, 0, 0, 0.16))',
          }}
        >
          <div className="relative scale-[1.03] transition-transform">
            {dragInfo.cards.map((card, idx) => (
              <div
                key={card.id}
                className="absolute w-full aspect-[5/7]"
                style={{
                  top: `${idx * 26}px`,
                  zIndex: idx + 10,
                }}
              >
                <CardView card={card} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
