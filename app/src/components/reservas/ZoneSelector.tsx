import { motion } from 'framer-motion';
import { Crown, Users, Wine, Sparkles, Check } from 'lucide-react';

export type ZoneType = 'PALCO' | 'VISITANTE' | 'BARRA';

interface ZoneOption {
  type: ZoneType;
  title: string;
  subtitle: string;
  description: string;
  capacity: string;
  icon: React.ElementType;
  accentColor: string;
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
  features: string[];
}

const ZONE_OPTIONS: ZoneOption[] = [
  {
    type: 'PALCO',
    title: 'Palco VIP',
    subtitle: 'Experiencia Premium',
    description: 'Mesa privada con la mejor ubicación del local',
    capacity: 'Hasta 10 personas',
    icon: Crown,
    accentColor: 'var(--accent-gold)',
    gradientFrom: 'rgba(255, 215, 0, 0.15)',
    gradientTo: 'rgba(255, 215, 0, 0.03)',
    borderColor: 'rgba(255, 215, 0, 0.4)',
    features: ['Ubicación privilegiada', 'Servicio prioritario', 'Ideal para grupos grandes', '🍾 Consumo mínimo: 1 botella de licor'],
  },
  {
    type: 'VISITANTE',
    title: 'Mesa Visitante',
    subtitle: 'Zona Central',
    description: 'Mesa estándar en el corazón de la acción',
    capacity: 'Hasta 4 personas',
    icon: Users,
    accentColor: '#e74c3c',
    gradientFrom: 'rgba(231, 76, 60, 0.12)',
    gradientTo: 'rgba(231, 76, 60, 0.02)',
    borderColor: 'rgba(231, 76, 60, 0.35)',
    features: ['Pista central', 'Ambiente vibrante', 'Perfecta para parejas o amigos'],
  },
  {
    type: 'BARRA',
    title: 'Mesa Barra',
    subtitle: 'Zona Cocteles',
    description: 'Lugar íntimo junto a la barra de cocteles',
    capacity: 'Hasta 2 personas',
    icon: Wine,
    accentColor: '#22d3ee',
    gradientFrom: 'rgba(34, 211, 238, 0.12)',
    gradientTo: 'rgba(34, 211, 238, 0.02)',
    borderColor: 'rgba(34, 211, 238, 0.35)',
    features: ['Acceso directo a barra', 'Ambiente exclusivo', 'Ideal para parejas'],
  },
];

interface ZoneSelectorProps {
  selectedZone: ZoneType | null;
  onSelectZone: (zone: ZoneType) => void;
  availability?: Record<ZoneType, number>;
}

export function ZoneSelector({ selectedZone, onSelectZone, availability }: ZoneSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h3 className="text-2xl font-heading text-white tracking-wider uppercase">
          Selecciona tu Zona
        </h3>
        <p className="text-white/50 text-sm mt-1">
          Elige el tipo de experiencia que prefieres
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {ZONE_OPTIONS.map((zone, index) => {
          const isSelected = selectedZone === zone.type;
          const Icon = zone.icon;
          const available = availability?.[zone.type];

          return (
            <motion.button
              key={zone.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelectZone(zone.type)}
              className={`
                relative w-full text-left p-5 rounded-2xl transition-all duration-300
                backdrop-blur-md overflow-hidden group
                ${isSelected
                  ? 'ring-2 shadow-lg'
                  : 'hover:scale-[1.02] active:scale-[0.98]'
                }
              `}
              style={{
                background: `linear-gradient(135deg, ${zone.gradientFrom}, ${zone.gradientTo})`,
                borderColor: isSelected ? zone.accentColor : zone.borderColor,
                border: `1px solid ${isSelected ? zone.accentColor : zone.borderColor}`,
                boxShadow: isSelected
                  ? `0 0 25px ${zone.gradientFrom}, inset 0 1px 0 ${zone.borderColor}`
                  : `inset 0 1px 0 ${zone.borderColor}`,
              }}
            >
              {/* Selected indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: zone.accentColor }}
                >
                  <Check className="w-4 h-4 text-black" strokeWidth={3} />
                </motion.div>
              )}

              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `linear-gradient(135deg, ${zone.gradientFrom}, ${zone.gradientTo})`,
                    border: `1px solid ${zone.borderColor}`,
                  }}
                >
                  <Icon className="w-6 h-6" style={{ color: zone.accentColor }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4
                      className="text-lg font-heading tracking-wide"
                      style={{ color: zone.accentColor }}
                    >
                      {zone.title}
                    </h4>
                    <span className="text-xs text-white/40 uppercase tracking-wider">
                      {zone.subtitle}
                    </span>
                  </div>
                  <p className="text-white/60 text-sm mt-1">{zone.description}</p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
                    {zone.features.map((feature) => (
                      <span key={feature} className="text-xs text-white/40 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" style={{ color: zone.accentColor }} />
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* Capacity & Availability */}
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs font-medium text-white/50">
                      {zone.capacity}
                    </span>
                    {available !== undefined && (
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: available > 0 ? `${zone.gradientFrom}` : 'rgba(255,0,0,0.1)',
                          color: available > 0 ? zone.accentColor : '#ef4444',
                          border: `1px solid ${available > 0 ? zone.borderColor : 'rgba(255,0,0,0.3)'}`,
                        }}
                      >
                        {available > 0 ? `${available} disponibles` : 'Agotadas'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Hover glow effect */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse at center, ${zone.gradientFrom}, transparent 70%)`,
                }}
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
