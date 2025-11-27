import { motion } from 'framer-motion';
import { Player } from '../types';
import Card from './Card';

interface ScoreBoardProps {
  player: Player;
  isMe: boolean;
  goCount: number;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({ player, isMe, goCount }) => {
  const { captured, score, nickname } = player;

  const sections = [
    { name: '광', emoji: '🌟', cards: captured.gwang, color: 'from-yellow-400 to-orange-500' },
    { name: '띠', emoji: '📜', cards: captured.tti, color: 'from-red-400 to-pink-500' },
    { name: '열끗', emoji: '🦌', cards: captured.animal, color: 'from-blue-400 to-indigo-500' },
    { name: '피', emoji: '🍂', cards: captured.pi, color: 'from-green-400 to-teal-500' },
  ];

  const totalPi = captured.pi.reduce((sum, card) => sum + card.points, 0);

  return (
    <motion.div
      className={`
        rounded-xl p-3 shadow-lg
        ${isMe ? 'bg-gradient-to-r from-blue-900 to-purple-900' : 'bg-gradient-to-r from-gray-800 to-gray-900'}
      `}
      initial={{ opacity: 0, x: isMe ? -50 : 50 }}
      animate={{ opacity: 1, x: 0 }}
    >
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-white font-bold text-sm">
          {nickname} {isMe && '(나)'}
        </span>
        <div className="flex items-center gap-2">
          {goCount > 0 && (
            <motion.span
              className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            >
              {goCount}고!
            </motion.span>
          )}
          <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold">
            {score}점
          </span>
        </div>
      </div>

      {/* 획득 카드 섹션 */}
      <div className="space-y-2">
        {sections.map((section) => (
          <div key={section.name} className="flex items-center gap-2">
            <div className={`w-16 text-xs bg-gradient-to-r ${section.color} text-white px-2 py-1 rounded text-center`}>
              {section.emoji} {section.name}
              <span className="ml-1">({section.cards.length})</span>
            </div>
            <div className="flex gap-1 overflow-x-auto">
              {section.cards.slice(0, 8).map((card, idx) => (
                <motion.div
                  key={card.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card card={card} size="small" />
                </motion.div>
              ))}
              {section.cards.length > 8 && (
                <span className="text-gray-400 text-xs self-center">
                  +{section.cards.length - 8}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 피 점수 */}
      <div className="mt-2 text-right text-xs text-gray-400">
        피 점수: {totalPi}점 {totalPi >= 10 && `(+${totalPi - 9}점)`}
      </div>
    </motion.div>
  );
};

export default ScoreBoard;
