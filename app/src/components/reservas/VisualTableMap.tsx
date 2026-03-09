import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import type { TableSummary, FloorMap } from '@/types';
import { TableTooltip } from './TableTooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VisualTableMapProps {
  floorData: FloorMap;
  selectedTableId: string | null;
  onSelectTable: (id: string) => void;
  floorNumber: number;
}

export function VisualTableMap({
  floorData,
  selectedTableId,
  onSelectTable,
  floorNumber,
}: VisualTableMapProps) {
  const [hoveredTable, setHoveredTable] = useState<TableSummary | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // For pinch-to-zoom gesture support (prepared for future use)
  // const scale = useMotionValue(1);
  // const x = useMotionValue(0);
  // const y = useMotionValue(0);

  const getTableColor = (table: TableSummary) => {
    if (!table.isAvailable) {
      return 'bg-white/10 cursor-not-allowed border-white/5 text-white/30';
    }
    if (selectedTableId === table.id) {
      return 'bg-[var(--accent-gold)] cursor-pointer border-[var(--accent-gold-light)] text-black shadow-[0_0_30px_rgba(255,215,0,0.5)]';
    }

    const name = table.name;
    // Mesas P (Premium) - dorado
    if (name.startsWith('P')) {
      return 'bg-[var(--accent-gold)]/20 hover:bg-[var(--accent-gold)]/30 border-[var(--accent-gold)]/50 cursor-pointer text-[var(--accent-gold)] hover:shadow-[0_0_20px_rgba(255,215,0,0.3)]';
    }
    // Mesas V (Visitante) - rojo
    if (name.startsWith('V')) {
      return 'bg-[var(--accent-red)]/20 hover:bg-[var(--accent-red)]/30 border-[var(--accent-red)]/50 cursor-pointer text-white hover:shadow-[0_0_20px_rgba(227,27,35,0.3)]';
    }
    // Mesas R (Regular) - verde
    if (name.startsWith('R')) {
      return 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/50 cursor-pointer text-emerald-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]';
    }
    // Letras (Barra: O, Q, U, Ñ, W, etc.) - cyan
    return 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/50 cursor-pointer text-cyan-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]';
  };

  const getTableSize = (name: string, floor: number) => {
    // Mesas P (Premium) - grandes rectangulares
    if (name.startsWith('P')) {
      return 'w-16 h-12 text-sm';
    }
    // Mesas V (Visitantes) y R - redondas medianas
    if (name.startsWith('V') || name.startsWith('R')) {
      return 'w-11 h-11 text-xs';
    }
    // BARRA PRINCIPAL (O, Ñ, Q, R, S, T, U, W en piso 1) - MÁS PEQUEÑAS
    if (floor === 1 && ['O','Ñ','Q','S','T','U','W'].includes(name)) {
      return 'w-7 h-7 text-[9px]'; // ← MÁS PEQUEÑO: 28px para barra principal
    }
    // Barra lateral (A-J, K-N) y otras letras
    return 'w-8 h-8 text-[10px]';
  };

  const getTableShape = (name: string) => {
    if (name.startsWith('P')) {
      return 'rounded-lg'; // Rectangular
    }
    return 'rounded-full'; // Redonda
  };

  const handleTableClick = (table: TableSummary) => {
    if (table.isAvailable) {
      onSelectTable(table.id);
    } else {
      toast.error('Esta mesa ya está reservada para esta fecha. Elige otra', {
        duration: 3000,
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[750px] bg-gradient-radial rounded-2xl border border-[var(--glass-border)] overflow-hidden touch-pan-x touch-pan-y"
    >
      {/* Background grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(var(--glass-border) 1px, transparent 1px),
            linear-gradient(90deg, var(--glass-border) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Radial gradient overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, var(--bg-base) 80%)',
        }}
      />

      {/* TARIMA - Glassmorphism style */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-6 left-1/2 transform -translate-x-1/2"
      >
        <div 
          className="glass-card-heavy px-12 py-4 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,215,0,0.05))',
            borderColor: 'rgba(255,215,0,0.3)',
            boxShadow: '0 0 40px rgba(255,215,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          <span className="text-xl font-heading text-[var(--accent-gold)] tracking-[0.3em]">
            TARIMA
          </span>
        </div>
      </motion.div>

      {/* BARRA PRINCIPAL - Solo en piso 1 */}
      {floorNumber === 1 && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
          <div 
            className="glass-card px-10 py-3 rounded-lg"
            style={{
              background: 'linear-gradient(135deg, rgba(227,27,35,0.15), rgba(227,27,35,0.05))',
              borderColor: 'rgba(227,27,35,0.3)',
            }}
          >
            <span className="text-sm font-heading text-white/90 tracking-wider">
              BARRA PRINCIPAL
            </span>
          </div>
        </div>
      )}

      {/* BARRA COCTÉLES - Glass style (solo piso 1) */}
      {floorNumber === 1 && (
        <div className="absolute left-6 top-1/2 transform -translate-y-1/2 -rotate-90 origin-left">
          <div 
            className="glass-card px-8 py-3 rounded-lg whitespace-nowrap"
            style={{
              background: 'linear-gradient(135deg, rgba(227,27,35,0.15), rgba(227,27,35,0.05))',
              borderColor: 'rgba(227,27,35,0.3)',
            }}
          >
            <span className="text-sm font-heading text-white/90 tracking-wider">
              BARRA COCTÉLES
            </span>
          </div>
        </div>
      )}

      {/* Mesas posicionadas - Filtrar mesas P y V sueltas (ya fueron renombradas a Ñ y W) */}
      {floorData.tables
        .filter((table) => table.name !== 'P' && table.name !== 'V')
        .map((table, index) => (
        <motion.div
          key={table.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            delay: index * 0.02,
            type: 'spring',
            stiffness: 300,
            damping: 20,
          }}
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${Math.min(Math.max(table.posX, 3), 97)}%`,
            top: `${Math.min(Math.max(table.posY, 3), 97)}%`,
          }}
        >
          <motion.button
            onClick={() => handleTableClick(table)}
            onMouseEnter={() => setHoveredTable(table)}
            onMouseLeave={() => setHoveredTable(null)}
            disabled={false}
            whileHover={{ scale: table.isAvailable ? 1.15 : 1 }}
            whileTap={{ scale: table.isAvailable ? 0.95 : 1 }}
            className={cn(
              'flex items-center justify-center font-bold border-2 transition-all duration-200 backdrop-blur-sm',
              getTableColor(table),
              getTableSize(table.name, table.floor),
              getTableShape(table.name)
            )}
            style={{
              textShadow: selectedTableId === table.id ? 'none' : '0 1px 2px rgba(0,0,0,0.5)',
            }}
          >
            {table.name}
          </motion.button>

          {/* Selection ring animation */}
          {selectedTableId === table.id && (
            <motion.div
              layoutId="selectionRing"
              className="absolute inset-0 rounded-lg border-2 border-[var(--accent-gold)]"
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1.3, opacity: [0.5, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </motion.div>
      ))}

      {/* Tooltip */}
      {hoveredTable && (
        <motion.div
          initial={{ opacity: 0, y: hoveredTable.posY < 20 ? -10 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          className="absolute z-50 pointer-events-none"
          style={{
            left: `${Math.min(Math.max(hoveredTable.posX, 15), 85)}%`,
            top: hoveredTable.posY < 20
              ? `${Math.min(Math.max(hoveredTable.posY, 3), 97) + 8}%`
              : `${Math.min(Math.max(hoveredTable.posY, 3), 97) - 10}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <TableTooltip table={hoveredTable} />
        </motion.div>
      )}

      {/* Floor indicator */}
      <div className="absolute top-6 right-6 glass-card px-4 py-2">
        <span className="text-sm font-heading text-white/80">
          {floorNumber === 1 ? 'Primer Piso' : 'Segundo Piso'}
        </span>
      </div>

      {/* Glow effect at bottom */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, var(--bg-base), transparent)',
        }}
      />
    </div>
  );
}
