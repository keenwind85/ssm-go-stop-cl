import {
  roomsCollection,
  gamesCollection,
  roomDoc,
  gameDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  addDoc
} from './config';
import { GameRoom, GameState, Player } from '../types';
import { createDeck, shuffleDeck } from '../game/cards';
import { nanoid } from 'nanoid';

// 초대코드 생성 (6자리 영문+숫자)
export const generateInviteCode = (): string => {
  return nanoid(6).toUpperCase();
};

// 방 생성
export const createRoom = async (hostNickname: string, roomName: string): Promise<GameRoom> => {
  const roomId = nanoid(12);
  const inviteCode = generateInviteCode();
  const hostId = nanoid(10);

  const room: GameRoom = {
    id: roomId,
    name: roomName,
    inviteCode,
    hostId,
    hostNickname,
    status: 'waiting',
    createdAt: Date.now(),
  };

  await setDoc(roomDoc(roomId), room);

  // 로컬 스토리지에 플레이어 ID 저장
  localStorage.setItem('playerId', hostId);
  localStorage.setItem('currentRoomId', roomId);

  return room;
};

// 초대코드로 방 찾기
export const findRoomByInviteCode = async (inviteCode: string): Promise<GameRoom | null> => {
  const q = query(roomsCollection, where('inviteCode', '==', inviteCode.toUpperCase()));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  return snapshot.docs[0].data() as GameRoom;
};

// 방 참여 (도전자)
export const joinRoom = async (roomId: string, challengerNickname: string): Promise<{ room: GameRoom; playerId: string }> => {
  const docRef = roomDoc(roomId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    throw new Error('방을 찾을 수 없습니다.');
  }

  const room = snapshot.data() as GameRoom;

  if (room.challengerId) {
    throw new Error('이미 다른 플레이어가 참여했습니다.');
  }

  const challengerId = nanoid(10);

  await updateDoc(docRef, {
    challengerId,
    challengerNickname,
    status: 'ready',
  });

  localStorage.setItem('playerId', challengerId);
  localStorage.setItem('currentRoomId', roomId);

  return {
    room: { ...room, challengerId, challengerNickname, status: 'ready' },
    playerId: challengerId,
  };
};

// 방 상태 구독
export const subscribeToRoom = (roomId: string, callback: (room: GameRoom | null) => void): () => void => {
  const docRef = roomDoc(roomId);
  const unsubscribe = onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as GameRoom);
    } else {
      callback(null);
    }
  });
  return unsubscribe;
};

// 게임 시작 (초기 상태 설정)
export const startGame = async (roomId: string, room: GameRoom): Promise<void> => {
  const deck = shuffleDeck(createDeck());

  // 카드 분배: 각 플레이어 10장, 바닥 8장
  const hostHand = deck.splice(0, 10);
  const challengerHand = deck.splice(0, 10);
  const field = deck.splice(0, 8);
  const remainingDeck = deck;

  const hostPlayer: Player = {
    id: room.hostId,
    nickname: room.hostNickname,
    isHost: true,
    isReady: true,
    hand: hostHand,
    captured: { gwang: [], tti: [], animal: [], pi: [] },
    score: 0,
    totalPoints: 0,
  };

  const challengerPlayer: Player = {
    id: room.challengerId!,
    nickname: room.challengerNickname!,
    isHost: false,
    isReady: true,
    hand: challengerHand,
    captured: { gwang: [], tti: [], animal: [], pi: [] },
    score: 0,
    totalPoints: 0,
  };

  // 선 결정 (주최자가 선)
  const gameState: GameState = {
    roomId,
    phase: 'playing',
    currentTurn: room.hostId,
    deck: remainingDeck,
    field,
    players: {
      [room.hostId]: hostPlayer,
      [room.challengerId!]: challengerPlayer,
    },
    goCount: {
      [room.hostId]: 0,
      [room.challengerId!]: 0,
    },
    specialEvents: [],
  };

  await setDoc(gameDoc(roomId), gameState);
  await updateDoc(roomDoc(roomId), { status: 'playing' });
};

// 게임 상태 구독
export const subscribeToGameState = (roomId: string, callback: (state: GameState | null) => void): () => void => {
  const docRef = gameDoc(roomId);
  const unsubscribe = onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as GameState);
    } else {
      callback(null);
    }
  });
  return unsubscribe;
};

// 게임 상태 업데이트
export const updateGameState = async (roomId: string, updates: Partial<GameState>): Promise<void> => {
  await updateDoc(gameDoc(roomId), updates as any);
};

// 방 삭제
export const deleteRoom = async (roomId: string): Promise<void> => {
  await deleteDoc(roomDoc(roomId));
  await deleteDoc(gameDoc(roomId));
};
