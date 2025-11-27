import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState, HwaTuCard, Player } from '../types';
import { subscribeToGameState, updateGameState } from '../firebase/roomService';
import { playCard, drawCard, captureCards, endTurn, declareGo, declareStop } from '../game/engine';
import { calculateTotalScore } from '../game/scoring';
import Hand from './Hand';
import Field from './Field';
import ScoreBoard from './ScoreBoard';
import GoStopModal from './GoStopModal';
import Card from './Card';
import { CARD_BACK_IMAGE } from '../game/cards';

interface GameBoardProps {
  roomId: string;
  playerId: string;
}

type TurnPhase = 'select-hand' | 'select-field' | 'draw' | 'select-field-draw' | 'complete';

const GameBoard: React.FC<GameBoardProps> = ({ roomId, playerId }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [turnPhase, setTurnPhase] = useState<TurnPhase>('select-hand');
  const [selectedHandCard, setSelectedHandCard] = useState<HwaTuCard | null>(null);
  const [matchingFieldCards, setMatchingFieldCards] = useState<HwaTuCard[]>([]);
  const [pendingCapture, setPendingCapture] = useState<HwaTuCard[]>([]);
  const [drawnCard, setDrawnCard] = useState<HwaTuCard | null>(null);
  const [showGoStop, setShowGoStop] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [currentYaku, setCurrentYaku] = useState<string[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // 게임 상태 구독
  useEffect(() => {
    const unsubscribe = subscribeToGameState(roomId, (state) => {
      setGameState(state);

      if (state && state.phase === 'go-stop' && state.currentTurn === playerId) {
        const player = state.players[playerId];
        const { totalScore, yakuList } = calculateTotalScore(player.captured);
        setCurrentScore(totalScore);
        setCurrentYaku(yakuList);
        setShowGoStop(true);
      } else {
        setShowGoStop(false);
      }
    });

    return unsubscribe;
  }, [roomId, playerId]);

  // 알림 표시
  const showNotification = useCallback((message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 2000);
  }, []);

  // 턴 리셋
  const resetTurn = useCallback(() => {
    setTurnPhase('select-hand');
    setSelectedHandCard(null);
    setMatchingFieldCards([]);
    setPendingCapture([]);
    setDrawnCard(null);
  }, []);

  // 손패 카드 선택
  const handleHandCardSelect = useCallback(async (card: HwaTuCard) => {
    if (!gameState || gameState.currentTurn !== playerId) return;
    if (turnPhase !== 'select-hand') return;

    const result = playCard(gameState, playerId, card);

    if (result.needsSelection) {
      // 바닥에서 카드 선택 필요
      setSelectedHandCard(card);
      setMatchingFieldCards(result.matchingCards);
      setTurnPhase('select-field');
      showNotification('매칭 카드를 선택하세요!');
    } else {
      // 자동 처리
      let newState = result.newState;

      if (result.capturedCards.length > 0) {
        newState = captureCards(newState, playerId, result.capturedCards);
        showNotification(`${result.capturedCards.length}장 획득!`);
      }

      // 뒷패 뽑기로 진행
      await updateGameState(roomId, newState);
      setTurnPhase('draw');
      setPendingCapture(result.capturedCards);
    }
  }, [gameState, playerId, roomId, turnPhase, showNotification]);

  // 바닥 카드 선택 (매칭시)
  const handleFieldCardSelect = useCallback(async (card: HwaTuCard) => {
    if (!gameState || !selectedHandCard) return;

    const result = playCard(gameState, playerId, selectedHandCard, card.id);
    let newState = result.newState;

    if (result.capturedCards.length > 0) {
      newState = captureCards(newState, playerId, result.capturedCards);
      showNotification(`${result.capturedCards.length}장 획득!`);
    }

    await updateGameState(roomId, newState);
    setTurnPhase('draw');
    setPendingCapture(result.capturedCards);
    setSelectedHandCard(null);
    setMatchingFieldCards([]);
  }, [gameState, playerId, roomId, selectedHandCard, showNotification]);

  // 뒷패 뽑기
  const handleDrawCard = useCallback(async () => {
    if (!gameState || turnPhase !== 'draw') return;

    const result = drawCard(gameState, playerId);

    if (result.needsSelection) {
      setDrawnCard(result.drawnCard);
      setMatchingFieldCards(result.matchingCards);
      setTurnPhase('select-field-draw');
      showNotification('매칭 카드를 선택하세요!');
      await updateGameState(roomId, result.newState);
    } else {
      let newState = result.newState;

      if (result.capturedCards.length > 0) {
        newState = captureCards(newState, playerId, result.capturedCards);
        showNotification(`${result.capturedCards.length}장 획득!`);
      }

      // 턴 종료
      const turnResult = endTurn(newState, playerId);
      await updateGameState(roomId, turnResult.newState);

      if (turnResult.canGoStop) {
        setCurrentScore(turnResult.score);
        setCurrentYaku(turnResult.yakuList);
        setShowGoStop(true);
      } else {
        resetTurn();
      }
    }
  }, [gameState, playerId, roomId, turnPhase, showNotification, resetTurn]);

  // 뒷패 매칭 카드 선택
  const handleDrawFieldSelect = useCallback(async (card: HwaTuCard) => {
    if (!gameState || !drawnCard) return;

    let newState = { ...gameState };
    const capturedCards = [drawnCard, card];

    newState.field = newState.field.filter(c => c.id !== card.id);
    newState = captureCards(newState, playerId, capturedCards);
    showNotification(`${capturedCards.length}장 획득!`);

    // 턴 종료
    const turnResult = endTurn(newState, playerId);
    await updateGameState(roomId, turnResult.newState);

    if (turnResult.canGoStop) {
      setCurrentScore(turnResult.score);
      setCurrentYaku(turnResult.yakuList);
      setShowGoStop(true);
    } else {
      resetTurn();
    }

    setDrawnCard(null);
    setMatchingFieldCards([]);
  }, [gameState, drawnCard, playerId, roomId, showNotification, resetTurn]);

  // 고 선언
  const handleGo = useCallback(async () => {
    if (!gameState) return;

    const newState = declareGo(gameState, playerId);
    await updateGameState(roomId, newState);
    setShowGoStop(false);
    resetTurn();
    showNotification('🔥 고! 점수 2배!');
  }, [gameState, playerId, roomId, resetTurn, showNotification]);

  // 스톱 선언
  const handleStop = useCallback(async () => {
    if (!gameState) return;

    const newState = declareStop(gameState, playerId);
    await updateGameState(roomId, newState);
    setShowGoStop(false);
  }, [gameState, playerId, roomId]);

  if (!gameState) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <motion.div
          className="text-white text-2xl"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          게임 로딩 중...
        </motion.div>
      </div>
    );
  }

  const players = Object.values(gameState.players);
  const myPlayer = gameState.players[playerId];
  const opponent = players.find(p => p.id !== playerId)!;
  const isMyTurn = gameState.currentTurn === playerId;

  // 게임 종료 화면
  if (gameState.phase === 'finished') {
    const winner = gameState.winner ? gameState.players[gameState.winner] : null;
    const isWinner = gameState.winner === playerId;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
        <motion.div
          className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring' }}
        >
          <motion.div
            className="text-6xl mb-4"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            {isWinner ? '🎉' : '😢'}
          </motion.div>

          <h1 className="text-3xl font-bold text-white mb-4">
            {isWinner ? '승리!' : '패배...'}
          </h1>

          {winner && (
            <>
              <p className="text-yellow-400 text-xl mb-2">
                {winner.nickname}의 승리
              </p>
              <p className="text-4xl font-bold text-yellow-300 mb-4">
                {gameState.finalScore}점
              </p>
            </>
          )}

          <div className="text-gray-400 text-sm">
            {gameState.specialEvents.slice(-3).map((event, idx) => (
              <div key={idx}>{event}</div>
            ))}
          </div>

          <button
            className="mt-6 bg-yellow-500 text-black font-bold py-3 px-8 rounded-full"
            onClick={() => window.location.reload()}
          >
            새 게임
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 p-2 sm:p-4">
      {/* 알림 */}
      <AnimatePresence>
        {notification && (
          <motion.div
            className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black font-bold px-6 py-3 rounded-full z-50 shadow-lg"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto space-y-3">
        {/* 상대방 점수판 */}
        <ScoreBoard
          player={opponent}
          isMe={false}
          goCount={gameState.goCount[opponent.id] || 0}
        />

        {/* 상대방 손패 */}
        <Hand
          cards={opponent.hand}
          isMyHand={false}
          isCurrentTurn={gameState.currentTurn === opponent.id}
          playerName={opponent.nickname}
        />

        {/* 덱 & 바닥 */}
        <div className="flex gap-4 items-start">
          {/* 덱 */}
          <div className="flex flex-col items-center">
            <motion.div
              className={`cursor-pointer ${turnPhase === 'draw' && isMyTurn ? 'ring-4 ring-yellow-400' : ''}`}
              whileHover={turnPhase === 'draw' ? { scale: 1.1 } : {}}
              whileTap={turnPhase === 'draw' ? { scale: 0.95 } : {}}
              onClick={turnPhase === 'draw' ? handleDrawCard : undefined}
            >
              <img
                src={CARD_BACK_IMAGE}
                alt="덱"
                className="w-16 h-24 rounded-lg shadow-lg"
              />
            </motion.div>
            <span className="text-gray-400 text-xs mt-1">
              덱 ({gameState.deck.length})
            </span>
            {turnPhase === 'draw' && isMyTurn && (
              <motion.span
                className="text-yellow-400 text-xs mt-1"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                클릭!
              </motion.span>
            )}
          </div>

          {/* 바닥 */}
          <div className="flex-1">
            <Field
              cards={gameState.field}
              matchingCards={matchingFieldCards}
              isSelecting={turnPhase === 'select-field' || turnPhase === 'select-field-draw'}
              onCardSelect={turnPhase === 'select-field' ? handleFieldCardSelect : handleDrawFieldSelect}
            />
          </div>
        </div>

        {/* 뽑은 카드 표시 */}
        <AnimatePresence>
          {drawnCard && (
            <motion.div
              className="flex justify-center"
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
            >
              <div className="text-center">
                <span className="text-yellow-400 text-sm block mb-1">뽑은 카드</span>
                <Card card={drawnCard} size="medium" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 내 손패 */}
        <Hand
          cards={myPlayer.hand}
          isMyHand={true}
          isCurrentTurn={isMyTurn}
          selectedCardId={selectedHandCard?.id}
          onCardSelect={handleHandCardSelect}
          playerName={myPlayer.nickname}
        />

        {/* 내 점수판 */}
        <ScoreBoard
          player={myPlayer}
          isMe={true}
          goCount={gameState.goCount[playerId] || 0}
        />

        {/* 턴 안내 */}
        <div className="text-center text-gray-400 text-sm">
          {isMyTurn ? (
            <span className="text-yellow-400 font-bold">
              {turnPhase === 'select-hand' && '패에서 카드를 선택하세요'}
              {turnPhase === 'select-field' && '바닥에서 매칭 카드를 선택하세요'}
              {turnPhase === 'draw' && '덱을 클릭하여 카드를 뽑으세요'}
              {turnPhase === 'select-field-draw' && '바닥에서 매칭 카드를 선택하세요'}
            </span>
          ) : (
            <span>상대방 턴입니다...</span>
          )}
        </div>
      </div>

      {/* 고/스톱 모달 */}
      <GoStopModal
        isOpen={showGoStop}
        score={currentScore}
        yakuList={currentYaku}
        goCount={gameState.goCount[playerId] || 0}
        onGo={handleGo}
        onStop={handleStop}
      />
    </div>
  );
};

export default GameBoard;
