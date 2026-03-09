'use client';

import { useState } from 'react';
import type { TableSummary, FloorMap } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { TableTooltip } from './TableTooltip';

interface VisualTableMapProps {
  floorData: FloorMap;
  selectedTableId: string | null;
  onSelectTable: (id: string) => void;
  floorNumber: 1 | 2;
}

// ═══════════════════════════════════════════════════════════
// Coordenadas de hotspots por piso — posiciones % sobre las imágenes reales
// ═══════════════════════════════════════════════════════════

const FLOOR_1_HOTSPOTS: Record<string, { x: number; y: number; w: number; h: number; shape: 'circle' | 'rect' }> = {
  // Barra Cocteles (A-J)
  'A': { x: 16.5, y: 12.5, w: 4.5, h: 3.5, shape: 'circle' },
  'B': { x: 16.5, y: 19, w: 4.5, h: 3.5, shape: 'circle' },
  'C': { x: 16.5, y: 25.5, w: 4.5, h: 3.5, shape: 'circle' },
  'D': { x: 16.5, y: 32, w: 4.5, h: 3.5, shape: 'circle' },
  'E': { x: 16.5, y: 38.5, w: 4.5, h: 3.5, shape: 'circle' },
  'F': { x: 16.5, y: 45, w: 4.5, h: 3.5, shape: 'circle' },
  'G': { x: 12, y: 51, w: 4.5, h: 3.5, shape: 'circle' },
  'H': { x: 12, y: 57, w: 4.5, h: 3.5, shape: 'circle' },
  'I': { x: 16.5, y: 57, w: 4.5, h: 3.5, shape: 'circle' },
  'J': { x: 12, y: 63.5, w: 4.5, h: 3.5, shape: 'circle' },

  // V1-V6
  'V1': { x: 16, y: 63.5, w: 4.5, h: 3.5, shape: 'circle' },
  'V2': { x: 16, y: 69, w: 4.5, h: 3.5, shape: 'circle' },
  'V3': { x: 16, y: 74.5, w: 4.5, h: 3.5, shape: 'circle' },
  'V4': { x: 16, y: 80, w: 4.5, h: 3.5, shape: 'circle' },
  'V5': { x: 16, y: 85.5, w: 4.5, h: 3.5, shape: 'circle' },
  'V6': { x: 16, y: 91, w: 4.5, h: 3.5, shape: 'circle' },

  // Palcos P1-P5
  'P1': { x: 28, y: 22, w: 14, h: 8, shape: 'rect' },
  'P2': { x: 28, y: 34, w: 14, h: 8, shape: 'rect' },
  'P3': { x: 28, y: 48, w: 14, h: 8, shape: 'rect' },
  'P4': { x: 28, y: 62, w: 14, h: 8, shape: 'rect' },
  'P5': { x: 28, y: 76, w: 14, h: 8, shape: 'rect' },

  // Centro V7-V9
  'V7': { x: 44, y: 32, w: 4.5, h: 3.5, shape: 'circle' },
  'V8': { x: 52, y: 32, w: 4.5, h: 3.5, shape: 'circle' },
  'V9': { x: 60, y: 32, w: 4.5, h: 3.5, shape: 'circle' },
  // V11-V13
  'V11': { x: 44, y: 48, w: 4.5, h: 3.5, shape: 'circle' },
  'V12': { x: 52, y: 48, w: 4.5, h: 3.5, shape: 'circle' },
  'V13': { x: 60, y: 48, w: 4.5, h: 3.5, shape: 'circle' },
  // V14-V16
  'V14': { x: 44, y: 62, w: 4.5, h: 3.5, shape: 'circle' },
  'V15': { x: 52, y: 62, w: 4.5, h: 3.5, shape: 'circle' },
  'V16': { x: 60, y: 62, w: 4.5, h: 3.5, shape: 'circle' },
  // V17-V19
  'V17': { x: 44, y: 76, w: 4.5, h: 3.5, shape: 'circle' },
  'V18': { x: 52, y: 76, w: 4.5, h: 3.5, shape: 'circle' },
  'V19': { x: 60, y: 76, w: 4.5, h: 3.5, shape: 'circle' },

  // P6 VIP
  'P6': { x: 74, y: 10, w: 14, h: 8, shape: 'rect' },
  // K-N diagonal
  'K': { x: 84, y: 22, w: 4.5, h: 3.5, shape: 'circle' },
  'L': { x: 87, y: 34, w: 4.5, h: 3.5, shape: 'circle' },
  'M': { x: 87, y: 44, w: 4.5, h: 3.5, shape: 'circle' },
  'N': { x: 84, y: 52, w: 4.5, h: 3.5, shape: 'circle' },
  // P7-P9
  'P7': { x: 68, y: 38, w: 14, h: 8, shape: 'rect' },
  'P8': { x: 68, y: 56, w: 14, h: 8, shape: 'rect' },
  'P9': { x: 68, y: 72, w: 14, h: 8, shape: 'rect' },

  // Barra principal
  'O': { x: 20, y: 92, w: 4, h: 3, shape: 'circle' },
  'Q': { x: 30, y: 92, w: 4, h: 3, shape: 'circle' },
  'R': { x: 38, y: 92, w: 4, h: 3, shape: 'circle' },
  'S': { x: 46, y: 92, w: 4, h: 3, shape: 'circle' },
  'T': { x: 54, y: 92, w: 4, h: 3, shape: 'circle' },
  'U': { x: 62, y: 92, w: 4, h: 3, shape: 'circle' },
  'Ñ': { x: 70, y: 92, w: 4, h: 3, shape: 'circle' },
};

