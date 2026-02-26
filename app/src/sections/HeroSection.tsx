import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useRef, useState, useEffect, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Play, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ========================================
// CANVAS PARTICLES - Premium effect
// ========================================
const CanvasParticles = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: Array<{
      x: number;
      y: number;
      size: number;
      speedY: number;
      opacity: number;
      color: string;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      particles = [];
      const count = Math.min(25, Math.floor(window.innerWidth / 60));
      
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          speedY: Math.random() * 0.5 + 0.2,
          opacity: Math.random() * 0.5 + 0.2,
          color: Math.random() > 0.5 ? '#FFD700' : '#E31B23',
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.y -= p.speedY;
        
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity * (0.5 + Math.sin(Date.now() * 0.003 + p.x) * 0.3);
        ctx.fill();

        // Glow effect
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity * 0.1;
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      animationId = requestAnimationFrame(animate);
    };

    resize();
    createParticles();
    animate();

    window.addEventListener('resize', () => {
      resize();
      createParticles();
    });

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
    />
  );
});

CanvasParticles.displayName = 'CanvasParticles';

// ========================================
// TYPEWRITER - Terminal style with blinking cursor
// ========================================
function TypewriterText({ text }: { text: string }) {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (isComplete) {
      setDisplayText(text);
      return;
    }

    let index = 0;
    const interval = setInterval(() => {
      if (index <= text.length) {
        setDisplayText(text.slice(0, index));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [text, isComplete]);

  return (
    <span className="font-mono text-sm md:text-base uppercase tracking-[0.3em] text-[var(--accent-gold)]">
      <span className="text-[var(--accent-red)] mr-2">❯</span>
      {displayText}
      {!isComplete && (
        <motion.span
          className="inline-block w-2 h-4 bg-[var(--accent-gold)] ml-1 align-middle"
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      )}
      {isComplete && (
        <motion.span
          className="inline-block w-2 h-4 bg-[var(--accent-gold)] ml-1 align-middle"
          animate={{ opacity: [1, 1, 0, 0] }}
          transition={{ duration: 1, repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
        />
      )}
    </span>
  );
}

// ========================================
// VIDEO BACKGROUND with fallback
// ========================================
const VideoBackground = memo(({ scrollProgress }: { scrollProgress: any }) => {
  const blur = useTransform(scrollProgress, [0, 0.5], [0, 10]);
  const scale = useTransform(scrollProgress, [0, 0.5], [1, 1.1]);
  const saturate = useTransform(scrollProgress, [0, 0.5], [1, 0.3]);

  return (
    <motion.div
      className="absolute inset-0 z-0"
      style={{
        filter: blur.get() > 0 ? `blur(${blur.get()}px) saturate(${saturate.get()})` : 'none',
        scale,
      }}
    >
      {/* Video Background - with poster fallback */}
      <video
        autoPlay
        muted
        loop
        playsInline
        poster="/fondo pyp.png"
        className="absolute inset-0 w-full h-full object-cover"
      >
        {/* If video files exist, they would be loaded here */}
        {/* <source src="/hero-video.webm" type="video/webm" /> */}
        {/* <source src="/hero-video.mp4" type="video/mp4" /> */}
        {/* Fallback to image is handled by poster */}
      </video>

      {/* Fallback image when video not available */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(/fondo pyp.png)` }}
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)]/50 to-[var(--bg-base)]/70" />
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-base)]/30 via-transparent to-[var(--bg-base)]/30" />
    </motion.div>
  );
});

VideoBackground.displayName = 'VideoBackground';

// ========================================
// MAIN HERO SECTION
// ========================================
export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Parallax transforms
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.4], [0, -100]);

  // Throttled mouse tracking
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (prefersReducedMotion || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      setMousePos({ x, y });
    },
    [prefersReducedMotion]
  );

  useEffect(() => {
    if (prefersReducedMotion) return;

    let rafId: number;

    const throttledHandler = (e: MouseEvent) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        handleMouseMove(e);
        rafId = 0;
      });
    };

    window.addEventListener('mousemove', throttledHandler, { passive: true });
    return () => {
      window.removeEventListener('mousemove', throttledHandler);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [handleMouseMove, prefersReducedMotion]);

  const glowX = (mousePos.x - 0.5) * 30;
  const glowY = (mousePos.y - 0.5) * 30;

  return (
    <section
      ref={containerRef}
      className="relative h-screen min-h-[700px] overflow-hidden flex items-center justify-center will-change-transform"
    >
      {/* Background with Video + Parallax + Blur */}
      <motion.div style={{ y, opacity }} className="absolute inset-0 z-0">
        <VideoBackground scrollProgress={scrollYProgress} />
        {!prefersReducedMotion && <CanvasParticles />}
      </motion.div>

      {/* Spotlight effect */}
      {!prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 z-[1] pointer-events-none hidden md:block"
          style={{
            background: `radial-gradient(600px circle at ${mousePos.x * 100}% ${mousePos.y * 100}%, rgba(255,215,0,0.1), transparent 40%)`,
          }}
        />
      )}

      {/* Content */}
      <motion.div
        style={{ opacity: contentOpacity, y: contentY }}
        className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
      >
        {/* Logo with glow effect */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 relative"
        >
          {/* Animated glow */}
          <motion.div
            className="absolute inset-0 bg-[var(--accent-gold)]/10 rounded-full blur-3xl -z-10"
            animate={{
              x: glowX,
              y: glowY,
              scale: [1.3, 1.5, 1.3],
            }}
            transition={{
              x: { type: 'spring', stiffness: 50, damping: 20 },
              y: { type: 'spring', stiffness: 50, damping: 20 },
              scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
            }}
          />

          <motion.img
            src="/logo_completo_sin_fondo.png"
            alt="Pachanga y Pochola"
            className="h-40 md:h-52 lg:h-64 w-auto mx-auto object-contain"
            style={{
              filter: 'drop-shadow(0 0 30px rgba(255, 215, 0, 0.4))',
            }}
            animate={
              prefersReducedMotion
                ? undefined
                : {
                    filter: [
                      'drop-shadow(0 0 20px rgba(255, 215, 0, 0.3))',
                      'drop-shadow(0 0 50px rgba(255, 215, 0, 0.6))',
                      'drop-shadow(0 0 20px rgba(255, 215, 0, 0.3))',
                    ],
                  }
            }
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>

        {/* Subtitle with Typewriter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-5"
        >
          <TypewriterText text="DESDE 1988 • BOGOTÁ, COLOMBIA" />
        </motion.div>

        {/* Slogan */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-xl md:text-2xl lg:text-3xl text-white font-heading italic tracking-wide mb-10"
        >
          <span className="text-[var(--accent-gold)]">&ldquo;</span>
          La salsa vuelve a brillar
          <span className="text-[var(--accent-gold)]">&rdquo;</span>
        </motion.p>

        {/* CTA Buttons - Updated to link to /reservas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          {/* Primary CTA with pulse glow */}
          <Link to="/reservas">
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(227, 27, 35, 0)',
                  '0 0 0 10px rgba(227, 27, 35, 0.15)',
                  '0 0 0 20px rgba(227, 27, 35, 0)',
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="rounded-sm"
            >
              <Button size="lg" className="btn-primary text-base px-8 py-6 relative overflow-hidden group">
                <span className="relative z-10 flex items-center">
                  <Calendar size={20} className="mr-2" />
                  RESERVA TU MESA
                </span>
                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                  animate={{ translateX: ['0%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                />
              </Button>
            </motion.div>
          </Link>

          <Link to="/eventos">
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)] px-8 py-6 text-base font-heading uppercase tracking-wider transition-all"
            >
              <Play size={20} className="mr-2" />
              Ver Eventos
            </Button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <button
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
          className="flex flex-col items-center gap-1 text-white/40 hover:text-[var(--accent-gold)] transition-colors group"
        >
          <span className="text-xs uppercase tracking-widest font-heading">Descubre más</span>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronDown size={28} />
          </motion.div>
        </button>
      </motion.div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--bg-base)] to-transparent z-10" />
    </section>
  );
}
