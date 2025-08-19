"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Card, { CardData } from './Card';
import { GameEngine, GameState, Player } from './GameEngine';
import { useAuth } from '../auth/AuthProvider';
import ErrorToast from './ErrorToast';

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
    return engine;
  });

  const [gameState, setGameState] = useState<GameState>(gameEngine.getGameState());
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [availableCards, setAvailableCards] = useState<CardData[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [draggedCard, setDraggedCard] = useState<CardData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [turnTimer, setTurnTimer] = useState<number>(30); // 30 sekund na turę
  const [isAnimatingBuda, setIsAnimatingBuda] = useState(false);
  const [isAnimatingDeal, setIsAnimatingDeal] = useState(false);

  const tableRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentPlayer = gameState.players.find(p => p.id === (user?.userId || 'player1'));
  const isMyTurn = gameEngine.getCurrentPlayer().id === (user?.userId || 'player1');
  const canTakeBuda = currentPlayer ? gameEngine.canTakeBuda(currentPlayer.id) : false;

  const updateAvailableCards = useCallback(() => {
    if (isMyTurn && currentPlayer) {
      const available = gameEngine.getAvailableCards(currentPlayer.id);
      setAvailableCards(available);
    } else {
      setAvailableCards([]);
    }
  }, [isMyTurn, currentPlayer, gameEngine]);

  const showError = useCallback((message: string) => {
    setErrorMessage(message);
    setShowErrorToast(true);
  }, []);

  const handleTakeBuda = useCallback(() => {
    if (!currentPlayer) return;

    const success = gameEngine.takeBuda(currentPlayer.id);
    if (success) {
      // Animacja zbierania Budy
      setIsAnimatingBuda(true);

      setTimeout(() => {
        setGameState(gameEngine.getGameState());
        updateAvailableCards();
        setIsAnimatingBuda(false);
      }, 1000);
    } else {
      showError('Nie można wziąć Budy w tej sytuacji.');
    }
  }, [currentPlayer, gameEngine, showError, updateAvailableCards]);

  const handleCardClick = useCallback((card: CardData) => {
    if (!isMyTurn) {
      showError('Poczekaj na swoją kolej!');
      return;
    }

    if (!availableCards.find(c => c.id === card.id)) {
      if (gameState.table.length === 0) {
        showError('Możesz zagrać dowolną kartę na początek tury.');
      } else if (!gameState.colorsAssigned) {
        showError('Musisz przebić kartę wyższą tego samego koloru lub zagrać Damę Trefl.');
      } else {
        showError('Nie możesz przebić tej karty. Zagraj wyższą kartę tego samego koloru lub swojego koloru.');
      }
      return;
    }

    if (selectedCard?.id === card.id) {
      setSelectedCard(null);
    } else {
      setSelectedCard(card);
    }
  }, [isMyTurn, availableCards, selectedCard, gameState, showError]);

  const handlePlayCard = useCallback(() => {
    if (!selectedCard || !currentPlayer) return;

    const success = gameEngine.playCard(currentPlayer.id, selectedCard);
    if (success) {
      setGameState(gameEngine.getGameState());
      setSelectedCard(null);
      setShowConfirmDialog(false);
      updateAvailableCards();
    } else {
      showError('Nie można zagrać tej karty. Spróbuj innej.');
      setShowConfirmDialog(false);
    }
  }, [selectedCard, currentPlayer, gameEngine, showError, updateAvailableCards]);

  // Animacja rozdawania kart przy starcie
  useEffect(() => {
    setIsAnimatingDeal(true);
    const dealTimer = setTimeout(() => {
      gameEngine.startGame();
      setGameState(gameEngine.getGameState());
      setIsAnimatingDeal(false);
    }, 2000);

    return () => clearTimeout(dealTimer);
  }, [gameEngine]);

  useEffect(() => {
    updateAvailableCards();

    // Reset timer przy zmianie tury
    if (isMyTurn) {
      setTurnTimer(30);
      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setTurnTimer(prev => {
          if (prev <= 1) {
            // Auto-skip turn lub auto-take buda
            if (canTakeBuda && currentPlayer) {
              handleTakeBuda();
            }
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, isMyTurn, canTakeBuda, currentPlayer, handleTakeBuda, updateAvailableCards]);

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
      } else {
        showError('Nie można zagrać tej karty na stół.');
      }
    }
    setDraggedCard(null);
  }, [draggedCard, currentPlayer, gameEngine, showError, updateAvailableCards]);

  const handleTableDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

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
          {isMyTurn && (
            <div className={`turn-timer ${turnTimer <= 10 ? 'timer-warning' : ''}`}>
              ⏱️ {turnTimer}s
            </div>
          )}
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
              <div className={`table-cards ${isAnimatingBuda ? 'buda-animation' : ''}`}>
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
                      '--card-offset': `${(index - currentPlayer.cards.length/2) * 60}px`,
                      '--card-rotation': `${(index - currentPlayer.cards.length/2) * 5}deg`,
                      transform: `translateX(${(index - currentPlayer.cards.length/2) * 60}px) translateY(${isSelected ? -20 : 0}px) rotate(${(index - currentPlayer.cards.length/2) * 5}deg)`,
                      zIndex: isSelected ? 100 : index
                    } as React.CSSProperties}
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

      {/* Animacja rozdawania kart */}
      {isAnimatingDeal && (
        <div className="dealing-animation">
          <div className="dealing-message">
            <h3>Rozdawanie kart...</h3>
            <div className="dealing-cards">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="dealing-card" style={{ animationDelay: `${i * 0.2}s` }}>
                  🂠
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      <ErrorToast
        message={errorMessage}
        isVisible={showErrorToast}
        onClose={() => setShowErrorToast(false)}
        duration={4000}
      />
    </div>
  );
}
