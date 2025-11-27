import { useState, useEffect } from 'react';
import Lobby from './components/Lobby';
import GameBoard from './components/GameBoard';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);

  // 기존 세션 복구 시도
  useEffect(() => {
    const savedRoomId = localStorage.getItem('currentRoomId');
    const savedPlayerId = localStorage.getItem('playerId');

    if (savedRoomId && savedPlayerId) {
      // 세션이 있으면 게임 상태 확인 후 복구 가능
      // 여기서는 단순히 초기화만 (실제 구현시 게임 상태 확인 필요)
    }
  }, []);

  const handleGameStart = (newRoomId: string, newPlayerId: string) => {
    setRoomId(newRoomId);
    setPlayerId(newPlayerId);
    setGameStarted(true);
  };

  if (gameStarted && roomId && playerId) {
    return <GameBoard roomId={roomId} playerId={playerId} />;
  }

  return <Lobby onGameStart={handleGameStart} />;
}

export default App;
