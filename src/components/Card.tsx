import { motion } from 'framer-motion';
import { HwaTuCard } from '../types';
import { CARD_BACK_IMAGE } from '../game/cards';

interface CardProps {
  card?: HwaTuCard;
  isBack?: boolean;
  isSelected?: boolean;
  isPlayable?: boolean;
  isMatching?: boolean;
  onClick?: () => void;
  size?: 'small' | 'medium' | 'large';
  delay?: number;
}

const sizeClasses = {
  small: 'w-12 h-18',
  medium: 'w-16 h-24',
  large: 'w-20 h-30',
};

const Card: React.FC<CardProps> = ({
  card,
  isBack = false,
  isSelected = false,
  isPlayable = false,
  isMatching = false,
  onClick,
  size = 'medium',
  delay = 0,
}) => {
  const imageSrc = isBack || !card ? CARD_BACK_IMAGE : card.imagePath;

  return (
    <motion.div
      className={`
        relative cursor-pointer rounded-lg overflow-hidden shadow-lg
        ${sizeClasses[size]}
        ${isSelected ? 'ring-4 ring-yellow-400 ring-opacity-75' : ''}
        ${isPlayable ? 'hover:scale-110 hover:-translate-y-2' : ''}
        ${isMatching ? 'ring-4 ring-green-400 ring-opacity-75 animate-pulse' : ''}
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

      {/* 선택 가능 표시 */}
      {isPlayable && (
        <motion.div
          className="absolute inset-0 bg-blue-500 bg-opacity-0 hover:bg-opacity-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}
    </motion.div>
  );
};

export default Card;
