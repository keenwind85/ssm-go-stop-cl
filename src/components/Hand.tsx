import { motion, AnimatePresence } from 'framer-motion';
import { HwaTuCard } from '../types';
import Card from './Card';

interface HandProps {
  cards: HwaTuCard[];
  isMyHand: boolean;
  isCurrentTurn: boolean;
  selectedCardId?: string;
  onCardSelect?: (card: HwaTuCard) => void;
  playerName: string;
}

const Hand: React.FC<HandProps> = ({
  cards,
  isMyHand,
  isCurrentTurn,
  selectedCardId,
  onCardSelect,
  playerName,
}) => {
  // 카드를 월별로 정렬
  const sortedCards = [...cards].sort((a, b) => {
    if (a.month !== b.month) return a.month - b.month;
    return a.index - b.index;
  });

  return (
    <div className="flex flex-col items-center">
      {/* 플레이어 이름 */}
      <motion.div
        className={`
          mb-2 px-4 py-1 rounded-full text-sm font-bold
          ${isCurrentTurn ? 'bg-yellow-400 text-black' : 'bg-gray-700 text-white'}
        `}
        animate={isCurrentTurn ? { scale: [1, 1.05, 1] } : {}}
        transition={{ repeat: isCurrentTurn ? Infinity : 0, duration: 1 }}
      >
        {playerName} {isCurrentTurn && '🎯'}
      </motion.div>

      {/* 카드 패 */}
      <div className="flex justify-center items-end gap-[-10px] relative">
        <AnimatePresence>
          {sortedCards.map((card, index) => (
            <motion.div
              key={card.id}
              className="relative"
              style={{
                marginLeft: index === 0 ? 0 : -15,
                zIndex: selectedCardId === card.id ? 100 : index,
              }}
              layout
            >
              <Card
                card={card}
                isBack={!isMyHand}
                isSelected={selectedCardId === card.id}
                isPlayable={isMyHand && isCurrentTurn}
                onClick={() => isMyHand && isCurrentTurn && onCardSelect?.(card)}
                size="medium"
                delay={index * 0.05}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 카드 수 */}
      <div className="mt-2 text-gray-400 text-sm">
        남은 패: {cards.length}장
      </div>
    </div>
  );
};

export default Hand;
