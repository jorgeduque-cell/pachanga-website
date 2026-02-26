import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/spinner';

export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();
  
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError('Credenciales inválidas. Intenta de nuevo.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="/logo_dorado_sin_fondo.png" 
            alt="Pachanga y Pochola" 
            className="h-24 w-auto mx-auto mb-4"
          />
          <div className="flex items-center justify-center gap-2 text-[#E31B23]">
            <Music size={24} />
            <span className="font-heading text-lg uppercase tracking-wider">Panel Administrativo</span>
            <Music size={24} />
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-[#1a1a1a] border border-[#333] p-8">
          <h1 className="text-2xl font-heading text-white text-center mb-6 uppercase">
            Iniciar Sesión
          </h1>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 mb-6 text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-white/80 mb-2 font-body text-sm">Correo electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                <Input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@pachanga.com"
                  required
                  className="pl-10 bg-[#0a0a0a] border-[#333] text-white placeholder:text-white/40 focus:border-[#E31B23]"
                />
              </div>
            </div>

            <div>
              <label className="block text-white/80 mb-2 font-body text-sm">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={20} />
                <Input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pl-10 bg-[#0a0a0a] border-[#333] text-white placeholder:text-white/40 focus:border-[#E31B23]"
                />
              </div>
            </div>

            <Button 
              type="submit"
              className="btn-primary w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner className="w-4 h-4" />
                  INGRESANDO...
                </span>
              ) : (
                'INGRESAR'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-white/40 text-sm">
              Solo personal autorizado
            </p>
          </div>
        </div>

        {/* Back to site */}
        <div className="text-center mt-6">
          <a 
            href="/" 
            className="text-[#FFD700] hover:text-white transition-colors font-body text-sm"
          >
            ← Volver al sitio público
          </a>
        </div>
      </div>
    </div>
  );
}
