import { HwaTuCard, CardMonth, CardIndex, CardType } from '../types';

// 화투 카드 데이터 정의
// 한국 화투 기준 - 각 월별 4장, 총 48장

interface CardDefinition {
  month: CardMonth;
  index: CardIndex;
  type: CardType;
  subType?: 'hongdan' | 'cheongdan' | 'chodan' | 'godori' | 'ssang-pi';
  points: number;
}

// 화투 카드 정의 (대한민국 표준)
const CARD_DEFINITIONS: CardDefinition[] = [
  // 1월 - 송학 (솔)
  { month: 1, index: 1, type: 'gwang', points: 0 },      // 광 (학)
  { month: 1, index: 2, type: 'tti', subType: 'hongdan', points: 0 },  // 홍단
  { month: 1, index: 3, type: 'pi', points: 1 },
  { month: 1, index: 4, type: 'pi', points: 1 },

  // 2월 - 매조 (매화)
  { month: 2, index: 1, type: 'animal', subType: 'godori', points: 0 }, // 꾀꼬리 (고도리)
  { month: 2, index: 2, type: 'tti', subType: 'hongdan', points: 0 },   // 홍단
  { month: 2, index: 3, type: 'pi', points: 1 },
  { month: 2, index: 4, type: 'pi', points: 1 },

  // 3월 - 벚꽃
  { month: 3, index: 1, type: 'gwang', points: 0 },      // 광 (만)
  { month: 3, index: 2, type: 'tti', subType: 'hongdan', points: 0 },   // 홍단
  { month: 3, index: 3, type: 'pi', points: 1 },
  { month: 3, index: 4, type: 'pi', points: 1 },

  // 4월 - 등나무 (흑싸리)
  { month: 4, index: 1, type: 'animal', subType: 'godori', points: 0 }, // 두견새 (고도리)
  { month: 4, index: 2, type: 'tti', subType: 'chodan', points: 0 },    // 초단
  { month: 4, index: 3, type: 'pi', points: 1 },
  { month: 4, index: 4, type: 'pi', points: 1 },

  // 5월 - 난초 (창포)
  { month: 5, index: 1, type: 'animal', points: 0 },     // 나비
  { month: 5, index: 2, type: 'tti', subType: 'chodan', points: 0 },    // 초단
  { month: 5, index: 3, type: 'pi', points: 1 },
  { month: 5, index: 4, type: 'pi', points: 1 },

  // 6월 - 모란
  { month: 6, index: 1, type: 'animal', points: 0 },     // 나비
  { month: 6, index: 2, type: 'tti', subType: 'cheongdan', points: 0 }, // 청단
  { month: 6, index: 3, type: 'pi', points: 1 },
  { month: 6, index: 4, type: 'pi', points: 1 },

  // 7월 - 홍싸리
  { month: 7, index: 1, type: 'animal', points: 0 },     // 멧돼지
  { month: 7, index: 2, type: 'tti', subType: 'chodan', points: 0 },    // 초단
  { month: 7, index: 3, type: 'pi', points: 1 },
  { month: 7, index: 4, type: 'pi', points: 1 },

  // 8월 - 공산 (억새)
  { month: 8, index: 1, type: 'gwang', points: 0 },      // 광 (달)
  { month: 8, index: 2, type: 'animal', subType: 'godori', points: 0 }, // 기러기 (고도리)
  { month: 8, index: 3, type: 'pi', points: 1 },
  { month: 8, index: 4, type: 'pi', points: 1 },

  // 9월 - 국진 (국화)
  { month: 9, index: 1, type: 'animal', points: 0 },     // 술잔 (열끗)
  { month: 9, index: 2, type: 'tti', subType: 'cheongdan', points: 0 }, // 청단
  { month: 9, index: 3, type: 'pi', points: 1 },
  { month: 9, index: 4, type: 'pi', points: 1 },

  // 10월 - 단풍
  { month: 10, index: 1, type: 'animal', points: 0 },    // 사슴
  { month: 10, index: 2, type: 'tti', subType: 'cheongdan', points: 0 }, // 청단
  { month: 10, index: 3, type: 'pi', points: 1 },
  { month: 10, index: 4, type: 'pi', points: 1 },

  // 11월 - 오동
  { month: 11, index: 1, type: 'gwang', points: 0 },     // 광 (봉황)
  { month: 11, index: 2, type: 'animal', points: 0 },    // 봉황 열끗
  { month: 11, index: 3, type: 'pi', subType: 'ssang-pi', points: 2 },  // 쌍피
  { month: 11, index: 4, type: 'pi', points: 1 },

  // 12월 - 비 (비광)
  { month: 12, index: 1, type: 'gwang', points: 0 },     // 광 (비)
  { month: 12, index: 2, type: 'animal', points: 0 },    // 제비 열끗
  { month: 12, index: 3, type: 'tti', subType: 'hongdan', points: 0 },  // 홍단 (쌍피로 사용 가능)
  { month: 12, index: 4, type: 'pi', subType: 'ssang-pi', points: 2 },  // 쌍피
];

// 카드 ID 생성
const createCardId = (month: CardMonth, index: CardIndex): string => {
  return `${String(month).padStart(2, '0')}-${index}`;
};

// 카드 이미지 경로 생성
const getCardImagePath = (month: CardMonth, index: CardIndex): string => {
  return `/cards/${String(month).padStart(2, '0')}월_${index}.png`;
};

// 전체 화투 덱 생성
export const createDeck = (): HwaTuCard[] => {
  return CARD_DEFINITIONS.map(def => {
    const card: HwaTuCard = {
      id: createCardId(def.month, def.index),
      month: def.month,
      index: def.index,
      type: def.type,
      imagePath: getCardImagePath(def.month, def.index),
      points: def.points,
    };
    // subType이 있는 경우에만 추가 (undefined는 Firestore에서 에러 발생)
    if (def.subType) {
      card.subType = def.subType;
    }
    return card;
  });
};

// 덱 셔플 (Fisher-Yates 알고리즘)
export const shuffleDeck = (deck: HwaTuCard[]): HwaTuCard[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// 특정 월의 카드들 찾기
export const findCardsByMonth = (cards: HwaTuCard[], month: CardMonth): HwaTuCard[] => {
  return cards.filter(card => card.month === month);
};

// 카드 타입별 필터
export const filterByType = (cards: HwaTuCard[], type: CardType): HwaTuCard[] => {
  return cards.filter(card => card.type === type);
};

// 카드 뒷면 이미지 경로
export const CARD_BACK_IMAGE = '/cards/화투_뒷면.png';

// 광 카드 월 (1, 3, 8, 11, 12)
export const GWANG_MONTHS: CardMonth[] = [1, 3, 8, 11, 12];

// 고도리 카드 (2월, 4월, 8월의 동물 카드)
export const GODORI_CARDS = ['02-1', '04-1', '08-2'];

// 홍단 카드 (1, 2, 3월의 띠)
export const HONGDAN_CARDS = ['01-2', '02-2', '03-2'];

// 청단 카드 (6, 9, 10월의 띠)
export const CHEONGDAN_CARDS = ['06-2', '09-2', '10-2'];

// 초단 카드 (4, 5, 7월의 띠)
export const CHODAN_CARDS = ['04-2', '05-2', '07-2'];
