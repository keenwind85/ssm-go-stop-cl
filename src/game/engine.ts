import { GameState, HwaTuCard, Player, CardMonth, GameAction } from '../types';
import { findCardsByMonth } from './cards';
import { calculateTotalScore, calculateFinalScore, hasMinimumScore } from './scoring';

// 카드 플레이 가능 여부 확인
export const canPlayCard = (gameState: GameState, playerId: string, card: HwaTuCard): boolean => {
  if (gameState.currentTurn !== playerId) return false;
  if (gameState.phase !== 'playing') return false;

  const player = gameState.players[playerId];
  return player.hand.some(c => c.id === card.id);
};

// 바닥에서 매칭되는 카드 찾기
export const findMatchingCards = (field: HwaTuCard[], month: CardMonth): HwaTuCard[] => {
  return field.filter(card => card.month === month);
};

// 카드 내기 실행
export const playCard = (
  gameState: GameState,
  playerId: string,
  card: HwaTuCard,
  targetCardId?: string
): {
  newState: GameState;
  capturedCards: HwaTuCard[];
  needsSelection: boolean;
  matchingCards: HwaTuCard[];
} => {
  const state = JSON.parse(JSON.stringify(gameState)) as GameState;
  const player = state.players[playerId];

  // 손에서 카드 제거
  player.hand = player.hand.filter(c => c.id !== card.id);

  // 바닥에서 매칭 카드 찾기
  const matchingCards = findMatchingCards(state.field, card.month);

  let capturedCards: HwaTuCard[] = [];
  let needsSelection = false;

  if (matchingCards.length === 0) {
    // 매칭 없음 - 바닥에 내려놓기
    state.field.push(card);
  } else if (matchingCards.length === 1) {
    // 1장 매칭 - 자동 획득
    capturedCards = [card, matchingCards[0]];
    state.field = state.field.filter(c => c.id !== matchingCards[0].id);
  } else if (matchingCards.length === 2) {
    // 2장 매칭 - 선택 필요
    if (targetCardId) {
      const targetCard = matchingCards.find(c => c.id === targetCardId);
      if (targetCard) {
        capturedCards = [card, targetCard];
        state.field = state.field.filter(c => c.id !== targetCard.id);
      }
    } else {
      needsSelection = true;
      state.selectedCard = card;
      state.matchingCards = matchingCards;
    }
  } else if (matchingCards.length === 3) {
    // 3장 매칭 (싹쓸이) - 모두 획득
    capturedCards = [card, ...matchingCards];
    state.field = state.field.filter(c => !matchingCards.some(m => m.id === c.id));
  }

  return { newState: state, capturedCards, needsSelection, matchingCards };
};

// 뒷패 뒤집기
export const drawCard = (
  gameState: GameState,
  playerId: string
): {
  newState: GameState;
  drawnCard: HwaTuCard | null;
  capturedCards: HwaTuCard[];
  needsSelection: boolean;
  matchingCards: HwaTuCard[];
} => {
  const state = JSON.parse(JSON.stringify(gameState)) as GameState;

  if (state.deck.length === 0) {
    return { newState: state, drawnCard: null, capturedCards: [], needsSelection: false, matchingCards: [] };
  }

  const drawnCard = state.deck.shift()!;
  const matchingCards = findMatchingCards(state.field, drawnCard.month);

  let capturedCards: HwaTuCard[] = [];
  let needsSelection = false;

  if (matchingCards.length === 0) {
    state.field.push(drawnCard);
  } else if (matchingCards.length === 1) {
    capturedCards = [drawnCard, matchingCards[0]];
    state.field = state.field.filter(c => c.id !== matchingCards[0].id);
  } else if (matchingCards.length === 2) {
    // 뒷패에서 2장 매칭시 선택 필요
    needsSelection = true;
    state.selectedCard = drawnCard;
    state.matchingCards = matchingCards;
  } else if (matchingCards.length === 3) {
    capturedCards = [drawnCard, ...matchingCards];
    state.field = state.field.filter(c => !matchingCards.some(m => m.id === c.id));
  }

  return { newState: state, drawnCard, capturedCards, needsSelection, matchingCards };
};

// 카드 획득 처리
export const captureCards = (
  gameState: GameState,
  playerId: string,
  cards: HwaTuCard[]
): GameState => {
  const state = JSON.parse(JSON.stringify(gameState)) as GameState;
  const player = state.players[playerId];

  cards.forEach(card => {
    switch (card.type) {
      case 'gwang':
        player.captured.gwang.push(card);
        break;
      case 'tti':
        player.captured.tti.push(card);
        break;
      case 'animal':
        player.captured.animal.push(card);
        break;
      case 'pi':
        player.captured.pi.push(card);
        player.totalPoints += card.points;
        break;
    }
  });

  return state;
};