const FLOOR_2_HOTSPOTS: Record<string, { x: number; y: number; w: number; h: number; shape: 'circle' | 'rect' }> = {
  // V20-V30
  'V20': { x: 3, y: 9, w: 4, h: 3, shape: 'circle' },
  'V21': { x: 3, y: 15, w: 4, h: 3, shape: 'circle' },
  'V22': { x: 3, y: 22, w: 4, h: 3, shape: 'circle' },
  'V23': { x: 3, y: 30, w: 4, h: 3, shape: 'circle' },
  'V24': { x: 3, y: 37, w: 4, h: 3, shape: 'circle' },
  'V25': { x: 3, y: 44, w: 4, h: 3, shape: 'circle' },
  'V26': { x: 3, y: 52, w: 4, h: 3, shape: 'circle' },
  'V27': { x: 3, y: 59, w: 4, h: 3, shape: 'circle' },
  'V28': { x: 3, y: 66, w: 4, h: 3, shape: 'circle' },
  'V29': { x: 3, y: 73, w: 4, h: 3, shape: 'circle' },
  'V30': { x: 3, y: 81, w: 4, h: 3, shape: 'circle' },
  // R1-R2
  'R1': { x: 10, y: 9, w: 5, h: 4, shape: 'circle' },
  'R2': { x: 10, y: 16, w: 5, h: 4, shape: 'circle' },
  // P10-P14
  'P10': { x: 8, y: 28, w: 12, h: 6, shape: 'rect' },
  'P11': { x: 8, y: 40, w: 12, h: 6, shape: 'rect' },
  'P12': { x: 8, y: 52, w: 12, h: 6, shape: 'rect' },
  'P13': { x: 8, y: 64, w: 12, h: 6, shape: 'rect' },
  'P14': { x: 8, y: 76, w: 12, h: 6, shape: 'rect' },
  // P15-P17
  'P15': { x: 37, y: 9, w: 12, h: 6, shape: 'rect' },
  'P16': { x: 37, y: 18, w: 12, h: 6, shape: 'rect' },
  'P17': { x: 37, y: 27, w: 12, h: 6, shape: 'rect' },
  // V31-V35
  'V31': { x: 46, y: 9, w: 4, h: 3, shape: 'circle' },
  'V32': { x: 46, y: 16, w: 4, h: 3, shape: 'circle' },
  'V33': { x: 46, y: 23, w: 4, h: 3, shape: 'circle' },
  'V34': { x: 46, y: 30, w: 4, h: 3, shape: 'circle' },
  'V35': { x: 46, y: 37, w: 4, h: 3, shape: 'circle' },
  // P18-P21
  'P18': { x: 32, y: 40, w: 12, h: 6, shape: 'rect' },
  'P19': { x: 32, y: 52, w: 12, h: 6, shape: 'rect' },
  'P20': { x: 32, y: 64, w: 12, h: 6, shape: 'rect' },
  'P21': { x: 32, y: 76, w: 12, h: 6, shape: 'rect' },
  // W, X, Y, Z
  'W': { x: 13, y: 87, w: 4, h: 3, shape: 'circle' },
  'X': { x: 21, y: 87, w: 4, h: 3, shape: 'circle' },
  'Y': { x: 25, y: 87, w: 4, h: 3, shape: 'circle' },
  'Z': { x: 29, y: 87, w: 4, h: 3, shape: 'circle' },
};

