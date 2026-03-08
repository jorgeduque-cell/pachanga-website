import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wine, Beer, GlassWater, Coffee, Sparkles } from 'lucide-react';
import { ScrollReveal } from '@/components/ScrollReveal';

const categories = [
  { id: 'whisky', label: 'Whisky', icon: Wine },
  { id: 'vodka-gin', label: 'Vodka & Gin', icon: GlassWater },
  { id: 'ron', label: 'Ron', icon: Wine },
  { id: 'aguardiente', label: 'Aguardiente', icon: GlassWater },
  { id: 'tequila', label: 'Tequila', icon: Wine },
  { id: 'viche', label: 'Viche', icon: GlassWater },
  { id: 'soft-drinks', label: 'Soft Drinks', icon: Beer },
];

const menuItems = {
  whisky: [
    // Blended Scotch
    { name: 'Whisky Buchanans 18 Years', description: 'Blended Scotch', price: '$620.000', popular: true },
    { name: 'Old Parr 18 Years', description: 'Blended Scotch', price: '$620.000', popular: true },
    { name: 'Buchanans Master', description: 'Blended Scotch', price: '$380.000', popular: false },
    { name: 'Whisky Buchanans Two Souls', description: 'Blended Scotch', price: '$380.000', popular: false },
    { name: 'Buchanans 12 Años Botella', description: 'Blended Scotch', price: '$300.000', popular: true },
    { name: 'Buchanans 12 Media', description: 'Blended Scotch', price: '$180.000', popular: false },
    { name: 'Old Parr 12 Botella', description: 'Blended Scotch', price: '$320.000', popular: false },
    { name: 'Old Parr 12 Media', description: 'Blended Scotch', price: '$200.000', popular: false },
    { name: 'JW Double Black', description: 'Blended Scotch', price: '$360.000', popular: false },
    { name: 'JW Sello Negro', description: 'Blended Scotch', price: '$320.000', popular: false },
    { name: 'JW Sello Rojo', description: 'Blended Scotch', price: '$220.000', popular: false },
    // Malts
    { name: 'Glenlivet Founders', description: 'Single Malt', price: '$380.000', popular: true },
    { name: 'Monkey Shoulder', description: 'Blended Malt', price: '$320.000', popular: true },
  ],
  'vodka-gin': [
    { name: 'Smirnoff Tradicional', description: 'Vodka', price: '$260.000', popular: false },
    { name: 'Vodka Absolut', description: 'Vodka sueco', price: '$250.000', popular: true },
    { name: 'Gordons Dry Gin', description: 'Gin inglés', price: '$220.000', popular: false },
    { name: 'Smirnoff Tamarindo', description: 'Vodka saborizado', price: '$200.000', popular: true },
  ],
  ron: [
    { name: 'Caldas 8 Años Botella', description: 'Ron añejo colombiano', price: '$220.000', popular: true },
    { name: 'Caldas 8 Años Media', description: 'Ron añejo colombiano', price: '$120.000', popular: false },
    { name: 'Caldas 3 Años Botella', description: 'Ron añejo colombiano', price: '$180.000', popular: false },
    { name: 'Caldas Esencial Botella', description: 'Ron añejo colombiano', price: '$160.000', popular: false },
  ],
  aguardiente: [
    { name: 'Amarillo de Manzanares', description: 'Aguardiente tradicional', price: '$180.000', popular: true },
    { name: 'Antioqueño Azul', description: 'Aguardiente sin azúcar', price: '$160.000', popular: false },
    { name: 'Antioqueño Verde', description: 'Aguardiente tradicional', price: '$160.000', popular: false },
  ],
  tequila: [
    { name: 'Don Julio 70', description: 'Tequila añejo cristalino', price: '$750.000', popular: true },
    { name: 'Tequila Maestro Dobel', description: 'Tequila cristalino', price: '$560.000', popular: true },
    { name: 'Reserva Don Julio Reposado', description: 'Tequila reposado', price: '$500.000', popular: false },
    { name: 'Tequila Jimador Reposado', description: 'Tequila reposado', price: '$240.000', popular: false },
  ],
  viche: [
    { name: 'Viche Botella', description: 'Licor artesanal de caña', price: '$150.000', popular: true },
    { name: 'Viche Media', description: 'Licor artesanal de caña', price: '$80.000', popular: false },
  ],
  'soft-drinks': [
    { name: 'Erdinger Weissbier 500ml', description: 'Cerveza de trigo alemana', price: '$30.000', popular: true },
    { name: 'Peroni / Corona', description: 'Cerveza importada', price: '$18.000', popular: false },
    { name: 'Smirnoff Ice', description: 'Bebida alcohólica saborizada', price: '$15.000', popular: false },
    { name: 'Electrolit', description: 'Bebida hidratante', price: '$25.000', popular: false },
    { name: 'Redbull', description: 'Bebida energética', price: '$20.000', popular: true },
    { name: 'Gatorade', description: 'Bebida deportiva', price: '$12.000', popular: false },
    { name: 'Agua Cristal', description: 'Agua mineral', price: '$8.000', popular: false },
    { name: 'Soda / Ginger Ale', description: 'Gaseosa', price: '$8.000', popular: false },
    { name: 'Coca Cola 400ml', description: 'Gaseosa', price: '$8.000', popular: false },
  ],
};

export function MenuPage() {
  const [activeCategory, setActiveCategory] = useState('whisky');

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
              CARTA DE <span className="text-gradient-fire">LICORES</span>
            </h1>
            <p className="text-white/60 max-w-xl mx-auto font-body text-lg">
              Los mejores licores, whiskys, rones y bebidas para acompañar tu noche de salsa
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Category Tabs - Glass */}
      <section className="sticky top-20 z-30 glass-nav border-y border-[var(--glass-border)] py-4 px-4">
        <div className="max-w-5xl mx-auto">
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
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-full font-heading text-sm uppercase tracking-wider transition-all overflow-hidden ${
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
                  className="group glass-card p-6 cursor-pointer relative overflow-hidden"
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
                    <span className="text-2xl font-heading text-gradient-gold group-hover:scale-110 transition-transform whitespace-nowrap">
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
                { icon: Wine, title: 'Licores Premium', desc: 'Las mejores marcas nacionales e importadas', color: 'var(--accent-red)' },
                { icon: Coffee, title: 'Reserva tu Botella', desc: 'Servicio de reserva de botellas disponible', color: 'var(--accent-gold)' },
                { icon: GlassWater, title: 'Cócteles Especiales', desc: 'Pregunta por nuestra carta de cócteles', color: 'var(--accent-red)' },
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
