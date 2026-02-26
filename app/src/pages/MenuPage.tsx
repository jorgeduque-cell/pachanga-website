import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wine, Beer, Coffee, UtensilsCrossed, GlassWater, Citrus, Sparkles } from 'lucide-react';
import { ScrollReveal } from '@/components/ScrollReveal';

const categories = [
  { id: 'cocteles', label: 'Cócteles', icon: Wine },
  { id: 'cervezas', label: 'Cervezas', icon: Beer },
  { id: 'sin-alcohol', label: 'Sin Alcohol', icon: GlassWater },
  { id: 'shots', label: 'Shots', icon: Coffee },
];

const menuItems = {
  cocteles: [
    { name: 'Mojito Cubano', description: 'Ron, hierbabuena, limón, azúcar y soda', price: '$25.000', popular: true },
    { name: 'Cuba Libre', description: 'Ron, Coca-Cola y limón', price: '$22.000', popular: false },
    { name: 'Margarita', description: 'Tequila, triple sec y limón', price: '$28.000', popular: true },
    { name: 'Piña Colada', description: 'Ron, crema de coco y jugo de piña', price: '$26.000', popular: false },
    { name: 'Caipirinha', description: 'Cachaça, limón y azúcar', price: '$24.000', popular: false },
    { name: 'Gin Tonic', description: 'Gin premium y agua tónica', price: '$32.000', popular: false },
  ],
  cervezas: [
    { name: 'Corona', description: 'Cerveza mexicana 355ml', price: '$12.000', popular: false },
    { name: 'Club Colombia', description: 'Cerveza nacional 330ml', price: '$10.000', popular: true },
    { name: 'Heineken', description: 'Cerveza holandesa 330ml', price: '$13.000', popular: false },
    { name: 'Stella Artois', description: 'Cerveza belga 330ml', price: '$14.000', popular: false },
    { name: 'Poker', description: 'Cerveza nacional 330ml', price: '$8.000', popular: false },
  ],
  'sin-alcohol': [
    { name: 'Limonada Natural', description: 'Limón, agua y azúcar', price: '$8.000', popular: false },
    { name: 'Limonada de Coco', description: 'Limón, crema de coco y azúcar', price: '$12.000', popular: true },
    { name: 'Jugo de Mango', description: 'Jugo natural de mango', price: '$10.000', popular: false },
    { name: 'Jugo de Maracuyá', description: 'Jugo natural de maracuyá', price: '$10.000', popular: false },
    { name: 'Agua sin Gas', description: 'Agua mineral 500ml', price: '$5.000', popular: false },
  ],
  shots: [
    { name: 'Tequila', description: 'Shot de tequila con sal y limón', price: '$15.000', popular: true },
    { name: 'Jägermeister', description: 'Shot de Jäger frío', price: '$18.000', popular: false },
    { name: 'Fireball', description: 'Whisky de canela', price: '$16.000', popular: true },
    { name: 'Aguardiente', description: 'Tradicional colombiano', price: '$12.000', popular: true },
  ],
};

export function MenuPage() {
  const [activeCategory, setActiveCategory] = useState('cocteles');

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pt-24">
      {/* Hero */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--accent-gold)]/5 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[var(--accent-gold)]/10 rounded-full blur-[100px]" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <ScrollReveal>
            <span className="text-[var(--accent-gold)] uppercase tracking-[0.3em] text-sm font-heading mb-4 block">
              Nuestra Carta
            </span>
            <h1 className="text-5xl md:text-7xl font-heading text-white mb-6">
              MENÚ DE <span className="text-gradient-fire">BEBIDAS</span>
            </h1>
            <p className="text-white/60 max-w-xl mx-auto font-body text-lg">
              Los mejores cócteles y bebidas para acompañar tu noche de salsa
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Category Tabs - Glass */}
      <section className="sticky top-20 z-30 glass-nav border-y border-[var(--glass-border)] py-4 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              
              return (
                <motion.button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full font-heading text-sm uppercase tracking-wider transition-all overflow-hidden ${
                    isActive
                      ? 'text-white'
                      : 'text-white/60 hover:text-white glass-btn'
                  }`}
                >
                  {/* Active background */}
                  {isActive && (
                    <motion.div
                      layoutId="activeMenuTab"
                      className="absolute inset-0 bg-gradient-to-r from-[var(--accent-red)] to-[var(--accent-red-light)]"
                      style={{ borderRadius: '9999px' }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon size={16} />
                    {cat.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Menu Items - Premium Cards */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {menuItems[activeCategory as keyof typeof menuItems].map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01, x: 5 }}
                  className="group glass-card p-6 cursor-pointer"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-heading text-white group-hover:text-[var(--accent-gold)] transition-colors">
                          {item.name}
                        </h3>
                        {item.popular && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-heading uppercase"
                            style={{
                              background: 'linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,215,0,0.1))',
                              border: '1px solid rgba(255,215,0,0.3)',
                              color: 'var(--accent-gold)',
                              boxShadow: '0 0 10px rgba(255,215,0,0.2)',
                            }}
                          >
                            <Sparkles size={10} />
                            Popular
                          </motion.span>
                        )}
                      </div>
                      <p className="text-white/50 font-body text-sm">
                        {item.description}
                      </p>
                    </div>
                    {/* Gold gradient price */}
                    <span className="text-2xl font-heading text-gradient-gold group-hover:scale-110 transition-transform">
                      {item.price}
                    </span>
                  </div>
                  
                  {/* Hover glow line */}
                  <motion.div
                    className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-[var(--accent-gold)] to-transparent"
                    initial={{ width: 0 }}
                    whileHover={{ width: '100%' }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Info - Glass Cards */}
      <section className="py-16 px-4 bg-[var(--bg-surface)]">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Wine, title: 'Cócteles Premium', desc: 'Preparados por bartenders expertos', color: 'var(--accent-red)' },
                { icon: UtensilsCrossed, title: 'Snack Bar', desc: 'Acompañamientos disponibles', color: 'var(--accent-gold)' },
                { icon: Citrus, title: 'Ingredientes Frescos', desc: 'Siempre frescos y naturales', color: 'var(--accent-red)' },
              ].map((item) => (
                <motion.div
                  key={item.title}
                  whileHover={{ y: -5 }}
                  className="glass-card p-6 text-center group"
                >
                  <div 
                    className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ 
                      background: `linear-gradient(135deg, ${item.color}20, ${item.color}10)`,
                      border: `1px solid ${item.color}30`,
                    }}
                  >
                    <item.icon style={{ color: item.color }} size={28} />
                  </div>
                  <h3 className="text-white font-heading text-lg mb-2">{item.title}</h3>
                  <p className="text-white/60 text-sm font-body">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Note */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-white/40 text-sm font-body">
            * Los precios pueden variar sin previo aviso. <br />
            * Prohibido el expendio de bebidas embriagantes a menores de edad. <br />
            * El exceso de alcohol es perjudicial para la salud.
          </p>
        </div>
      </section>
    </div>
  );
}
