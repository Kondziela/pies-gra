"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Card, { CardData } from './Card';
import { GameEngine, GameState, Player } from './GameEngine';
import { useAuth } from '../auth/AuthProvider';

interface GameBoardProps {
  onBack: () => void;
}

export default function GameBoard({ onBack }: GameBoardProps) {
  const { user } = useAuth();
  const [gameEngine] = useState(() => {
    // Mock players for demo
    const mockPlayers = [
      { id: user?.userId || 'player1', name: user?.username || 'Ty', isHost: true, position: 0 },
      { id: 'player2', name: 'Bot Anna', isHost: false, position: 1 },
      { id: 'player3', name: 'Bot Marek', isHost: false, position: 2 },
      { id: 'player4', name: 'Bot Kasia', isHost: false, position: 3 }
    ];

    const engine = new GameEngine('demo-game', mockPlayers);
    engine.startGame();
    return engine;
  });

  const [gameState, setGameState] = useState<GameState>(gameEngine.getGameState());
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [availableCards, setAvailableCards] = useState<CardData[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [draggedCard, setDraggedCard] = useState<CardData | null>(null);

  const tableRef = useRef<HTMLDivElement>(null);

  const currentPlayer = gameState.players.find(p => p.id === (user?.userId || 'player1'));
  const isMyTurn = gameEngine.getCurrentPlayer().id === (user?.userId || 'player1');

  useEffect(() => {
    updateAvailableCards();
  }, [gameState, isMyTurn]);

  const updateAvailableCards = () => {
    if (isMyTurn && currentPlayer) {
      const available = gameEngine.getAvailableCards(currentPlayer.id);
      setAvailableCards(available);
    } else {
      setAvailableCards([]);
    }
  };

  const handleCardClick = useCallback((card: CardData) => {
    if (!isMyTurn || !availableCards.find(c => c.id === card.id)) {
      return;
    }

    if (selectedCard?.id === card.id) {
      setSelectedCard(null);
    } else {
      setSelectedCard(card);
    }
  }, [isMyTurn, availableCards, selectedCard]);

  const handlePlayCard = useCallback(() => {
    if (!selectedCard || !currentPlayer) return;

    const success = gameEngine.playCard(currentPlayer.id, selectedCard);
    if (success) {
      setGameState(gameEngine.getGameState());
      setSelectedCard(null);
      setShowConfirmDialog(false);
      updateAvailableCards();
    }
  }, [selectedCard, currentPlayer, gameEngine]);

  const handleTakeBuda = useCallback(() => {
    if (!currentPlayer) return;

    const success = gameEngine.takeBuda(currentPlayer.id);
    if (success) {
      setGameState(gameEngine.getGameState());
      updateAvailableCards();
    }
  }, [currentPlayer, gameEngine]);

  const handleCardDragStart = useCallback((card: CardData) => (e: React.DragEvent) => {
    if (!isMyTurn || !availableCards.find(c => c.id === card.id)) {
      e.preventDefault();
      return;
    }
    setDraggedCard(card);
  }, [isMyTurn, availableCards]);

  const handleCardDragEnd = useCallback(() => {
    setDraggedCard(null);
  }, []);

  const handleTableDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (draggedCard && currentPlayer) {
      const success = gameEngine.playCard(currentPlayer.id, draggedCard);
      if (success) {
        setGameState(gameEngine.getGameState());
        updateAvailableCards();
      }
    }
    setDraggedCard(null);
  }, [draggedCard, currentPlayer, gameEngine]);

  const handleTableDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const canTakeBuda = currentPlayer ? gameEngine.canTakeBuda(currentPlayer.id) : false;

  const getPlayerPosition = (position: number) => {
    const positions = ['bottom', 'left', 'top', 'right'];
    return positions[position];
  };

  const renderPlayer = (player: Player, position: string) => {
    const isCurrentPlayer = player.id === gameEngine.getCurrentPlayer().id;
    const isMe = player.id === currentPlayer?.id;

    return (
      <div key={player.id} className={`player-area player-${position} ${isCurrentPlayer ? 'active-player' : ''}`}>
        <div className="player-info">
          <div className="player-avatar">
            {player.name.charAt(0).toUpperCase()}
          </div>
          <div className="player-details">
            <span className="player-name">{player.name}</span>
            <span className="card-count">{player.cards.length} kart</span>
            {player.assignedColor && (
              <span className={`player-color color-${player.assignedColor}`}>
                {getColorSymbol(player.assignedColor)}
              </span>
            )}
          </div>
        </div>

        {!isMe && (
          <div className="opponent-cards">
            {player.cards.map((_, index) => (
              <Card
                key={index}
                isHidden={true}
                size="small"
                className="opponent-card"
                style={{ 
                  transform: `translateX(${index * -2}px) rotate(${(index - player.cards.length/2) * 2}deg)`,
                  zIndex: index
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const getColorSymbol = (color: string) => {
    switch (color) {
      case 'trefl': return '♣';
      case 'pik': return '♠';
      case 'kier': return '♥';
      case 'karo': return '♦';
      default: return '';
    }
  };

  return (
    <div className="game-board">
      <div className="game-header">
        <button className="back-button" onClick={onBack}>
          ← Opuść grę
        </button>
        <div className="game-info">
          <span className="round-info">Runda {gameState.round}</span>
          <span className="turn-info">
            {isMyTurn ? 'Twoja kolej' : `Kolej: ${gameEngine.getCurrentPlayer().name}`}
          </span>
        </div>
      </div>

      <div className="game-container">
        {/* Gracze na górze i bokach */}
        {gameState.players.map(player => {
          if (player.id === currentPlayer?.id) return null;
          const position = getPlayerPosition(player.position);
          return renderPlayer(player, position);
        })}

        {/* Centralny stół */}
        <div 
          className="table-area"
          ref={tableRef}
          onDrop={handleTableDrop}
          onDragOver={handleTableDragOver}
        >
          <div className="table-surface">
            {gameState.table.length === 0 ? (
              <div className="empty-table">
                <span>Zagraj pierwszą kartę</span>
              </div>
            ) : (
              <div className="table-cards">
                {gameState.table.map((card, index) => (
                  <Card
                    key={`${card.id}-${index}`}
                    card={card}
                    size="medium"
                    className="table-card"
                    style={{
                      transform: `translateX(${index * 20}px) translateY(${index * 5}px) rotate(${index * 3}deg)`,
                      zIndex: index
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Przycisk Weź Budę */}
          {canTakeBuda && isMyTurn && (
            <button 
              className="take-buda-btn"
              onClick={handleTakeBuda}
            >
              🗂️ Weź Budę
            </button>
          )}
        </div>

        {/* Ręka gracza (na dole) */}
        {currentPlayer && (
          <div className="player-hand">
            <div className="hand-cards">
              {currentPlayer.cards.map((card, index) => {
                const isAvailable = availableCards.find(c => c.id === card.id) !== undefined;
                const isSelected = selectedCard?.id === card.id;

                return (
                  <Card
                    key={card.id}
                    card={card}
                    isAvailable={isAvailable}
                    isSelected={isSelected}
                    isHighlighted={isAvailable && isMyTurn}
                    size="medium"
                    onClick={() => handleCardClick(card)}
                    onDragStart={handleCardDragStart(card)}
                    onDragEnd={handleCardDragEnd}
                    className="hand-card"
                    style={{
                      transform: `translateX(${(index - currentPlayer.cards.length/2) * 60}px) translateY(${isSelected ? -20 : 0}px) rotate(${(index - currentPlayer.cards.length/2) * 5}deg)`,
                      zIndex: isSelected ? 100 : index
                    }}
                  />
                );
              })}
            </div>

            {/* Przyciski akcji */}
            <div className="action-buttons">
              {selectedCard && (
                <button 
                  className="action-button primary"
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={!isMyTurn}
                >
                  🎯 Zagraj kartę
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dialog potwierdzenia */}
      {showConfirmDialog && selectedCard && (
        <div className="confirm-dialog">
          <div className="dialog-content">
            <h3>Potwierdź ruch</h3>
            <p>Czy chcesz zagrać kartę:</p>
            <Card 
              card={selectedCard} 
              size="medium"
              className="confirm-card"
            />
            <div className="dialog-actions">
              <button 
                className="action-button tertiary"
                onClick={() => setShowConfirmDialog(false)}
              >
                Anuluj
              </button>
              <button 
                className="action-button primary"
                onClick={handlePlayCard}
              >
                Zagraj
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
