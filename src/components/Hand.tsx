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
  fieldCards?: HwaTuCard[]; // 바닥 카드 (매칭 확인용)
}

const Hand: React.FC<HandProps> = ({
  cards,
  isMyHand,
  isCurrentTurn,
  selectedCardId,
  onCardSelect,
  playerName,
  fieldCards = [],
}) => {
  // 바닥에 있는 카드의 월 목록
  const fieldMonths = new Set(fieldCards.map(card => card.month));

  // 카드를 월별로 정렬 (매칭되는 카드를 앞으로)
  const sortedCards = [...cards].sort((a, b) => {
    const aHasMatch = fieldMonths.has(a.month);
    const bHasMatch = fieldMonths.has(b.month);
    // 매칭되는 카드를 앞으로
    if (aHasMatch && !bHasMatch) return -1;
    if (!aHasMatch && bHasMatch) return 1;
    // 같은 그룹 내에서는 월별로 정렬
    if (a.month !== b.month) return a.month - b.month;
    return a.index - b.index;
  });

  return (
    <div className="flex flex-col items-center w-full">
      {/* 플레이어 이름 */}
      <motion.div
        className={`
          mb-2 px-4 py-1 rounded-full text-sm font-bold
          ${isCurrentTurn ? 'bg-primary-10 text-white' : 'bg-gray-3 text-white'}
        `}
        animate={isCurrentTurn ? { scale: [1, 1.05, 1] } : {}}
        transition={{ repeat: isCurrentTurn ? Infinity : 0, duration: 1 }}
      >
        {playerName} {isCurrentTurn && '🎯'}
      </motion.div>

      {/* 카드 패 */}
      <div className="w-full overflow-x-auto py-2">
        <div className="inline-flex items-end gap-2 px-4">
          <AnimatePresence>
            {sortedCards.map((card, index) => (
              <motion.div
                key={card.id}
                className="relative shrink-0"
                style={{ zIndex: selectedCardId === card.id ? 100 : index }}
                layout
              >
                <Card
                  card={card}
                  isBack={!isMyHand}
                  isSelected={selectedCardId === card.id}
                  isPlayable={isMyHand && isCurrentTurn}
                  hasFieldMatch={isMyHand && isCurrentTurn && fieldMonths.has(card.month)}
                  onClick={() => isMyHand && isCurrentTurn && onCardSelect?.(card)}
                  size="medium"
                  delay={index * 0.05}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* 카드 수 */}
      <div className="mt-2 text-white text-sm">
        남은 패: {cards.length}장
      </div>
    </div>
  );
};

export default Hand;
