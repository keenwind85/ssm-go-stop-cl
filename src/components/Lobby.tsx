import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameRoom } from '../types';
import {
  createRoom,
  findRoomByInviteCode,
  joinRoom,
  subscribeToRoom,
  startGame,
} from '../firebase/roomService';

interface LobbyProps {
  onGameStart: (roomId: string, playerId: string) => void;
}

type LobbyMode = 'select' | 'create' | 'join' | 'waiting' | 'ready';

const Lobby: React.FC<LobbyProps> = ({ onGameStart }) => {
  const [mode, setMode] = useState<LobbyMode>('select');
  const [nickname, setNickname] = useState('');
  const [roomName, setRoomName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [playerId, setPlayerId] = useState<string>('');
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 방 상태 구독
  useEffect(() => {
    if (!currentRoom) return;

    const unsubscribe = subscribeToRoom(currentRoom.id, (room) => {
      if (!room) {
        setError('방이 삭제되었습니다.');
        setMode('select');
        setCurrentRoom(null);
        return;
      }

      setCurrentRoom(room);

      // 게임 시작 체크
      if (room.status === 'playing') {
        const pid = localStorage.getItem('playerId') || playerId;
        onGameStart(room.id, pid);
      }

      // 도전자 입장 시 ready 상태로 변경
      if (room.challengerId && mode === 'waiting') {
        setMode('ready');
      }
    });

    return unsubscribe;
  }, [currentRoom?.id, mode, onGameStart, playerId]);

  // 방 생성
  const handleCreateRoom = async () => {
    if (!nickname.trim() || !roomName.trim()) {
      setError('닉네임과 방 이름을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const room = await createRoom(nickname.trim(), roomName.trim());
      setCurrentRoom(room);
      setPlayerId(room.hostId);
      setIsHost(true);
      setMode('waiting');
    } catch (err) {
      setError('방 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 방 참여
  const handleJoinRoom = async () => {
    if (!nickname.trim() || !inviteCode.trim()) {
      setError('닉네임과 초대코드를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const room = await findRoomByInviteCode(inviteCode.trim());
      if (!room) {
        setError('유효하지 않은 초대코드입니다.');
        setIsLoading(false);
        return;
      }

      if (room.challengerId) {
        setError('이미 다른 플레이어가 참여했습니다.');
        setIsLoading(false);
        return;
      }

      const result = await joinRoom(room.id, nickname.trim());
      setCurrentRoom(result.room);
      setPlayerId(result.playerId);
      setIsHost(false);
      setMode('ready');
    } catch (err: any) {
      setError(err.message || '방 참여에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 게임 시작 (호스트만)
  const handleStartGame = async () => {
    if (!currentRoom || !isHost) return;

    if (!currentRoom.challengerId) {
      setError('도전자가 아직 입장하지 않았습니다.');
      return;
    }

    setIsLoading(true);
    try {
      await startGame(currentRoom.id, currentRoom);
    } catch (err: any) {
      console.error('게임 시작 에러:', err);
      setError(`게임 시작에 실패했습니다: ${err.message || err}`);
      setIsLoading(false);
    }
  };

  // 초대코드 복사
  const copyInviteCode = () => {
    if (currentRoom) {
      navigator.clipboard.writeText(currentRoom.inviteCode);
      alert('초대코드가 복사되었습니다!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-black flex items-center justify-center p-4">
      <motion.div
        className="bg-black bg-opacity-50 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full shadow-2xl border border-purple-500 border-opacity-30"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        {/* 타이틀 */}
        <motion.div
          className="text-center mb-8"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
        >
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 mb-2">
            🎴 맞고
          </h1>
          <p className="text-gray-400 text-sm">실시간 1:1 대전</p>
        </motion.div>

        {/* 에러 메시지 */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="bg-red-500 bg-opacity-20 border border-red-500 text-red-300 px-4 py-2 rounded-lg mb-4 text-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 모드 선택 */}
        {mode === 'select' && (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.button
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold py-4 px-6 rounded-xl text-lg shadow-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode('create')}
            >
              🏠 방 만들기
              <div className="text-xs font-normal mt-1 text-orange-900">
                새 게임방을 만들고 초대코드로 친구 초대
              </div>
            </motion.button>

            <motion.button
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-4 px-6 rounded-xl text-lg shadow-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMode('join')}
            >
              🎯 도전하기
              <div className="text-xs font-normal mt-1 text-blue-200">
                초대코드로 상대방 게임방에 입장
              </div>
            </motion.button>
          </motion.div>
        )}

        {/* 방 만들기 */}
        {mode === 'create' && (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div>
              <label className="text-gray-400 text-sm block mb-1">닉네임</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임을 입력하세요"
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-yellow-500 focus:outline-none"
                maxLength={10}
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm block mb-1">방 이름</label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="게임방 이름을 입력하세요"
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-yellow-500 focus:outline-none"
                maxLength={20}
              />
            </div>

            <div className="flex gap-3">
              <button
                className="flex-1 bg-gray-700 text-white py-3 rounded-lg"
                onClick={() => setMode('select')}
              >
                뒤로
              </button>
              <motion.button
                className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold py-3 rounded-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateRoom}
                disabled={isLoading}
              >
                {isLoading ? '생성 중...' : '방 만들기'}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* 도전하기 */}
        {mode === 'join' && (
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div>
              <label className="text-gray-400 text-sm block mb-1">닉네임</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="닉네임을 입력하세요"
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                maxLength={10}
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm block mb-1">초대코드</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="6자리 초대코드 입력"
                className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none text-center text-2xl tracking-widest"
                maxLength={6}
              />
            </div>

            <div className="flex gap-3">
              <button
                className="flex-1 bg-gray-700 text-white py-3 rounded-lg"
                onClick={() => setMode('select')}
              >
                뒤로
              </button>
              <motion.button
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-3 rounded-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleJoinRoom}
                disabled={isLoading}
              >
                {isLoading ? '참여 중...' : '도전하기'}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* 대기실 (호스트) */}
        {mode === 'waiting' && currentRoom && (
          <motion.div
            className="space-y-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                {currentRoom.name}
              </h2>
              <p className="text-gray-400 text-sm">도전자를 기다리는 중...</p>
            </div>

            <div className="bg-gray-800 rounded-xl p-6">
              <p className="text-gray-400 text-sm mb-2">초대코드</p>
              <motion.div
                className="text-4xl font-bold text-yellow-400 tracking-widest cursor-pointer"
                whileHover={{ scale: 1.05 }}
                onClick={copyInviteCode}
              >
                {currentRoom.inviteCode}
              </motion.div>
              <p className="text-gray-500 text-xs mt-2">클릭하여 복사</p>
            </div>

            <motion.div
              className="text-gray-400"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              ⏳ 대기 중...
            </motion.div>
          </motion.div>
        )}

        {/* 준비 완료 */}
        {mode === 'ready' && currentRoom && (
          <motion.div
            className="space-y-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div>
              <h2 className="text-xl font-bold text-white mb-2">
                {currentRoom.name}
              </h2>
              <p className="text-green-400 text-sm">대전 준비 완료!</p>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">주최자</span>
                <span className="text-yellow-400 font-bold">
                  {currentRoom.hostNickname} 👑
                </span>
              </div>
              <div className="border-t border-gray-700" />
              <div className="flex justify-between items-center">
                <span className="text-gray-400">도전자</span>
                <span className="text-blue-400 font-bold">
                  {currentRoom.challengerNickname} 🎯
                </span>
              </div>
            </div>

            {isHost ? (
              <motion.button
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-4 rounded-xl text-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartGame}
                disabled={isLoading}
              >
                {isLoading ? '시작 중...' : '🎮 게임 시작!'}
              </motion.button>
            ) : (
              <motion.div
                className="text-yellow-400"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                주최자가 게임을 시작하길 기다리는 중...
              </motion.div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Lobby;