// 턴 종료 및 점수 확인
export const endTurn = (
  gameState: GameState,
  playerId: string
): {
  newState: GameState;
  canGoStop: boolean;
  score: number;
  yakuList: string[];
} => {
  const state = JSON.parse(JSON.stringify(gameState)) as GameState;
  const player = state.players[playerId];

  // 점수 계산
  const { totalScore, yakuList } = calculateTotalScore(player.captured);
  const currentGoCount = state.goCount[playerId] || 0;

  // 3점 이상이고 첫 번째 판이면 고/스톱 선택 가능
  const canGoStop = totalScore >= 3 &&
    (currentGoCount === 0 || totalScore > player.score);

  // 플레이어 점수 업데이트
  player.score = totalScore;

  // 덱/손패 소진 시 즉시 게임 종료 처리
  if (checkGameEnd(state)) {
    // 최종 점수 계산 후 승자 결정
    let winnerId: string | null = null;
    let topScore = -Infinity;
    Object.entries(state.players).forEach(([pid, p]) => {
      const { totalScore: ts, yakuList: yl } = calculateTotalScore(p.captured);
      const finalScore = calculateFinalScore(ts, state.goCount[pid] || 0);
      if (finalScore > topScore) {
        topScore = finalScore;
        winnerId = pid;
      } else if (finalScore === topScore) {
        winnerId = null; // 무승부
      }
      // 점수 반영
      p.score = ts;
    });

    state.phase = 'finished';
    state.finalScore = topScore;
    state.winner = winnerId || undefined;
    if (winnerId) {
      const winner = state.players[winnerId];
      const { yakuList: winnerYaku } = calculateTotalScore(winner.captured);
      state.specialEvents.push(`${winner.nickname}이(가) ${topScore}점으로 승리! (${winnerYaku.join(', ')})`);
    } else {
      state.specialEvents.push('덱과 손패가 모두 소진되어 무승부 처리');
    }

    // 선택 상태 초기화
    delete state.selectedCard;
    delete state.matchingCards;

    return { newState: state, canGoStop: false, score: totalScore, yakuList };
  }

  // 다음 턴으로
  const playerIds = Object.keys(state.players);
  const currentIndex = playerIds.indexOf(playerId);
  const nextPlayerId = playerIds[(currentIndex + 1) % playerIds.length];

  if (canGoStop) {
    state.phase = 'go-stop';
  } else {
    state.currentTurn = nextPlayerId;
  }

  // 선택 상태 초기화
  delete state.selectedCard;
  delete state.matchingCards;

  return { newState: state, canGoStop, score: totalScore, yakuList };
};

// 고 선언
export const declareGo = (
  gameState: GameState,
  playerId: string
): GameState => {
  const state = JSON.parse(JSON.stringify(gameState)) as GameState;

  state.goCount[playerId] = (state.goCount[playerId] || 0) + 1;
  state.phase = 'playing';
  state.specialEvents.push(`${state.players[playerId].nickname}이(가) ${state.goCount[playerId]}고!`);

  // 다음 턴으로
  const playerIds = Object.keys(state.players);
  const currentIndex = playerIds.indexOf(playerId);
  state.currentTurn = playerIds[(currentIndex + 1) % playerIds.length];

  return state;
};

// 스톱 선언 (게임 종료)
export const declareStop = (
  gameState: GameState,
  playerId: string
): GameState => {
  const state = JSON.parse(JSON.stringify(gameState)) as GameState;
  const player = state.players[playerId];

  const { totalScore, yakuList } = calculateTotalScore(player.captured);
  const goCount = state.goCount[playerId] || 0;
  const finalScore = calculateFinalScore(totalScore, goCount);

  state.phase = 'finished';
  state.winner = playerId;
  state.finalScore = finalScore;
  state.specialEvents.push(`${player.nickname}이(가) ${finalScore}점으로 승리! (${yakuList.join(', ')})`);

  return state;
};

// 손패에 같은 월 4장 확인 (폭탄)
export const checkBomb = (hand: HwaTuCard[]): CardMonth | null => {
  const monthCounts: Record<number, number> = {};
  hand.forEach(card => {
    monthCounts[card.month] = (monthCounts[card.month] || 0) + 1;
  });

  for (const [month, count] of Object.entries(monthCounts)) {
    if (count === 4) {
      return parseInt(month) as CardMonth;
    }
  }
  return null;
};

// 손패에 같은 월 3장 확인 (흔들기)
export const checkShake = (hand: HwaTuCard[]): CardMonth[] => {
  const monthCounts: Record<number, number> = {};
  hand.forEach(card => {
    monthCounts[card.month] = (monthCounts[card.month] || 0) + 1;
  });

  const shakeMonths: CardMonth[] = [];
  for (const [month, count] of Object.entries(monthCounts)) {
    if (count === 3) {
      shakeMonths.push(parseInt(month) as CardMonth);
    }
  }
  return shakeMonths;
};

// 게임 종료 확인 (덱이 비었을 때)
export const checkGameEnd = (gameState: GameState): boolean => {
  // 덱이 비고 모든 플레이어 손패가 빔
  if (gameState.deck.length === 0) {
    return Object.values(gameState.players).every(p => p.hand.length === 0);
  }
  return false;
};

// 무승부 처리 (나가리)
export const handleDraw = (gameState: GameState): GameState => {
  const state = JSON.parse(JSON.stringify(gameState)) as GameState;
  state.phase = 'finished';
  state.specialEvents.push('나가리! 무승부');
  return state;
};
