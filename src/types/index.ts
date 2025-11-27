// 화투 카드 타입 정의
export type CardMonth = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type CardIndex = 1 | 2 | 3 | 4;
export type CardType = 'gwang' | 'tti' | 'animal' | 'pi'; // 광, 띠, 열끗(동물), 피

export interface HwaTuCard {
  id: string;
  month: CardMonth;
  index: CardIndex;
  type: CardType;
  subType?: 'hongdan' | 'cheongdan' | 'chodan' | 'godori' | 'ssang-pi'; // 홍단, 청단, 초단, 고도리, 쌍피
  imagePath: string;
  points: number; // 피 점수 (쌍피는 2점)
}

// 보너스 카드 (쌍피)
export interface BonusCard {
  id: string;
  index: number;
  imagePath: string;
  points: number;
}

// 플레이어 정보
export interface Player {
  id: string;
  nickname: string;
  isHost: boolean;
  isReady: boolean;
  hand: HwaTuCard[];
  captured: {
    gwang: HwaTuCard[];
    tti: HwaTuCard[];
    animal: HwaTuCard[];
    pi: HwaTuCard[];
  };
  score: number;
  totalPoints: number; // 피 점수 합
}

// 게임 상태
export type GamePhase =
  | 'waiting'      // 대기 중
  | 'dealing'      // 카드 배분 중
  | 'playing'      // 게임 진행 중
  | 'go-stop'      // 고/스톱 선택 중
  | 'finished';    // 게임 종료

// 게임 방 정보
export interface GameRoom {
  id: string;
  name: string;
  inviteCode: string;
  hostId: string;
  hostNickname: string;
  challengerId?: string;
  challengerNickname?: string;
  status: 'waiting' | 'ready' | 'playing' | 'finished';
  createdAt: number;
}

// 게임 상태
export interface GameState {
  roomId: string;
  phase: GamePhase;
  currentTurn: string; // 현재 턴인 플레이어 ID
  deck: HwaTuCard[];
  field: HwaTuCard[]; // 바닥패
  players: {
    [playerId: string]: Player;
  };
  selectedCard?: HwaTuCard;
  matchingCards?: HwaTuCard[];
  lastAction?: GameAction;
  goCount: { [playerId: string]: number }; // 고 횟수
  winner?: string;
  finalScore?: number;
  specialEvents: string[]; // 폭탄, 흔들기 등 이벤트 기록
}

// 게임 액션
export type GameAction =
  | { type: 'play_card'; playerId: string; card: HwaTuCard; targetCard?: HwaTuCard }
  | { type: 'draw_card'; playerId: string; card: HwaTuCard; targetCard?: HwaTuCard }
  | { type: 'capture'; playerId: string; cards: HwaTuCard[] }
  | { type: 'go'; playerId: string }
  | { type: 'stop'; playerId: string }
  | { type: 'shake'; playerId: string; month: CardMonth } // 흔들기
  | { type: 'bomb'; playerId: string; month: CardMonth }; // 폭탄

// 점수 족보
export interface ScoreYaku {
  name: string;
  korName: string;
  points: number;
  description: string;
}

// 애니메이션 이벤트
export interface AnimationEvent {
  type: 'deal' | 'play' | 'capture' | 'flip' | 'shake' | 'bomb' | 'go' | 'stop' | 'win';
  cardIds?: string[];
  playerId?: string;
  position?: { x: number; y: number };
  delay?: number;
}
