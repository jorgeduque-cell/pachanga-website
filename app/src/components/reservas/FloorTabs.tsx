import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface FloorTabsProps {
  activeFloor: 1 | 2;
  onFloorChange: (floor: 1 | 2) => void;
  floor1Available: number;
  floor2Available: number;
}

export function FloorTabs({
  activeFloor,
  onFloorChange,
  floor1Available,
  floor2Available,
}: FloorTabsProps) {
  return (
    <div className="flex space-x-3 mb-6">
      {[1, 2].map((floor) => {
        const isActive = activeFloor === floor;
        const availableCount = floor === 1 ? floor1Available : floor2Available;
        
        return (
          <motion.button
            key={floor}
            onClick={() => onFloorChange(floor as 1 | 2)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'flex-1 py-4 px-4 rounded-xl font-heading text-sm uppercase tracking-wider transition-all duration-300 relative overflow-hidden',
              isActive
                ? 'text-white'
                : 'text-white/50 hover:text-white/80 glass-btn'
            )}
          >
            {/* Active background with glow */}
            {isActive && (
              <motion.div
                layoutId="activeFloorBg"
                className="absolute inset-0 bg-gradient-to-r from-[var(--accent-red)] to-[var(--accent-red-light)]"
                style={{
                  boxShadow: '0 0 30px rgba(227, 27, 35, 0.3)',
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
            
            {/* Content */}
            <span className="relative z-10 flex flex-col items-center">
              <span className="text-base">
                {floor === 1 ? 'Primer Piso' : 'Segundo Piso'}
              </span>
              <span
                className={cn(
                  'text-xs mt-1',
                  isActive ? 'text-white/80' : 'text-white/40'
                )}
              >
                ({availableCount} disponibles)
              </span>
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
