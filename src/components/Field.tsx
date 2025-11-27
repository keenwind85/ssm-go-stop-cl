import { motion, AnimatePresence } from 'framer-motion';
import { HwaTuCard, CardMonth } from '../types';
import Card from './Card';

interface FieldProps {
  cards: HwaTuCard[];
  matchingCards?: HwaTuCard[];
  onCardSelect?: (card: HwaTuCard) => void;
  isSelecting?: boolean;
}

const Field: React.FC<FieldProps> = ({
  cards,
  matchingCards = [],
  onCardSelect,
  isSelecting = false,
}) => {
  // 카드를 월별로 그룹화
  const groupedCards = cards.reduce((acc, card) => {
    const month = card.month;
    if (!acc[month]) acc[month] = [];
    acc[month].push(card);
    return acc;
  }, {} as Record<number, HwaTuCard[]>);

  const matchingIds = new Set(matchingCards.map(c => c.id));

  return (
    <div className="relative bg-green-800 rounded-2xl p-4 min-h-[160px] shadow-inner">
      {/* 바닥 패턴 */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-700 to-green-900 rounded-2xl opacity-50" />

      {/* 타이틀 */}
      <div className="absolute top-2 left-4 text-green-300 text-sm font-bold">
        바닥 ({cards.length}장)
      </div>

      {/* 카드 배치 */}
      <div className="relative grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1 mt-6 p-2">
        <AnimatePresence mode="popLayout">
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              layout
              initial={{ scale: 0, y: -50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, y: 50, opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 25,
                delay: index * 0.02,
              }}
            >
              <Card
                card={card}
                isMatching={matchingIds.has(card.id)}
                isPlayable={isSelecting && matchingIds.has(card.id)}
                onClick={() => {
                  if (isSelecting && matchingIds.has(card.id)) {
                    onCardSelect?.(card);
                  }
                }}
                size="small"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 선택 안내 메시지 */}
      {isSelecting && matchingCards.length > 0 && (
        <motion.div
          className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black px-4 py-2 rounded-full text-sm font-bold"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          매칭 카드를 선택하세요!
        </motion.div>
      )}
    </div>
  );
};

export default Field;
