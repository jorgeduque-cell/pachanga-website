import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CalendarDays, 
  Users, 
  TrendingUp,
  Heart,
  Gift,
  Star,
  ArrowRight,
  QrCode,
  MessageCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTodayReservations } from '@/hooks/useReservations';
import { useCrmStats, useTodayBirthdays, useCustomers } from '@/hooks/useCrm';
import { Spinner } from '@/components/ui/spinner';

export function AdminDashboard() {
  const navigate = useNavigate();
  
  // Reservas
  const { data: todayReservations, isLoading: isLoadingToday } = useTodayReservations();
  
  // CRM
  const { data: crmStats } = useCrmStats();
  const { data: birthdays } = useTodayBirthdays();
  const { data: recentCustomers } = useCustomers({ limit: 5 });

  const statCards = [
    { 
      title: 'Reservas Hoy', 
      value: todayReservations?.data?.length || 0, 
      icon: CalendarDays,
      color: 'text-[#E31B23]',
      bgColor: 'bg-[#E31B23]/10',
      link: '/admin/reservas'
    },
    { 
      title: 'Total Clientes', 
      value: crmStats?.totalCustomers || 0, 
      icon: Users,
      color: 'text-[#FFD700]',
      bgColor: 'bg-[#FFD700]/10',
      link: '/admin/clientes'
    },
    { 
      title: 'Cumpleañeros Hoy', 
      value: birthdays?.length || 0, 
      icon: Gift,
      color: 'text-pink-500',
      bgColor: 'bg-pink-500/10',
      link: '/admin/clientes'
    },
    { 
      title: 'Nuevos este Mes', 
      value: crmStats?.newThisMonth || 0, 
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      link: '/admin/clientes'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header de Bienvenida */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            ¡Buenas noches!
          </h1>
          <p className="text-white/60 mt-1">
            Aquí está el resumen de tu negocio hoy
          </p>
        </div>
        {birthdays && birthdays.length > 0 && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <Card className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-pink-500/30">
              <CardContent className="flex items-center gap-3 py-3 px-4">
                <div className="w-10 h-10 rounded-full bg-pink-500/30 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <p className="text-pink-400 font-heading">
                    {birthdays.length} cumpleañeros hoy 🎂
                  </p>
                  <p className="text-white/60 text-sm">
                    No olvides enviarles sus regalos
                  </p>
                </div>
                <Button 
                  size="sm" 
                  className="ml-4 bg-pink-500 hover:bg-pink-600"
                  onClick={() => navigate('/admin/clientes')}
                >
                  Ver
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className="bg-[#1a1a1a] border-[#333] hover:border-[#444] transition-all cursor-pointer group overflow-hidden"
                onClick={() => navigate(card.link)}
              >
                <div className={`h-1 ${card.bgColor}`} />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-gray-400 text-sm font-medium uppercase tracking-wide">
                    {card.title}
                  </CardTitle>
                  <div className={`w-10 h-10 rounded-full ${card.bgColor} flex items-center justify-center`}>
                    <Icon className={card.color} size={20} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <p className="text-3xl font-bold text-white">{card.value}</p>
                    <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Reservas de Hoy */}
        <Card className="bg-[#1a1a1a] border-[#333]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white font-semibold text-lg flex items-center gap-2">
              <CalendarDays className="text-[#E31B23]" />
              Reservas de Hoy
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white/60"
              onClick={() => navigate('/admin/reservas')}
            >
              Ver todas
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingToday ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : todayReservations?.data && todayReservations.data.length > 0 ? (
              <div className="space-y-3">
                {todayReservations.data.slice(0, 5).map((reservation, index) => (
                  <motion.div 
                    key={reservation.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-[#333] rounded-lg hover:border-[#333] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#E31B23]/20 rounded-full flex items-center justify-center">
                        <Users className="text-[#E31B23]" size={18} />
                      </div>
                      <div>
                        <p className="text-white font-medium">{reservation.customerName}</p>
                        <p className="text-white/60 text-sm">{reservation.partySize} personas • {reservation.reservationTime}</p>
                      </div>
                    </div>
                    <Badge className={`
                      ${reservation.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-500' : ''}
                      ${reservation.status === 'PENDING' ? 'bg-orange-500/20 text-orange-500' : ''}
                      ${reservation.status === 'CANCELLED' ? 'bg-red-500/20 text-red-500' : ''}
                    `}>
                      {reservation.status}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CalendarDays className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/60">No hay reservas para hoy</p>
                <Button 
                  variant="outline" 
                  className="mt-4 border-[#333]"
                  onClick={() => navigate('/admin/reservas')}
                >
                  Ver todas las reservas
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Clientes Recientes */}
        <Card className="bg-[#1a1a1a] border-[#333]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white font-semibold text-lg flex items-center gap-2">
              <Heart className="text-[#FFD700]" />
              Clientes Recientes
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-white/60"
              onClick={() => navigate('/admin/clientes')}
            >
              Ver todos
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentCustomers?.data && recentCustomers.data.length > 0 ? (
              <div className="space-y-3">
                {recentCustomers.data.map((customer, index) => (
                  <motion.div 
                    key={customer.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4 p-4 bg-[#0a0a0a] border border-[#333] rounded-lg hover:border-[#FFD700]/30 transition-all cursor-pointer"
                    onClick={() => navigate('/admin/clientes')}
                  >
                    <Avatar className="w-10 h-10 bg-[#E31B23]">
                      <AvatarFallback className="text-sm font-heading bg-[#E31B23] text-white">
                        {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-white font-heading">{customer.name}</p>
                      <p className="text-white/60 text-sm flex items-center gap-1">
                        {customer.source === 'QR_SCAN' && <QrCode size={12} />}
                        {customer.source === 'RESERVATION' && <CalendarDays size={12} />}
                        {customer.source === 'MANUAL' && <Users size={12} />}
                        {customer.source === 'QR_SCAN' ? 'Escaneo QR' : 
                         customer.source === 'RESERVATION' ? 'Por reserva' : 'Registro manual'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-[#FFD700] fill-[#FFD700]" />
                        <span className="text-white font-heading">{customer.rating || '-'}</span>
                      </div>
                      <p className="text-xs text-white/50">{customer.totalVisits} visitas</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/60">Aún no hay clientes registrados</p>
                <p className="text-white/40 text-sm mt-1">
                  Los clientes aparecerán aquí cuando se registren
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Métricas de Fidelización */}
      <Card className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-[#333]">
        <CardHeader>
          <CardTitle className="text-white font-semibold text-lg flex items-center gap-2">
            <TrendingUp className="text-green-500" />
            Métricas de Fidelización
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-[#0a0a0a] rounded-lg border border-[#333]">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#FFD700]/10 flex items-center justify-center">
                <Star className="w-6 h-6 text-[#FFD700]" />
              </div>
              <p className="text-2xl font-heading text-white">{crmStats?.avgRating?.toFixed(1) || '0.0'}</p>
              <p className="text-white/60 text-sm">Calificación promedio</p>
            </div>
            <div className="text-center p-4 bg-[#0a0a0a] rounded-lg border border-[#333]">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-500/10 flex items-center justify-center">
                <Heart className="w-6 h-6 text-green-500" />
              </div>
              <p className="text-2xl font-heading text-white">{crmStats?.activeCustomers || 0}</p>
              <p className="text-white/60 text-sm">Clientes activos</p>
            </div>
            <div className="text-center p-4 bg-[#0a0a0a] rounded-lg border border-[#333]">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-purple-500/10 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-purple-500" />
              </div>
              <p className="text-2xl font-heading text-white">
                {crmStats?.topSources?.[0]?.source === 'QR_SCAN' ? 'QR' : 
                 crmStats?.topSources?.[0]?.source === 'RESERVATION' ? 'Reservas' : 'Manual'}
              </p>
              <p className="text-white/60 text-sm">Principal fuente</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
