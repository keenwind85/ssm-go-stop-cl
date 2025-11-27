import { HwaTuCard, Player, ScoreYaku } from '../types';
import { GWANG_MONTHS, GODORI_CARDS, HONGDAN_CARDS, CHEONGDAN_CARDS, CHODAN_CARDS } from './cards';

// 점수 족보 정의
export const YAKU_LIST: ScoreYaku[] = [
  // 광 족보
  { name: 'five-gwang', korName: '오광', points: 15, description: '광 5장 모두 획득' },
  { name: 'four-gwang', korName: '사광', points: 4, description: '비광 제외 광 4장' },
  { name: 'bi-four-gwang', korName: '비사광', points: 3, description: '비광 포함 광 4장' },
  { name: 'three-gwang', korName: '삼광', points: 3, description: '비광 제외 광 3장' },
  { name: 'bi-three-gwang', korName: '비삼광', points: 2, description: '비광 포함 광 3장' },

  // 띠 족보
  { name: 'hongdan', korName: '홍단', points: 3, description: '홍단 3장 (1,2,3월 띠)' },
  { name: 'cheongdan', korName: '청단', points: 3, description: '청단 3장 (6,9,10월 띠)' },
  { name: 'chodan', korName: '초단', points: 3, description: '초단 3장 (4,5,7월 띠)' },

  // 열끗 족보
  { name: 'godori', korName: '고도리', points: 5, description: '고도리 3장 (2,4,8월 열끗)' },

  // 피 족보
  { name: 'pi-bonus', korName: '피', points: 1, description: '피 10장 이상시 1장당 1점' },
];

// 광 점수 계산
const calculateGwangScore = (gwangCards: HwaTuCard[]): { score: number; yaku: string[] } => {
  const gwangCount = gwangCards.length;
  const hasBiGwang = gwangCards.some(c => c.month === 12);
  const yaku: string[] = [];
  let score = 0;

  if (gwangCount === 5) {
    score = 15;
    yaku.push('오광');
  } else if (gwangCount === 4) {
    if (hasBiGwang) {
      score = 3;
      yaku.push('비사광');
    } else {
      score = 4;
      yaku.push('사광');
    }
  } else if (gwangCount === 3) {
    if (hasBiGwang) {
      score = 2;
      yaku.push('비삼광');
    } else {
      score = 3;
      yaku.push('삼광');
    }
  }

  return { score, yaku };
};

// 띠 점수 계산
const calculateTtiScore = (ttiCards: HwaTuCard[]): { score: number; yaku: string[] } => {
  let score = 0;
  const yaku: string[] = [];

  const cardIds = ttiCards.map(c => c.id);

  // 홍단 체크
  const hasHongdan = HONGDAN_CARDS.every(id => cardIds.includes(id));
  if (hasHongdan) {
    score += 3;
    yaku.push('홍단');
  }

  // 청단 체크
  const hasCheongdan = CHEONGDAN_CARDS.every(id => cardIds.includes(id));
  if (hasCheongdan) {
    score += 3;
    yaku.push('청단');
  }

  // 초단 체크
  const hasChodan = CHODAN_CARDS.every(id => cardIds.includes(id));
  if (hasChodan) {
    score += 3;
    yaku.push('초단');
  }

  // 띠 5장 이상 추가 점수
  if (ttiCards.length >= 5) {
    score += ttiCards.length - 4;
    yaku.push(`띠 ${ttiCards.length}장`);
  }

  return { score, yaku };
};

// 열끗(동물) 점수 계산
const calculateAnimalScore = (animalCards: HwaTuCard[]): { score: number; yaku: string[] } => {
  let score = 0;
  const yaku: string[] = [];

  const cardIds = animalCards.map(c => c.id);

  // 고도리 체크
  const hasGodori = GODORI_CARDS.every(id => cardIds.includes(id));
  if (hasGodori) {
    score += 5;
    yaku.push('고도리');
  }

  // 열끗 5장 이상 추가 점수
  if (animalCards.length >= 5) {
    score += animalCards.length - 4;
    yaku.push(`열끗 ${animalCards.length}장`);
  }

  return { score, yaku };
};

// 피 점수 계산
const calculatePiScore = (piCards: HwaTuCard[]): { score: number; yaku: string[] } => {
  // 피 점수 합계 (쌍피는 2점)
  const totalPiPoints = piCards.reduce((sum, card) => sum + card.points, 0);
  const yaku: string[] = [];
  let score = 0;

  // 피 10장 이상부터 점수
  if (totalPiPoints >= 10) {
    score = totalPiPoints - 9;
    yaku.push(`피 ${totalPiPoints}점`);
  }

  return { score, yaku };
};

// 전체 점수 계산
export const calculateTotalScore = (captured: Player['captured']): {
  totalScore: number;
  yakuList: string[];
  details: {
    gwang: { score: number; yaku: string[] };
    tti: { score: number; yaku: string[] };
    animal: { score: number; yaku: string[] };
    pi: { score: number; yaku: string[] };
  };
} => {
  const gwangResult = calculateGwangScore(captured.gwang);
  const ttiResult = calculateTtiScore(captured.tti);
  const animalResult = calculateAnimalScore(captured.animal);
  const piResult = calculatePiScore(captured.pi);

  const totalScore = gwangResult.score + ttiResult.score + animalResult.score + piResult.score;
  const yakuList = [...gwangResult.yaku, ...ttiResult.yaku, ...animalResult.yaku, ...piResult.yaku];

  return {
    totalScore,
    yakuList,
    details: {
      gwang: gwangResult,
      tti: ttiResult,
      animal: animalResult,
      pi: piResult,
    },
  };
};

// 최종 점수 계산 (고 보너스 적용)
export const calculateFinalScore = (baseScore: number, goCount: number): number => {
  // 고 1번당 점수 2배
  let multiplier = 1;
  for (let i = 0; i < goCount; i++) {
    multiplier *= 2;
  }
  return baseScore * multiplier;
};

// 판 확인 (3점 이상이면 판)
export const hasMinimumScore = (score: number): boolean => {
  return score >= 3;
};

// 승리 조건 체크
export const checkWinCondition = (player: Player, goCount: number): {
  canGo: boolean;
  canStop: boolean;
  score: number;
  yakuList: string[];
} => {
  const { totalScore, yakuList } = calculateTotalScore(player.captured);
  const finalScore = calculateFinalScore(totalScore, goCount);

  return {
    canGo: totalScore >= 3, // 3점 이상이면 고 가능
    canStop: totalScore >= 3, // 3점 이상이면 스톱 가능
    score: finalScore,
    yakuList,
  };
};
