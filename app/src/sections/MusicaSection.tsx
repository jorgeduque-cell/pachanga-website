import { Music } from 'lucide-react';

export function MusicaSection() {
  const genres = [
    { title: 'SALSA BRAVA', desc: 'La clásica de siempre', icon: '🎺' },
    { title: 'TIMBA CUBANA', desc: 'El sabor de La Habana', icon: '🥁' },
    { title: 'CHIRIMÍA', desc: 'Ritmos del Pacífico', icon: '🎷' },
    { title: 'URBANO', desc: 'Lo nuevo con sabor', icon: '🔥' },
  ];

  return (
    <section id="musica" className="py-20 md:py-32 px-4 bg-[#111]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Music className="text-[#E31B23]" size={32} />
            <span className="text-[#FFD700] uppercase tracking-wider text-sm font-heading">Lo que suena</span>
          </div>
          <h2 className="section-title mb-4">
            NUESTRA <span className="text-[#E31B23]">MÚSICA</span>
          </h2>
          <p className="section-subtitle">
            De la salsa brava a la timba cubana, pasando por la chirimía del Pacífico
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {genres.map((genre, index) => (
            <div 
              key={index} 
              className="bg-[#1a1a1a] border border-[#333] p-6 hover:border-[#E31B23] hover:shadow-[0_0_20px_rgba(227,27,35,0.3)] transition-all duration-300 group"
            >
              <div className="text-4xl mb-4">{genre.icon}</div>
              <h3 className="text-xl font-heading text-white mb-2 group-hover:text-[#E31B23] transition-colors">
                {genre.title}
              </h3>
              <p className="text-white/60 font-body">{genre.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 relative">
          <div className="relative overflow-hidden border-neon-red">
            <img 
              src="/orquesta.jpg" 
              alt="Orquesta en vivo" 
              className="w-full h-[400px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
            <div className="absolute bottom-8 left-8">
              <p className="text-[#FFD700] uppercase tracking-wider text-sm mb-2 font-heading">Orquestas en Vivo</p>
              <h3 className="text-3xl md:text-4xl font-heading text-white">
                LOS MEJORES ARTISTAS<br/>EN NUESTRO ESCENARIO
              </h3>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
