import React from 'react';
import { Suit } from '../types/solitaire';

interface SuitIconProps {
  suit: Suit;
  className?: string;
  size?: number;
}

export const SuitIcon: React.FC<SuitIconProps> = ({ suit, className = 'w-4 h-4', size }) => {
  const style = size ? { width: size, height: size } : undefined;

  switch (suit) {
    case 'hearts':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
          style={style}
          aria-hidden="true"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      );
    case 'diamonds':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
          style={style}
          aria-hidden="true"
        >
          <path d="M12 2L3.5 12 12 22 20.5 12 12 2z" />
        </svg>
      );
    case 'spades':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
          style={style}
          aria-hidden="true"
        >
          <path d="M12 2C9.5 5.5 4 10.5 4 14.5 4 17.54 6.46 20 9.5 20c1.07 0 2.06-.31 2.5-.84V22h-2v1h4v-1h-2v-2.84c.44.53 1.43.84 2.5.84 3.04 0 5.5-2.46 5.5-5.5 0-4-5.5-9-8-12.5z" />
        </svg>
      );
    case 'clubs':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
          style={style}
          aria-hidden="true"
        >
          <path d="M12 2c-2.21 0-4 1.79-4 4 0 .73.2 1.41.54 2-1.84.22-3.54 1.71-3.54 3.75 0 2.21 1.79 4 4 4 .68 0 1.32-.17 1.88-.47L10 18v3H8v1h8v-1h-2v-3l-.88-2.72c.56.3 1.2.47 1.88.47 2.21 0 4-1.79 4-4 0-2.04-1.7-3.53-3.54-3.75.34-.59.54-1.27.54-2 0-2.21-1.79-4-4-4z" />
        </svg>
      );
  }
};
