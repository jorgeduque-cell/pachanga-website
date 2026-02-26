import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navLinks = [
  { path: '/', label: 'Inicio' },
  { path: '/historia', label: 'Historia' },
  { path: '/galeria', label: 'Galería' },
  { path: '/eventos', label: 'Eventos' },
  { path: '/menu', label: 'Menú' },
  { path: '/reservas', label: 'Reservas' },
  { path: '/contacto', label: 'Contacto' },
];

// Animation variants

const topLineVariants = {
  closed: { rotate: 0, y: 0 },
  open: { rotate: 45, y: 6 },
};

const bottomLineVariants = {
  closed: { rotate: 0, y: 0 },
  open: { rotate: -45, y: -6 },
};

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'glass-nav'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 lg:h-24">
            {/* Logo Minimalista */}
            <Link to="/" className="relative group flex items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="relative"
              >
                <img
                  src="/logo_dorado_sin_fondo.png"
                  alt="Pachanga y Pochola"
                  className="h-8 w-auto object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                />
              </motion.div>

              {/* Texto del brand */}
              <div className="ml-2 hidden md:block">
                <span className="text-[var(--accent-gold)] font-heading text-base tracking-wider">
                  PACHANGA
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-4 py-2 font-heading text-sm uppercase tracking-wider transition-colors duration-300 group ${
                    isActive(link.path)
                      ? 'text-[var(--accent-gold)]'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  {link.label}
                  {/* Underline animado con glow */}
                  <motion.span
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full"
                    style={{
                      background: `linear-gradient(90deg, transparent, var(--accent-gold), transparent)`,
                      boxShadow: isActive(link.path) 
                        ? '0 0 10px var(--accent-gold), 0 0 20px var(--accent-gold)' 
                        : 'none',
                    }}
                    initial={false}
                    animate={{
                      width: isActive(link.path) ? '70%' : '0%',
                      opacity: isActive(link.path) ? 1 : 0,
                    }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  />
                  {/* Hover underline */}
                  <span 
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] rounded-full group-hover:w-[70%] transition-all duration-300"
                    style={{
                      background: 'linear-gradient(90deg, transparent, var(--accent-gold), transparent)',
                    }}
                  />
                </Link>
              ))}
            </nav>

            {/* CTA & Mobile Menu Button */}
            <div className="flex items-center gap-4">
              <a 
                href="tel:+573219992719" 
                className="hidden md:flex items-center gap-2 text-white/80 hover:text-[var(--accent-gold)] transition-colors"
              >
                <Phone size={18} />
                <span className="font-heading text-sm">+57 321 999 2719</span>
              </a>

              {/* RESERVAR AHORA con pulse glow permanente */}
              <Link to="/reservas" className="relative">
                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 0 0 rgba(227, 27, 35, 0)',
                      '0 0 0 8px rgba(227, 27, 35, 0.2)',
                      '0 0 0 0 rgba(227, 27, 35, 0)',
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="rounded-sm"
                >
                  <Button 
                    className="btn-primary relative overflow-hidden"
                  >
                    <span className="relative z-10">Reservar Ahora</span>
                  </Button>
                </motion.div>
              </Link>

              {/* Mobile Menu Button - Animated Hamburger */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-white hover:bg-white/10 relative w-12 h-12"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              >
                <motion.div
                  className="w-6 h-5 flex flex-col justify-between"
                  animate={isMobileMenuOpen ? 'open' : 'closed'}
                >
                  <motion.span
                    variants={topLineVariants}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="w-full h-0.5 bg-white origin-center"
                  />
                  <motion.span
                    animate={{ opacity: isMobileMenuOpen ? 0 : 1 }}
                    transition={{ duration: 0.1 }}
                    className="w-full h-0.5 bg-white"
                  />
                  <motion.span
                    variants={bottomLineVariants}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="w-full h-0.5 bg-white origin-center"
                  />
                </motion.div>
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 bottom-0 w-[300px] glass-card-heavy border-l border-[var(--glass-border)] p-6 pt-24"
            >
              <div className="flex flex-col gap-2">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                  >
                    <Link
                      to={link.path}
                      className={`block py-3 px-4 font-heading text-lg uppercase tracking-wider transition-all rounded-lg ${
                        isActive(link.path)
                          ? 'bg-[var(--accent-red)]/20 text-[var(--accent-gold)] border-l-4 border-[var(--accent-red)]'
                          : 'text-white/80 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 pt-8 border-t border-[var(--glass-border)]">
                <a 
                  href="tel:+573219992719" 
                  className="flex items-center gap-3 text-white/80 hover:text-[var(--accent-gold)] transition-colors mb-4"
                >
                  <Phone size={20} />
                  <span className="font-heading">+57 321 999 2719</span>
                </a>
                <Link to="/reservas" className="block">
                  <Button className="btn-primary w-full">
                    Reservar Ahora
                  </Button>
                </Link>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
