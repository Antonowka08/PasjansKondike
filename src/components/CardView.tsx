import React from 'react';
import { Card, Suit } from '../types/solitaire';
import { getCardColor, getRankDisplay } from '../utils/cardUtils';
import { SuitIcon } from './SuitIcon';

interface CardViewProps {
  card: Card;
  isSelected?: boolean;
  isHinted?: boolean;
  isDragging?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onPointerDown?: (e: React.PointerEvent) => void;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  isSelected = false,
  isHinted = false,
  isDragging = false,
  className = '',
  style,
  onClick,
  onDoubleClick,
  onPointerDown,
}) => {
  const isRed = getCardColor(card.suit) === 'red';
  const rankText = getRankDisplay(card.rank);
  const colorClass = isRed ? 'text-rose-600' : 'text-zinc-900';

  if (!card.faceUp) {
    // Apple-styled minimalist Card Back: Zero gradient, pure flat elegance
    return (
      <div
        className={`relative aspect-[5/7] w-full rounded-xl bg-zinc-100 border border-zinc-300/80 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex items-center justify-center p-1.5 select-none transition-transform duration-150 ${
          isHinted ? 'ring-2 ring-amber-400 ring-offset-2' : ''
        } ${className}`}
        style={style}
        onClick={onClick}
        onPointerDown={onPointerDown}
      >
        <div className="w-full h-full rounded-lg border border-zinc-200/90 bg-zinc-50 flex items-center justify-center relative overflow-hidden">
          {/* Subtle minimal geometric grid pattern */}
          <div className="w-8 h-8 rounded-full border border-zinc-300/60 flex items-center justify-center">
            <div className="w-3 h-3 rounded-sm border border-zinc-400/50 rotate-45" />
          </div>
        </div>
      </div>
    );
  }

  // Render center art based on rank
  const renderCenterArt = () => {
    if (card.rank === 1) {
      // Ace: Large iconic suit
      return (
        <div className="flex items-center justify-center">
          <SuitIcon suit={card.suit} className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12" />
        </div>
      );
    }

    if (card.rank >= 11) {
      // Face Cards: Minimalist royal emblem with suit accent
      return (
        <div className="flex flex-col items-center justify-center gap-1 opacity-90">
          {card.rank === 13 && (
            // King: Apple minimalist geometric Crown
            <svg viewBox="0 0 24 24" className="w-7 h-7 sm:w-8 sm:h-8 stroke-current fill-none stroke-[1.75]" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18h18v2H3z" fill="currentColor" opacity="0.15" />
              <path d="M4 17l2-10 6 5 6-5 2 10H4z" />
              <circle cx="6" cy="7" r="1.2" fill="currentColor" />
              <circle cx="12" cy="12" r="1.2" fill="currentColor" />
              <circle cx="18" cy="7" r="1.2" fill="currentColor" />
            </svg>
          )}
          {card.rank === 12 && (
            // Queen: Apple minimalist Tiara / Bloom
            <svg viewBox="0 0 24 24" className="w-7 h-7 sm:w-8 sm:h-8 stroke-current fill-none stroke-[1.75]" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 18h16v1.5H4z" fill="currentColor" opacity="0.15" />
              <path d="M5 17c2-5 4-8 7-8s5 3 7 8H5z" />
              <circle cx="12" cy="5" r="1.75" />
              <circle cx="7" cy="8" r="1.25" />
              <circle cx="17" cy="8" r="1.25" />
            </svg>
          )}
          {card.rank === 11 && (
            // Jack: Apple minimalist Shield / Crest
            <svg viewBox="0 0 24 24" className="w-7 h-7 sm:w-8 sm:h-8 stroke-current fill-none stroke-[1.75]" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v18" />
              <path d="M12 3L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-3z" />
            </svg>
          )}
          <SuitIcon suit={card.suit} className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5" />
        </div>
      );
    }

    // Number cards (2 - 10)
    // Dynamic clean pip pattern
    return renderPips(card.rank, card.suit);
  };

  return (
    <div
      className={`relative aspect-[5/7] w-full rounded-xl bg-white border border-zinc-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] select-none p-1.5 sm:p-2 flex flex-col justify-between transition-shadow duration-150 cursor-pointer ${colorClass} ${
        isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      } ${isHinted ? 'ring-2 ring-amber-400 ring-offset-2 animate-pulse' : ''} ${
        isDragging ? 'opacity-30' : ''
      } ${className}`}
      style={style}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onPointerDown={onPointerDown}
    >
      {/* Top-Left Corner Index */}
      <div className="flex flex-col items-center leading-none self-start pointer-events-none">
        <span className="text-sm sm:text-base md:text-lg font-bold tracking-tighter">
          {rankText}
        </span>
        <SuitIcon suit={card.suit} className="w-3 h-3 sm:w-3.5 sm:h-3.5 mt-0.5" />
      </div>

      {/* Center Artwork / Pips */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-3">
        {renderCenterArt()}
      </div>

      {/* Bottom-Right Corner Index (Inverted 180°) */}
      <div className="flex flex-col items-center leading-none self-end rotate-180 pointer-events-none">
        <span className="text-sm sm:text-base md:text-lg font-bold tracking-tighter">
          {rankText}
        </span>
        <SuitIcon suit={card.suit} className="w-3 h-3 sm:w-3.5 sm:h-3.5 mt-0.5" />
      </div>
    </div>
  );
};

function renderPips(rank: number, suit: Suit) {
  const pipClass = 'w-3 h-3 sm:w-3.5 sm:h-3.5';

  if (rank === 2) {
    return (
      <div className="h-full flex flex-col justify-between py-1">
        <SuitIcon suit={suit} className={pipClass} />
        <SuitIcon suit={suit} className={`${pipClass} rotate-180`} />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="h-full flex flex-col justify-between py-1 items-center">
        <SuitIcon suit={suit} className={pipClass} />
        <SuitIcon suit={suit} className={pipClass} />
        <SuitIcon suit={suit} className={`${pipClass} rotate-180`} />
      </div>
    );
  }
  if (rank === 4) {
    return (
      <div className="w-10 sm:w-12 h-full flex justify-between py-1">
        <div className="flex flex-col justify-between">
          <SuitIcon suit={suit} className={pipClass} />
          <SuitIcon suit={suit} className={`${pipClass} rotate-180`} />
        </div>
        <div className="flex flex-col justify-between">
          <SuitIcon suit={suit} className={pipClass} />
          <SuitIcon suit={suit} className={`${pipClass} rotate-180`} />
        </div>
      </div>
    );
  }
  if (rank === 5) {
    return (
      <div className="w-10 sm:w-12 h-full flex justify-between py-1 relative">
        <div className="flex flex-col justify-between">
          <SuitIcon suit={suit} className={pipClass} />
          <SuitIcon suit={suit} className={`${pipClass} rotate-180`} />
        </div>
        <div className="flex items-center justify-center">
          <SuitIcon suit={suit} className={pipClass} />
        </div>
        <div className="flex flex-col justify-between">
          <SuitIcon suit={suit} className={pipClass} />
          <SuitIcon suit={suit} className={`${pipClass} rotate-180`} />
        </div>
      </div>
    );
  }

  // 6 - 10: simplified clean pattern
  return (
    <div className="w-10 sm:w-12 h-full flex justify-between py-1">
      <div className="flex flex-col justify-around">
        <SuitIcon suit={suit} className={pipClass} />
        <SuitIcon suit={suit} className={pipClass} />
        {rank >= 7 && <SuitIcon suit={suit} className={`${pipClass} rotate-180`} />}
      </div>
      {rank % 2 !== 0 && (
        <div className="flex items-center justify-center">
          <SuitIcon suit={suit} className={pipClass} />
        </div>
      )}
      <div className="flex flex-col justify-around">
        <SuitIcon suit={suit} className={pipClass} />
        <SuitIcon suit={suit} className={pipClass} />
        {rank >= 7 && <SuitIcon suit={suit} className={`${pipClass} rotate-180`} />}
      </div>
    </div>
  );
}
