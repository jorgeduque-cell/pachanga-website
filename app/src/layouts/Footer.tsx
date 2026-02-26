import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Instagram, Facebook, MapPin, Phone, Clock, Mail, ArrowUpRight } from 'lucide-react';

const footerLinks = {
  navegacion: [
    { path: '/', label: 'Inicio' },
    { path: '/historia', label: 'Historia' },
    { path: '/galeria', label: 'Galería' },
    { path: '/eventos', label: 'Eventos' },
    { path: '/menu', label: 'Menú' },
    { path: '/reservas', label: 'Reservas' },
    { path: '/contacto', label: 'Contacto' },
  ],
  eventos: [
    { path: '/eventos', label: 'Cumpleaños' },
    { path: '/eventos', label: 'Fiestas de Blanco' },
    { path: '/eventos', label: 'Eventos Corporativos' },
    { path: '/eventos', label: 'Orquestas en Vivo' },
  ],
};

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[var(--bg-void)] border-t border-[var(--glass-border)]">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <img
                src="/logo_dorado_sin_fondo.png"
                alt="Pachanga y Pochola"
                className="h-16 w-auto mb-6 object-contain"
              />
              <p className="text-white/60 font-body text-sm leading-relaxed mb-6">
                La rumba salsera más auténtica de Bogotá desde 1988. 
                Aquí se baila pegadito, con el ritmo en las caderas.
              </p>
              <div className="flex gap-3">
                <a
                  href="https://instagram.com/pachanga_y_pochola"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/30 flex items-center justify-center text-[var(--accent-red)] hover:bg-[var(--accent-red)] hover:text-white transition-all duration-300 hover:shadow-[0_0_15px_rgba(227,27,35,0.4)]"
                >
                  <Instagram size={18} />
                </a>
                <a
                  href="https://facebook.com/pachangaypochola"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/30 flex items-center justify-center text-[var(--accent-red)] hover:bg-[var(--accent-red)] hover:text-white transition-all duration-300 hover:shadow-[0_0_15px_rgba(227,27,35,0.4)]"
                >
                  <Facebook size={18} />
                </a>
              </div>
            </motion.div>
          </div>

          {/* Navigation Links */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <h4 className="text-white font-heading uppercase tracking-wider mb-6 text-sm">
                Navegación
              </h4>
              <ul className="space-y-3">
                {footerLinks.navegacion.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-white/60 hover:text-[var(--accent-gold)] transition-colors font-body text-sm flex items-center group"
                    >
                      <span className="w-0 group-hover:w-2 h-[1px] bg-[var(--accent-gold)] mr-0 group-hover:mr-2 transition-all" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Events Links */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h4 className="text-white font-heading uppercase tracking-wider mb-6 text-sm">
                Eventos
              </h4>
              <ul className="space-y-3">
                {footerLinks.eventos.map((link, idx) => (
                  <li key={idx}>
                    <Link
                      to={link.path}
                      className="text-white/60 hover:text-[var(--accent-gold)] transition-colors font-body text-sm flex items-center group"
                    >
                      <span className="w-0 group-hover:w-2 h-[1px] bg-[var(--accent-gold)] mr-0 group-hover:mr-2 transition-all" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Contact Info */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h4 className="text-white font-heading uppercase tracking-wider mb-6 text-sm">
                Contacto
              </h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin className="text-[var(--accent-red)] mt-0.5 flex-shrink-0" size={16} />
                  <span className="text-white/60 font-body text-sm">
                    Calle 73 # 14-53<br />
                    Galerías, Bogotá
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="text-[var(--accent-red)] flex-shrink-0" size={16} />
                  <a href="tel:+573219992719" className="text-white/60 hover:text-[var(--accent-gold)] font-body text-sm transition-colors">
                    +57 321 999 2719
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="text-[var(--accent-red)] flex-shrink-0" size={16} />
                  <a href="mailto:info@pachangaypochola.com" className="text-white/60 hover:text-[var(--accent-gold)] font-body text-sm transition-colors">
                    info@pachangaypochola.com
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Clock className="text-[var(--accent-red)] flex-shrink-0" size={16} />
                  <span className="text-white/60 font-body text-sm">
                    Jueves - Sábado: 6PM - 3AM
                  </span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[var(--glass-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-sm font-body text-center md:text-left">
              © 2026 Pachanga y Pochola. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-6">
              {/* Admin link solo visible en desarrollo */}
              {isDevelopment && (
                <Link 
                  to="/admin/login" 
                  className="text-white/40 hover:text-white/60 text-sm font-body transition-colors"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={scrollToTop}
                className="flex items-center gap-1 text-[var(--accent-gold)] hover:text-white text-sm font-heading uppercase tracking-wider transition-colors group"
              >
                Volver arriba
                <ArrowUpRight size={16} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
