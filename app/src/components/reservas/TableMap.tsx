import { useState } from 'react';
import type { TableSummary } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { VisualTableMap } from './VisualTableMap';
import { FloorTabs } from './FloorTabs';
import { Check, X } from 'lucide-react';

interface TableMapProps {
  floor1: { label: string; tables: TableSummary[] };
  floor2: { label: string; tables: TableSummary[] };
  selectedTableId: string | null;
  onSelectTable: (id: string) => void;
  totalTables: number;
  availableTables: number;
}

export function TableMap({
  floor1,
  floor2,
  selectedTableId,
  onSelectTable,
  totalTables,
  availableTables,
}: TableMapProps) {
  const [activeFloor, setActiveFloor] = useState<1 | 2>(1);

  const currentFloor = activeFloor === 1 ? floor1 : floor2;
  const floor1Available = floor1.tables.filter((t) => t.isAvailable).length;
  const floor2Available = floor2.tables.filter((t) => t.isAvailable).length;

  const selectedTable = currentFloor.tables.find((t) => t.id === selectedTableId);

  return (
    <div className="glass-card-heavy p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-heading text-white tracking-wider">
            Mapa de Mesas
          </h3>
          <div className="glass-card px-4 py-2">
            <span className="text-sm text-white/60">
              <span className="text-[var(--accent-gold)] font-bold">{availableTables}</span> de{' '}
              {totalTables} disponibles
            </span>
          </div>
        </div>
      </div>

      {/* Tabs de pisos */}
      <FloorTabs
        activeFloor={activeFloor}
        onFloorChange={setActiveFloor}
        floor1Available={floor1Available}
        floor2Available={floor2Available}
      />

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 mb-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-5 h-4 rounded border border-[var(--accent-gold)]/50 bg-[var(--accent-gold)]/20" />
          <span className="text-white/70">Premium P (10 pers.)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border border-[var(--accent-red)]/50 bg-[var(--accent-red)]/20" />
          <span className="text-white/70">Visitante V (4 pers.)</span>
        </div>
        {activeFloor === 2 && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border border-emerald-500/50 bg-emerald-500/20" />
            <span className="text-white/70">Regular R (4 pers.)</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border border-cyan-500/50 bg-cyan-500/20" />
          <span className="text-white/70">Barra (2 pers.)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border border-white/5 bg-white/10" />
          <X size={12} className="text-white/30 absolute" style={{ marginLeft: '2px' }} />
          <span className="text-white/70 ml-1">Ocupada</span>
        </div>
      </div>

      {/* Mapa Visual */}
      <VisualTableMap
        floorData={currentFloor}
        selectedTableId={selectedTableId}
        onSelectTable={onSelectTable}
        floorNumber={activeFloor}
      />

      {/* Mesa seleccionada */}
      <AnimatePresence mode="wait">
        {selectedTable && (
          <motion.div
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="mt-6 overflow-hidden"
          >
            <div 
              className="p-4 rounded-xl border"
              style={{
                background: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,215,0,0.05))',
                borderColor: 'rgba(255,215,0,0.3)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--accent-gold)] flex items-center justify-center">
                  <Check size={20} className="text-black" />
                </div>
                <div>
                  <p className="text-[var(--accent-gold)] font-heading text-lg">
                    Mesa {selectedTable.name} seleccionada
                  </p>
                  <p className="text-white/60 text-sm">
                    Capacidad: {selectedTable.capacity} personas
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
