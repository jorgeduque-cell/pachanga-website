export function StatsSection() {
  return (
    <section className="bg-[#E31B23] py-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-4xl md:text-5xl font-heading text-white">37+</p>
            <p className="text-white/80 text-sm uppercase tracking-wider">Años de historia</p>
          </div>
          <div>
            <p className="text-4xl md:text-5xl font-heading text-white">J-V-S</p>
            <p className="text-white/80 text-sm uppercase tracking-wider">6PM - 3AM</p>
          </div>
          <div>
            <p className="text-4xl md:text-5xl font-heading text-white">2</p>
            <p className="text-white/80 text-sm uppercase tracking-wider">Pisos de rumba</p>
          </div>
          <div>
            <p className="text-4xl md:text-5xl font-heading text-white">∞</p>
            <p className="text-white/80 text-sm uppercase tracking-wider">Noches inolvidables</p>
          </div>
        </div>
      </div>
    </section>
  );
}
