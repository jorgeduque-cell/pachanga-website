import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { ScrollReveal } from '@/components/ScrollReveal';

const galleryImages = [
  { src: '/pachanga3.jpeg', category: 'ambiente', title: 'Noches de salsa' },
  { src: '/pachanga5.jpeg', category: 'ambiente', title: 'Nuestro ambiente' },
  { src: '/pachanga4.jpeg', category: 'eventos', title: 'Celebraciones' },
  { src: '/pachanga3.jpeg', category: 'ambiente', title: 'El ambiente' },
  { src: '/pachanga5.jpeg', category: 'ambiente', title: 'La pista' },
  { src: '/pachanga4.jpeg', category: 'eventos', title: 'Eventos especiales' },
  { src: '/dancers.jpg', category: 'historia', title: 'Nuestra historia' },
  { src: '/hero-salsa.jpg', category: 'ambiente', title: 'Noches especiales' },
];

const categories = [
  { id: 'todos', label: 'Todos' },
  { id: 'ambiente', label: 'Ambiente' },
  { id: 'musica', label: 'Música' },
  { id: 'eventos', label: 'Eventos' },
  { id: 'historia', label: 'Historia' },
];

export function GaleriaPage() {
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const filteredImages = selectedCategory === 'todos'
    ? galleryImages
    : galleryImages.filter(img => img.category === selectedCategory);

  const currentIndex = selectedImage !== null ? selectedImage : 0;
  const currentImage = filteredImages[currentIndex];

  const nextImage = () => {
    setSelectedImage((prev) => (prev === null ? 0 : (prev + 1) % filteredImages.length));
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev === null ? 0 : (prev - 1 + filteredImages.length) % filteredImages.length));
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'Escape') setSelectedImage(null);
  };

  return (
    <div 
      className="min-h-screen bg-[var(--bg-base)] pt-24"
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <span className="text-[var(--accent-red)] uppercase tracking-[0.3em] text-sm font-heading mb-4 block">
                Momentos Inolvidables
              </span>
              <h1 className="text-5xl md:text-7xl font-heading text-white mb-6">
                GALERÍA DE <span className="text-gradient-gold">RUMBA</span>
              </h1>
              <p className="text-white/60 max-w-xl mx-auto font-body">
                Capturando la esencia de la salsa desde 1988. 
                Un vistazo a nuestras noches más memorables.
              </p>
            </div>
          </ScrollReveal>

          {/* Category Filter - Glass Tabs */}
          <ScrollReveal delay={0.2}>
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {categories.map((cat) => (
                <motion.button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-6 py-2.5 rounded-full font-heading text-sm uppercase tracking-wider transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-gradient-to-r from-[var(--accent-red)] to-[var(--accent-red-light)] text-white shadow-[0_0_20px_rgba(227,27,35,0.3)]'
                      : 'glass-btn text-white/70 hover:text-white'
                  }`}
                >
                  {cat.label}
                </motion.button>
              ))}
            </div>
          </ScrollReveal>

          {/* Gallery Grid - Masonry Style */}
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredImages.map((image, index) => (
                <motion.div
                  key={`${image.src}-${index}`}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`relative group cursor-pointer overflow-hidden rounded-xl ${
                    index === 0 || index === 3 ? 'md:col-span-2 lg:col-span-1' : ''
                  } ${index === 0 ? 'md:row-span-2' : ''}`}
                  onClick={() => setSelectedImage(index)}
                >
                  <div className={`relative overflow-hidden ${index === 0 ? 'aspect-[3/4]' : 'aspect-square'}`}>
                    <img
                      src={image.src}
                      alt={image.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-[var(--accent-gold)] text-xs uppercase tracking-wider font-heading mb-1">
                        {image.category}
                      </span>
                      <h3 className="text-white font-heading text-xl">{image.title}</h3>
                    </div>

                    {/* Camera Icon - Glass */}
                    <div className="absolute top-4 right-4 w-10 h-10 rounded-full glass-card flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
                      <Camera size={18} className="text-white" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Lightbox - Glass Controls */}
      <AnimatePresence>
        {selectedImage !== null && currentImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center"
            onClick={() => setSelectedImage(null)}
          >
            {/* Close Button - Glass */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full glass-card-heavy flex items-center justify-center text-white hover:text-[var(--accent-gold)] transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <X size={24} />
            </motion.button>

            {/* Navigation - Glass */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.1, x: -5 }}
              className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass-card-heavy flex items-center justify-center text-white hover:text-[var(--accent-gold)] transition-all"
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
            >
              <ChevronLeft size={24} />
            </motion.button>
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.1, x: 5 }}
              className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass-card-heavy flex items-center justify-center text-white hover:text-[var(--accent-gold)] transition-all"
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
            >
              <ChevronRight size={24} />
            </motion.button>

            {/* Image */}
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="max-w-5xl max-h-[80vh] mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={currentImage.src}
                alt={currentImage.title}
                className="w-full h-full object-contain rounded-xl shadow-2xl"
              />
              <div className="mt-4 text-center">
                <h3 className="text-white font-heading text-xl">{currentImage.title}</h3>
                <span className="text-white/60 text-sm uppercase tracking-wider">{currentImage.category}</span>
              </div>
            </motion.div>

            {/* Counter - Glass */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 glass-card px-4 py-2">
              <span className="text-white/80 font-heading">
                {currentIndex + 1} / {filteredImages.length}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
