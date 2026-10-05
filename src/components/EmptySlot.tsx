import React from 'react';
import { Suit } from '../types/solitaire';
import { SuitIcon } from './SuitIcon';
import { RotateCcw } from 'lucide-react';

interface EmptySlotProps {
  type: 'stock' | 'waste' | 'foundation' | 'tableau';
  foundationSuit?: Suit;
  isDropTarget?: boolean;
  isHinted?: boolean;
  className?: string;
  onClick?: () => void;
}

export const EmptySlot: React.FC<EmptySlotProps> = ({
  type,
  foundationSuit,
  isDropTarget = false,
  isHinted = false,
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative aspect-[5/7] w-full rounded-xl flex items-center justify-center select-none transition-all duration-150 ${
        isDropTarget
          ? 'border-2 border-blue-500 bg-blue-50/40 shadow-sm'
          : isHinted
          ? 'border-2 border-dashed border-amber-400 bg-amber-50/30 animate-pulse'
          : 'border border-dashed border-zinc-200 bg-zinc-50/50 hover:border-zinc-300'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {type === 'stock' && (
        <div className="flex flex-col items-center justify-center text-zinc-400 gap-1">
          <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 opacity-60" />
          <span className="text-[10px] sm:text-xs font-medium text-zinc-400">Talia</span>
        </div>
      )}

      {type === 'foundation' && foundationSuit && (
        <div className="opacity-20 flex items-center justify-center text-zinc-900">
          <SuitIcon suit={foundationSuit} className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>
      )}

      {type === 'tableau' && (
        <div className="opacity-20 flex items-center justify-center">
          <span className="text-xl sm:text-2xl font-semibold text-zinc-400 tracking-tight">K</span>
        </div>
      )}
    </div>
  );
};
