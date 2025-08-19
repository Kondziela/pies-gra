"use client";

import React from 'react';

export interface CardData {
  suit: 'trefl' | 'pik' | 'kier' | 'karo';
  rank: '9' | '10' | 'J' | 'Q' | 'K' | 'A';
  id: string;
}

export interface CardProps {
  card?: CardData;
  isHidden?: boolean;
  isAvailable?: boolean;
  isSelected?: boolean;
  isHighlighted?: boolean;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  style?: React.CSSProperties;
  className?: string;
}

export default function Card({
  card,
  isHidden = false,
  isAvailable = true,
  isSelected = false,
  isHighlighted = false,
  size = 'medium',
  onClick,
  onDragStart,
  onDragEnd,
  style,
  className = ''
}: CardProps) {
  const getSuitSymbol = (suit: CardData['suit']) => {
    switch (suit) {
      case 'trefl': return '♣';
      case 'pik': return '♠';
      case 'kier': return '♥';
      case 'karo': return '♦';
      default: return '';
    }
  };

  const getSuitColor = (suit: CardData['suit']) => {
    return suit === 'kier' || suit === 'karo' ? 'red' : 'black';
  };

  const getRankDisplay = (rank: CardData['rank']) => {
    switch (rank) {
      case 'J': return 'W';
      case 'Q': return 'D';
      case 'K': return 'K';
      case 'A': return 'A';
      default: return rank;
    }
  };

  const cardClasses = [
    'game-card',
    `card-${size}`,
    isHidden ? 'card-hidden' : 'card-visible',
    !isAvailable ? 'card-unavailable' : '',
    isSelected ? 'card-selected' : '',
    isHighlighted ? 'card-highlighted' : '',
    card ? `card-${getSuitColor(card.suit)}` : '',
    className
  ].filter(Boolean).join(' ');

  const handleClick = () => {
    if (onClick && isAvailable && !isHidden) {
      onClick();
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!isAvailable || isHidden) {
      e.preventDefault();
      return;
    }
    if (onDragStart) {
      onDragStart(e);
    }
    if (card) {
      e.dataTransfer.setData('application/json', JSON.stringify(card));
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  if (isHidden || !card) {
    return (
      <div
        className={cardClasses}
        style={style}
        onClick={handleClick}
      >
        <div className="card-back">
          <div className="card-pattern"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cardClasses}
      style={style}
      onClick={handleClick}
      draggable={isAvailable && !isHidden}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="card-face">
        <div className="card-corner top-left">
          <span className="card-rank">{getRankDisplay(card.rank)}</span>
          <span className="card-suit">{getSuitSymbol(card.suit)}</span>
        </div>

        <div className="card-center">
          <span className="card-suit-large">{getSuitSymbol(card.suit)}</span>
        </div>

        <div className="card-corner bottom-right">
          <span className="card-rank">{getRankDisplay(card.rank)}</span>
          <span className="card-suit">{getSuitSymbol(card.suit)}</span>
        </div>
      </div>
    </div>
  );
}
