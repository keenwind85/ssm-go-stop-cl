import { motion } from 'framer-motion';
import { HwaTuCard } from '../types';
import { CARD_BACK_IMAGE } from '../game/cards';

interface CardProps {
  card?: HwaTuCard;
  isBack?: boolean;
  isSelected?: boolean;
  isPlayable?: boolean;
  isMatching?: boolean;
  hasFieldMatch?: boolean; // 바닥에 같은 월 카드가 있는지
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
  delay?: number;
}

const sizeClasses = {
  small: 'w-16 h-24',
  medium: 'w-24 h-36',
  large: 'w-32 h-48',
};

const Card: React.FC<CardProps> = ({
  card,
  isBack = false,
  isSelected = false,
  isPlayable = false,
  isMatching = false,
  hasFieldMatch = false,
  onClick,
  size = 'medium',
  delay = 0,
}) => {
  const imageSrc = isBack || !card ? CARD_BACK_IMAGE : card.imagePath;

  return (
    <motion.div
      className={`
        relative cursor-pointer rounded-xl overflow-hidden shadow-lg
        ${sizeClasses[size]}
        ${isSelected ? 'ring-4 ring-primary-8 ring-opacity-100' : ''}
        ${isPlayable && !hasFieldMatch ? 'hover:scale-105 hover:-translate-y-2' : ''}
        ${isPlayable && hasFieldMatch ? 'ring-4 ring-primary-10 ring-opacity-100 hover:scale-110 hover:-translate-y-3 neon-border' : ''}
        ${isMatching ? 'ring-4 ring-primary-8 ring-opacity-100 animate-pulse' : ''}
        transition-all duration-200
      `}
      initial={{ scale: 0, rotateY: 180 }}
      animate={{
        scale: 1,
        rotateY: isBack ? 180 : 0,
        y: isSelected ? -20 : 0,
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay,
      }}
      whileHover={isPlayable ? { scale: 1.1, y: -10 } : {}}
      whileTap={isPlayable ? { scale: 0.95 } : {}}
      onClick={onClick}
      style={{ perspective: 1000 }}
    >
      <img
        src={imageSrc}
        alt={card ? `${card.month}월 ${card.index}번` : '카드 뒷면'}
        className="w-full h-full object-cover"
        draggable={false}
      />

      {/* 카드 타입 표시 */}
      {card && !isBack && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs text-center py-1">
          {card.type === 'gwang' && '🌟광'}
          {card.type === 'tti' && '📜띠'}
          {card.type === 'animal' && '🦌열끗'}
          {card.type === 'pi' && `🍂피${card.points > 1 ? '×2' : ''}`}
        </div>
      )}

      {/* 플레이 가능 테두리 효과 */}
      {isPlayable && !hasFieldMatch && (
        <div className="absolute inset-0 rounded-xl border-2 border-primary-6 border-opacity-60 pointer-events-none" />
      )}

      {/* 바닥패와 매칭되는 카드 강조 */}
      {hasFieldMatch && (
        <motion.div
          className="absolute inset-0 rounded-xl border-[3px] border-primary-8 pointer-events-none"
          animate={{
            boxShadow: ['0 0 10px #DA2F36', '0 0 25px #FF706C', '0 0 10px #DA2F36']
          }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      )}

      {/* 클릭 유도 화살표 */}
      {hasFieldMatch && isPlayable && (
        <motion.div
          className="absolute -top-6 left-1/2 -translate-x-1/2 text-primary-10 text-2xl drop-shadow-lg arrow-bounce"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          ⬇
        </motion.div>
      )}
    </motion.div>
  );
};

export default Card;
