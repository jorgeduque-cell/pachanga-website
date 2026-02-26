import type { TableSummary } from '@/types';
import { motion } from 'framer-motion';

interface TableTooltipProps {
  table: TableSummary;
}

export function TableTooltip({ table }: TableTooltipProps) {
  const getZoneLabel = (zone: string) => {
    const zones: Record<string, string> = {
      'SALON': 'Salón',
      'BARRA': 'Barra',
    };
    return zones[zone] || zone;
  };

  const getTableType = (name: string) => {
    if (name.startsWith('P')) return 'Mesa Premium (10 pers.)';
    if (name.startsWith('V')) return 'Mesa Visitante (4 pers.)';
    if (name.startsWith('R')) return 'Mesa Regular (4 pers.)';
    return 'Barra (2 pers.)';
  };

  const getTableColor = (name: string) => {
    if (name.startsWith('P')) return 'text-[var(--accent-gold)]';
    if (name.startsWith('V')) return 'text-[var(--accent-red)]';
    if (name.startsWith('R')) return 'text-emerald-400';
    return 'text-cyan-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 5, scale: 0.95 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      className="glass-tooltip p-4 min-w-[200px] z-50"
    >
      <h4 className={`font-heading text-2xl ${getTableColor(table.name)}`}>
        {table.name}
      </h4>
      <div className="mt-2 space-y-1 text-sm text-white/70">
        <p className="font-medium text-white">{getTableType(table.name)}</p>
        <p>
          Capacidad:{' '}
          <span className="font-semibold text-white">{table.capacity} personas</span>
        </p>
        <p>
          Zona: <span className="font-semibold text-white">{getZoneLabel(table.zone)}</span>
        </p>
        {!table.isAvailable && (
          <p className="text-[var(--accent-red)] font-bold mt-2 flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-[var(--accent-red)] rounded-full animate-pulse" />
            Mesa ocupada
          </p>
        )}
      </div>
      
      {/* Decorative glow */}
      <div 
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1/2 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, var(--accent-gold), transparent)`,
        }}
      />
    </motion.div>
  );
}
