import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users,
  BarChart3,
  LogOut, 
  Menu, 
  X,
  ChevronRight,
  User,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useChatbotStats } from '@/hooks/useChatbot';

export function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/reservas', label: 'Reservas', icon: CalendarDays },
    { path: '/admin/clientes', label: 'Clientes', icon: Users },
    { path: '/admin/encuestas', label: 'Encuestas', icon: BarChart3 },
    { path: '/admin/chatbot', label: 'Chatbot IA', icon: Bot },
  ];

  const { data: chatbotStats } = useChatbotStats();
  const escalatedCount = chatbotStats?.escalatedConversations || 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Sidebar */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#111] border-r border-[#333] transform transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'
        }`}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-center border-b border-gray-700 px-4 bg-[#0f0f0f]">
          <img 
            src="/logo_dorado_sin_fondo.png" 
            alt="Pachanga y Pochola" 
            className={`h-12 w-auto transition-all ${isSidebarOpen ? '' : 'lg:hidden'}`}
          />
          {!isSidebarOpen && <span className="hidden lg:block text-[#FFD700] font-heading text-2xl">P</span>}
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-medium ${
                  isActive 
                    ? 'bg-[#E31B23] text-white shadow-lg shadow-[#E31B23]/20' 
                    : 'text-gray-300 hover:bg-[#1a1a1a] hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className={`font-heading uppercase tracking-wider ${isSidebarOpen ? '' : 'lg:hidden'}`}>
                  {item.label}
                </span>
                {isActive && isSidebarOpen && <ChevronRight size={16} className="ml-auto" />}
                {item.path === '/admin/chatbot' && escalatedCount > 0 && !isActive && (
                  <span className="ml-auto bg-amber-500 text-black text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                    {escalatedCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#333]">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-white/60 hover:text-white hover:bg-[#E31B23]"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span className={isSidebarOpen ? '' : 'lg:hidden'}>Cerrar Sesión</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-[#111] border-b border-[#333] flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-white"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>

            {/* Desktop toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex text-white"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu size={24} />
            </Button>

            <div className="hidden sm:block">
            <h1 className="text-white font-heading text-xl uppercase tracking-wider">
              Panel de Administración
            </h1>
            <p className="text-white/40 text-xs">Pachanga y Pochola • Gestión integral</p>
          </div>
          </div>

          {/* User info */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-white font-heading text-sm">{user?.name}</p>
              <p className="text-white/60 text-xs uppercase">{user?.role}</p>
            </div>
            <div className="w-10 h-10 bg-[#E31B23] rounded-full flex items-center justify-center">
              <User className="text-white" size={20} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
