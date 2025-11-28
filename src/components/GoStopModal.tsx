import { motion, AnimatePresence } from 'framer-motion';

interface GoStopModalProps {
  isOpen: boolean;
  score: number;
  yakuList: string[];
  goCount: number;
  onGo: () => void;
  onStop: () => void;
}

const GoStopModal: React.FC<GoStopModalProps> = ({
  isOpen,
  score,
  yakuList,
  goCount,
  onGo,
  onStop,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-gradient-to-br from-primary-10 to-primary-8 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl border-2 border-primary-4 text-white"
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* 타이틀 */}
            <motion.h2
              className="text-3xl font-bold text-center text-white mb-4"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              🎴 판 완성! 🎴
            </motion.h2>

            {/* 점수 표시 */}
            <div className="bg-white/15 rounded-xl p-4 mb-4">
              <div className="text-center">
                <span className="text-white text-sm">현재 점수</span>
                <motion.div
                  className="text-5xl font-bold text-white"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                >
                  {score}점
                </motion.div>
                {goCount > 0 && (
                  <div className="text-white text-sm mt-1">
                    ({goCount}고 적용시 {score * Math.pow(2, goCount + 1)}점)
                  </div>
                )}
              </div>

              {/* 족보 목록 */}
              {yakuList.length > 0 && (
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {yakuList.map((yaku, idx) => (
                    <motion.span
                      key={yaku}
                      className="bg-white/20 text-white text-xs px-2 py-1 rounded-full font-bold"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + idx * 0.1 }}
                    >
                      {yaku}
                    </motion.span>
                  ))}
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div className="flex gap-4">
              <motion.button
                className="flex-1 bg-gradient-to-r from-white/40 to-primary-2 text-white font-semibold py-4 px-6 rounded-xl text-xl shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onGo}
              >
                🔥 고!
                <div className="text-xs font-normal mt-1">
                  점수 2배, 계속 진행
                </div>
              </motion.button>

              <motion.button
                className="flex-1 bg-gradient-to-r from-primary-6 to-primary-10 text-white font-semibold py-4 px-6 rounded-xl text-xl shadow-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onStop}
              >
                ✋ 스톱!
                <div className="text-xs font-normal mt-1">
                  {score}점으로 승리
                </div>
              </motion.button>
            </div>

            {/* 현재 고 횟수 */}
            {goCount > 0 && (
              <motion.div
                className="mt-4 text-center text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                현재 {goCount}고 중! 🔥
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GoStopModal;
