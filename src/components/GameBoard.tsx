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
  const [turnBanner, setTurnBanner] = useState<string | null>(null);

  // 내 턴인데 손패가 없으면 자동으로 덱 뽑기 단계로 전환
  useEffect(() => {
    if (!gameState) return;
    if (gameState.currentTurn !== playerId) return;
    if (turnPhase !== 'select-hand') return;

    const myHandLength = gameState.players[playerId]?.hand.length || 0;
    if (myHandLength === 0) {
      setTurnPhase('draw');
      setSelectedHandCard(null);
      setMatchingFieldCards([]);
    }
  }, [gameState?.players[playerId]?.hand.length, gameState?.currentTurn, playerId, turnPhase, gameState]);

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

  // 턴 전환 알림
  useEffect(() => {
    if (!gameState) return;
    const isMyTurnNow = gameState.currentTurn === playerId;
    setTurnBanner(isMyTurnNow ? '내 턴입니다...' : '상대방 턴입니다...');
    const timer = setTimeout(() => setTurnBanner(null), 1400);
    return () => clearTimeout(timer);
  }, [gameState?.currentTurn, playerId, gameState]);

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
      <div className="flex items-center justify-center h-screen bg-secondary-light">
        <motion.div
          className="text-gray-10 text-2xl"
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
      <div className="min-h-screen bg-gradient-to-br from-primary-2 to-secondary-light flex items-center justify-center p-4">
        <motion.div
          className="bg-gradient-to-br from-primary-10 to-primary-8 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl text-gray-1"
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

          <h1 className="typo-h1 text-gray-1 mb-4">
            {isWinner ? '승리!' : '패배...'}
          </h1>

          {winner && (
            <>
              <p className="text-primary-2 text-xl mb-2">
                {winner.nickname}의 승리
              </p>
              <p className="text-4xl font-bold text-gray-1 mb-4">
                {gameState.finalScore}점
              </p>
            </>
          )}

          <div className="text-primary-4 text-sm">
            {gameState.specialEvents.slice(-3).map((event, idx) => (
              <div key={idx}>{event}</div>
            ))}
          </div>

          <button
            className="mt-6 bg-gray-1 text-primary-10 font-semibold py-3 px-8 rounded-full shadow-lg"
            onClick={() => window.location.reload()}
          >
            새 게임
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen board-felt p-2 sm:p-4 text-white">
      {/* 알림 */}
      <AnimatePresence>
        {notification && (
          <motion.div
            className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-primary-10 text-white font-semibold px-6 py-3 rounded-full z-50 shadow-lg"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
          >
            {notification}
          </motion.div>
        )}
        {turnBanner && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-black/70 text-white text-2xl sm:text-3xl font-extrabold px-6 py-4 rounded-2xl shadow-2xl"
              initial={{ scale: 0.9, y: -10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: -10, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {turnBanner}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto space-y-4">
        {/* 상대방 영역 */}
        <div className="section-opponent rounded-2xl p-3 space-y-2 shadow-lg text-white">
          <ScoreBoard
            player={opponent}
            isMe={false}
            goCount={gameState.goCount[opponent.id] || 0}
          />
          <Hand
            cards={opponent.hand}
            isMyHand={false}
            isCurrentTurn={gameState.currentTurn === opponent.id}
            playerName={opponent.nickname}
          />
        </div>

        {/* 덱 & 바닥 영역 */}
        <div className="section-field rounded-2xl p-4 shadow-lg space-y-3 text-white">
          <div className="flex gap-4 items-start">
            {/* 덱 */}
            <div className="flex flex-col items-center relative">
              {turnPhase === 'draw' && isMyTurn && (
                <motion.div
                  className="absolute -top-6 left-1/2 -translate-x-1/2 text-primary-10 text-3xl drop-shadow-lg arrow-bounce"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  ⬇
                </motion.div>
              )}
              <motion.div
                className={`cursor-pointer ${turnPhase === 'draw' && isMyTurn ? 'ring-4 ring-primary-8 neon-border' : ''}`}
                whileHover={turnPhase === 'draw' ? { scale: 1.1 } : {}}
                whileTap={turnPhase === 'draw' ? { scale: 0.95 } : {}}
                onClick={turnPhase === 'draw' ? handleDrawCard : undefined}
              >
                <img
                  src={CARD_BACK_IMAGE}
                  alt="덱"
                  className="w-20 h-30 rounded-lg shadow-lg"
                />
              </motion.div>
            <span className="text-white text-xs mt-1">
              덱 ({gameState.deck.length})
            </span>
              {turnPhase === 'draw' && isMyTurn && (
                <motion.span
                  className="text-white text-xs mt-1"
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
                  <span className="text-white text-sm block mb-1">뽑은 카드</span>
                  <Card card={drawnCard} size="medium" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 내 영역 */}
        <div className="section-me rounded-2xl p-3 space-y-2 shadow-lg text-white">
          <Hand
            cards={myPlayer.hand}
            isMyHand={true}
            isCurrentTurn={isMyTurn}
            selectedCardId={selectedHandCard?.id}
            onCardSelect={handleHandCardSelect}
            playerName={myPlayer.nickname}
            fieldCards={gameState.field}
          />
          <ScoreBoard
            player={myPlayer}
            isMe={true}
            goCount={gameState.goCount[playerId] || 0}
          />
        </div>

        {/* 턴 안내 */}
        <div className="text-center text-white text-sm font-semibold">
          {isMyTurn ? (
            <span className="text-white font-semibold">
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
