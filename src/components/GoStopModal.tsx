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
            className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl border-2 border-yellow-400"
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.5, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* 타이틀 */}
            <motion.h2
              className="text-3xl font-bold text-center text-yellow-400 mb-4"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              🎴 판 완성! 🎴
            </motion.h2>

            {/* 점수 표시 */}
            <div className="bg-black bg-opacity-30 rounded-xl p-4 mb-4">
              <div className="text-center">
                <span className="text-gray-400 text-sm">현재 점수</span>
                <motion.div
                  className="text-5xl font-bold text-yellow-300"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                >
                  {score}점
                </motion.div>
                {goCount > 0 && (
                  <div className="text-orange-400 text-sm mt-1">
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
                      className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-bold"
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
                className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold py-4 px-6 rounded-xl text-xl shadow-lg"
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
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-4 px-6 rounded-xl text-xl shadow-lg"
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
                className="mt-4 text-center text-yellow-400"
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