const FLOOR_IMAGES: Record<number, string> = {
  1: '/maps/primer-piso.png',
  2: '/maps/segundo-piso.png',
};

export function VisualTableMap({ floorData, selectedTableId, onSelectTable, floorNumber }: VisualTableMapProps) {
  const [hoveredTable, setHoveredTable] = useState<TableSummary | null>(null);

  const hotspots = floorNumber === 1 ? FLOOR_1_HOTSPOTS : FLOOR_2_HOTSPOTS;

  const getOverlayClass = (table: TableSummary) => {
    const isSelected = table.id === selectedTableId;
    const isOccupied = !table.isAvailable;

    if (isSelected) {
      return 'bg-[var(--accent-gold)]/40 border-2 border-[var(--accent-gold)] shadow-[0_0_15px_rgba(255,215,0,0.5)]';
    }
    if (isOccupied) {
      return 'bg-red-500/30 border border-red-500/60 cursor-not-allowed';
    }
    return 'bg-transparent border border-transparent hover:bg-white/15 hover:border-white/25 cursor-pointer';
  };

  return (
    <div className="relative w-full select-none">
      {/* Imagen del mapa real */}
      <img
        src={FLOOR_IMAGES[floorNumber]}
        alt={`Mapa Piso ${floorNumber}`}
        className="w-full h-auto rounded-xl"
        draggable={false}
      />

      {/* Hotspots clickeables sobre la imagen */}
      {floorData.tables.map(table => {
        const hotspot = hotspots[table.name];
        if (!hotspot) return null;

        const isOccupied = !table.isAvailable;

        return (
          <motion.button
            key={table.id}
            className={`absolute transition-all duration-200 ${
              hotspot.shape === 'circle' ? 'rounded-full' : 'rounded-md'
            } ${getOverlayClass(table)}`}
            style={{
              left: `${hotspot.x}%`,
              top: `${hotspot.y}%`,
              width: `${hotspot.w}%`,
              height: `${hotspot.h}%`,
            }}
            onClick={() => !isOccupied && onSelectTable(table.id)}
            onMouseEnter={() => setHoveredTable(table)}
            onMouseLeave={() => setHoveredTable(null)}
            whileHover={!isOccupied ? { scale: 1.1 } : undefined}
            whileTap={!isOccupied ? { scale: 0.95 } : undefined}
            disabled={isOccupied}
            title={`Mesa ${table.name} - Cap: ${table.capacity}`}
          />
        );
      })}

      {/* Tooltip al hacer hover */}
      <AnimatePresence>
        {hoveredTable && (() => {
          const hotspot = hotspots[hoveredTable.name];
          if (!hotspot) return null;

          const tooltipX = Math.min(Math.max(hotspot.x + hotspot.w / 2, 15), 85);
          const showAbove = hotspot.y > 25;
          const tooltipY = showAbove ? hotspot.y - 2 : hotspot.y + hotspot.h + 2;

          return (
            <motion.div
              key="tooltip"
              initial={{ opacity: 0, y: showAbove ? 5 : -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute z-50 pointer-events-none"
              style={{
                left: `${tooltipX}%`,
                top: `${tooltipY}%`,
                transform: `translateX(-50%) ${showAbove ? 'translateY(-100%)' : ''}`,
              }}
            >
              <TableTooltip table={hoveredTable} />
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
