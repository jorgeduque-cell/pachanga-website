import { Star, Music } from 'lucide-react';

export function HistoriaSection() {
  return (
    <section id="historia" className="py-20 md:py-32 px-4 bg-dark-gradient">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Star className="text-[#FFD700]" size={28} />
              <span className="text-[#E31B23] uppercase tracking-wider text-sm font-heading">El Legado</span>
            </div>
            <h2 className="section-title text-left mb-6">
              NUESTRA<br/><span className="text-[#E31B23]">HISTORIA</span>
            </h2>
            <div className="w-24 h-1 bg-[#E31B23] mb-8" />
            <p className="text-white/80 text-lg leading-relaxed mb-6 font-body">
              En <strong className="text-[#FFD700]">1988</strong>, cuando la salsa comenzaba a conquistar Bogotá, 
              nació Pachanga y Pochola en el corazón de Galerías. Un grupo de amigos del Pacífico y el Valle 
              decidieron traer la verdadera rumba afrocolombiana a la capital.
            </p>
            <p className="text-white/80 text-lg leading-relaxed mb-6 font-body">
              Aquí no se viene a hacer piruetas de academia. Se viene a bailar <span className="text-[#E31B23] font-bold">"pegadito"</span>, 
              con el ritmo en la cadera, sintiendo cada golpe de tambor, cada nota de piano, cada grito de la trompeta.
            </p>
            <p className="text-white/80 text-lg leading-relaxed mb-8 font-body">
              Somos más que un bar. Somos una <strong className="text-[#FFD700]">embajada del sabor chocoano y valluno</strong> en Bogotá. 
              Un lugar de hermandad donde la comunidad afro encuentra su hogar y donde todos son bienvenidos a vivir la experiencia de la salsa brava.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-[#FFD700]">
                <Music size={20} />
                <span className="font-body">Salsa Clásica</span>
              </div>
              <div className="flex items-center gap-2 text-[#FFD700]">
                <Music size={20} />
                <span className="font-body">Timba Cubana</span>
              </div>
              <div className="flex items-center gap-2 text-[#FFD700]">
                <Music size={20} />
                <span className="font-body">Chirimía del Pacífico</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="relative overflow-hidden border-neon-red">
              <img 
                src="/dancers.jpg" 
                alt="Pareja bailando salsa" 
                className="w-full h-[500px] object-cover hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 border-2 border-[#E31B23] -z-10" />
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#FFD700] -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
