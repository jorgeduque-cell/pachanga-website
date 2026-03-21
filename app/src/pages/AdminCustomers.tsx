import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Search,
  Filter,
  Users,
  Star,
  Gift,
  MessageCircle,
  Phone,
  Calendar,
  TrendingUp,
  QrCode,
  UserPlus,
  Heart,
  Eye,
  Mail,
  BarChart3,
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  Inbox
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { useCustomers, useCustomer, useCrmStats, useTodayBirthdays, useSendMessage, useUpdateCustomer } from '@/hooks/useCrm';
import { useNewCustomers, useRatingDistribution, useMessagesByStatus } from '@/hooks/useAnalytics';
import { useMessages } from '@/hooks/useMessages';
import type { Customer, CustomerInteraction } from '@/services/crm.service';

// Colores para gráficos
const CHART_COLORS = {
  primary: '#E31B23',
  gold: '#FFD700',
  green: '#22c55e',
  blue: '#3b82f6',
  purple: '#a855f7',
  orange: '#f97316',
  gray: '#6b7280',
};

const PIE_COLORS = [CHART_COLORS.gold, CHART_COLORS.primary, CHART_COLORS.green, CHART_COLORS.blue, CHART_COLORS.purple];

// Componente de estado de cliente
function CustomerStatus({ customer }: { customer: Customer }) {
  if (!customer.isActive) {
    return <Badge variant="destructive">Inactivo</Badge>;
  }
  if (customer.optIn) {
    return <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30">Activo</Badge>;
  }
  return <Badge variant="secondary">Sin opt-in</Badge>;
}

// Componente de fuente
function SourceBadge({ source }: { source: Customer['source'] }) {
  const configs = {
    QR_SCAN: { icon: QrCode, label: 'QR', color: 'bg-purple-500/20 text-purple-500' },
    RESERVATION: { icon: Calendar, label: 'Reserva', color: 'bg-blue-500/20 text-blue-500' },
    MANUAL: { icon: UserPlus, label: 'Manual', color: 'bg-gray-500/20 text-gray-500' },
  };
  const config = configs[source];
  const Icon = config.icon;
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon size={12} />
      {config.label}
    </div>
  );
}

// Componente de estado de mensaje
function MessageStatusBadge({ status }: { status: string }) {
  const configs: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    SENT: { icon: Send, color: 'bg-blue-500/20 text-blue-500', label: 'Enviado' },
    DELIVERED: { icon: CheckCircle, color: 'bg-green-500/20 text-green-500', label: 'Entregado' },
    READ: { icon: Eye, color: 'bg-purple-500/20 text-purple-500', label: 'Leído' },
    FAILED: { icon: AlertCircle, color: 'bg-red-500/20 text-red-500', label: 'Fallido' },
    PENDING: { icon: Clock, color: 'bg-orange-500/20 text-orange-500', label: 'Pendiente' },
  };
  const config = configs[status] || configs.PENDING;
  const Icon = config.icon;
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${config.color}`}>
      <Icon size={12} />
      {config.label}
    </div>
  );
}

// Modal de detalle de cliente
function CustomerDetailModal({ 
  customerId, 
  isOpen, 
  onClose 
}: { 
  customerId: string | null; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const { data: customer, isLoading } = useCustomer(customerId || '');
  const sendMessage = useSendMessage();
  const updateCustomer = useUpdateCustomer();

  const handleSendBirthday = () => {
    if (customer) {
      sendMessage.mutate({
        customerId: customer.id,
        templateName: 'cumpleanos_pachanga',
      });
    }
  };

  const handleSendWelcome = () => {
    if (customer) {
      sendMessage.mutate({
        customerId: customer.id,
        templateName: 'bienvenida_pachanga',
      });
    }
  };

  const handleToggleActive = () => {
    if (customer) {
      updateCustomer.mutate({
        id: customer.id,
        data: { isActive: !customer.isActive },
      });
    }
  };

  if (!customerId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-[#1a1a1a] border-[#333] text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Ficha del Cliente</DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : customer ? (
          <div className="space-y-6">
            {/* Header del cliente */}
            <div className="flex items-start gap-4">
              <Avatar className="w-16 h-16 bg-[#E31B23]">
                <AvatarFallback className="text-2xl font-heading bg-[#E31B23] text-white">
                  {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white">{customer.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Phone size={14} className="text-white/50" />
                  <span className="text-white/70">{customer.phone}</span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <SourceBadge source={customer.source} />
                  <CustomerStatus customer={customer} />
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-heading text-[#FFD700]">{customer.totalVisits}</div>
                <div className="text-xs text-white/50">visitas</div>
              </div>
            </div>

            {/* Stats rápidas */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-[#0a0a0a] border-[#333]">
                <CardContent className="p-4 text-center">
                  <Star className="w-5 h-5 text-[#FFD700] mx-auto mb-1" />
                  <div className="text-xl font-heading text-white">{customer.rating || '-'}</div>
                  <div className="text-xs text-white/50">Calificación</div>
                </CardContent>
              </Card>
              <Card className="bg-[#0a0a0a] border-[#333]">
                <CardContent className="p-4 text-center">
                  <Calendar className="w-5 h-5 text-[#E31B23] mx-auto mb-1" />
                  <div className="text-sm font-heading text-white">
                    {customer.birthDate ? new Date(customer.birthDate).toLocaleDateString('es-CO') : '-'}
                  </div>
                  <div className="text-xs text-white/50">Cumpleaños</div>
                </CardContent>
              </Card>
              <Card className="bg-[#0a0a0a] border-[#333]">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <div className="text-sm font-heading text-white">
                    {customer.lastVisitAt ? new Date(customer.lastVisitAt).toLocaleDateString('es-CO') : 'Nunca'}
                  </div>
                  <div className="text-xs text-white/50">Última visita</div>
                </CardContent>
              </Card>
            </div>

            {/* Acciones */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 border-[#333] hover:bg-[#E31B23]/20"
                onClick={handleSendWelcome}
                disabled={sendMessage.isPending}
              >
                <Mail className="w-4 h-4 mr-2" />
                Enviar Bienvenida
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 border-[#333] hover:bg-[#FFD700]/20"
                onClick={handleSendBirthday}
                disabled={sendMessage.isPending}
              >
                <Gift className="w-4 h-4 mr-2" />
                Enviar Cumpleaños
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 border-[#333] hover:bg-red-500/20"
                onClick={handleToggleActive}
                disabled={updateCustomer.isPending}
              >
                {customer.isActive ? 'Desactivar' : 'Activar'}
              </Button>
            </div>

            {/* Historial de interacciones */}
            <div>
              <h4 className="text-sm font-heading text-white/70 mb-3 uppercase tracking-wider">
                Historial de Interacciones
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {customer.interactions?.length > 0 ? (
                  customer.interactions.map((interaction: CustomerInteraction) => (
                    <div 
                      key={interaction.id} 
                      className="flex items-center gap-3 p-3 bg-[#0a0a0a] rounded-lg border border-[#333]"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#E31B23]/20 flex items-center justify-center">
                        <MessageCircle size={14} className="text-[#E31B23]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white capitalize">{interaction.type.replace('_', ' ')}</p>
                        {interaction.metadata && (
                          <p className="text-xs text-white/50">
                            {JSON.stringify(interaction.metadata).slice(0, 50)}...
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-white/40">
                        {new Date(interaction.createdAt).toLocaleDateString('es-CO')}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-white/50 text-center py-4">Sin interacciones registradas</p>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// Gráfico de barras: Clientes por mes
function NewCustomersChart() {
  const { data, isLoading } = useNewCustomers(6);

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const chartData = data?.map(item => ({
    month: new Date(item.month + '-01').toLocaleDateString('es-CO', { month: 'short' }),
    count: item.count,
  })) || [];

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="month" stroke="#666" fontSize={12} />
        <YAxis stroke="#666" fontSize={12} />
        <Tooltip 
          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
          labelStyle={{ color: '#fff' }}
          itemStyle={{ color: '#FFD700' }}
        />
        <Bar dataKey="count" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Gráfico pie: Distribución de ratings
function RatingDistributionChart() {
  const { data, isLoading } = useRatingDistribution();

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const chartData = data?.map(item => ({
    name: `${item.rating} estrellas`,
    value: item.count,
  })) || [];

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
          itemStyle={{ color: '#fff' }}
        />
        <Legend wrapperStyle={{ color: '#fff' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Gráfico pie: Mensajes por estado
function MessagesByStatusChart() {
  const { data, isLoading } = useMessagesByStatus();

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const chartData = data?.map(item => ({
    name: item.status,
    value: item.count,
  })) || [];

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
          itemStyle={{ color: '#fff' }}
        />
        <Legend wrapperStyle={{ color: '#fff' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Log de mensajes WhatsApp
function MessagesLog() {
  const [typeFilter, setTypeFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  
  const filters = {
    ...(typeFilter !== 'todos' && { type: typeFilter as 'WELCOME' | 'BIRTHDAY' | 'MANUAL' }),
    ...(statusFilter !== 'todos' && { status: statusFilter as 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' }),
    limit: 20,
  };
  
  const { data: messagesData, isLoading } = useMessages(filters);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-[#0a0a0a] border-[#333] text-white">
            <Filter className="mr-2" size={16} />
            <SelectValue placeholder="Tipo de mensaje" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-[#333]">
            <SelectItem value="todos" className="text-white">Todos los tipos</SelectItem>
            <SelectItem value="WELCOME" className="text-white">Bienvenida</SelectItem>
            <SelectItem value="BIRTHDAY" className="text-white">Cumpleaños</SelectItem>
            <SelectItem value="MANUAL" className="text-white">Manual</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px] bg-[#0a0a0a] border-[#333] text-white">
            <CheckCircle className="mr-2" size={16} />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-[#333]">
            <SelectItem value="todos" className="text-white">Todos los estados</SelectItem>
            <SelectItem value="SENT" className="text-white">Enviado</SelectItem>
            <SelectItem value="DELIVERED" className="text-white">Entregado</SelectItem>
            <SelectItem value="READ" className="text-white">Leído</SelectItem>
            <SelectItem value="FAILED" className="text-white">Fallido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : messagesData?.data && messagesData.data.length > 0 ? (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          <AnimatePresence>
            {messagesData.data.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 bg-[#0a0a0a] rounded-lg border border-[#333]"
              >
                <div className="w-10 h-10 rounded-full bg-[#E31B23]/20 flex items-center justify-center flex-shrink-0">
                  <Inbox size={16} className="text-[#E31B23]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{message.customer.name}</p>
                  <p className="text-xs text-white/50">{message.customer.phone}</p>
                </div>
                <div className="text-right">
                  <MessageStatusBadge status={message.status} />
                  <p className="text-xs text-white/40 mt-1">
                    {new Date(message.createdAt).toLocaleDateString('es-CO')}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="text-center py-8">
          <Inbox className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/60">No hay mensajes</p>
        </div>
      )}
    </div>
  );
}

// Página principal
export function AdminCustomers() {
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<Customer['source'] | 'todos'>('todos');
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { data: customersData, isLoading } = useCustomers({
    search: search || undefined,
    source: sourceFilter !== 'todos' ? sourceFilter : undefined,
    limit: 50,
  });
  const { data: stats } = useCrmStats();
  const { data: birthdays } = useTodayBirthdays();

  const handleViewDetail = (customerId: string) => {
    setSelectedCustomer(customerId);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Users className="text-[#E31B23]" />
            Clientes
          </h1>
          <p className="text-white/60 mt-1">
            Gestiona tu base de clientes y su fidelización
          </p>
        </div>
        <div className="flex items-center gap-3">
          {birthdays && birthdays.length > 0 && (
            <Card className="bg-[#FFD700]/10 border-[#FFD700]/30">
              <CardContent className="flex items-center gap-2 py-2 px-4">
                <Gift className="w-4 h-4 text-[#FFD700]" />
                <span className="text-sm text-[#FFD700]">
                  {birthdays.length} cumpleañeros hoy
                </span>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-[#333]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Clientes</p>
                <p className="text-2xl font-heading text-white">{stats?.totalCustomers || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#E31B23]/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-[#E31B23]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-[#333]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Nuevos este mes</p>
                <p className="text-2xl font-heading text-[#FFD700]">{stats?.newThisMonth || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[#FFD700]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-[#333]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Activos</p>
                <p className="text-2xl font-heading text-green-500">{stats?.activeCustomers || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Heart className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-[#333]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Calificación Prom.</p>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-heading text-white">{stats?.avgRating?.toFixed(1) || '0.0'}</p>
                  <Star className="w-4 h-4 text-[#FFD700] fill-[#FFD700]" />
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Star className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts y Mensajes */}
      <Tabs defaultValue="customers" className="w-full">
        <TabsList className="bg-[#1a1a1a] border-[#333] mb-4">
          <TabsTrigger value="customers" className="data-[state=active]:bg-[#E31B23] data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-2" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="charts" className="data-[state=active]:bg-[#E31B23] data-[state=active]:text-white">
            <BarChart3 className="w-4 h-4 mr-2" />
            Gráficos
          </TabsTrigger>
          <TabsTrigger value="messages" className="data-[state=active]:bg-[#E31B23] data-[state=active]:text-white">
            <MessageCircle className="w-4 h-4 mr-2" />
            Log de Mensajes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-4">
          {/* Filters */}
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
                  <Input
                    placeholder="Buscar por nombre o teléfono..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 bg-[#0a0a0a] border-[#333] text-white placeholder:text-white/40"
                  />
                </div>
                <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as Customer['source'] | 'todos')}>
                  <SelectTrigger className="w-full sm:w-[200px] bg-[#0a0a0a] border-[#333] text-white">
                    <Filter className="mr-2" size={16} />
                    <SelectValue placeholder="Todas las fuentes" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#333]">
                    <SelectItem value="todos" className="text-white">Todas las fuentes</SelectItem>
                    <SelectItem value="QR_SCAN" className="text-white">Escaneo QR</SelectItem>
                    <SelectItem value="RESERVATION" className="text-white">Reservas</SelectItem>
                    <SelectItem value="MANUAL" className="text-white">Registro manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Customers List */}
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardHeader>
              <CardTitle className="text-white font-semibold text-lg flex items-center gap-2">
                <Users className="text-[#E31B23]" />
                Lista de Clientes
                {customersData?.pagination?.total !== undefined && (
                  <span className="text-sm text-white/50 normal-case">
                    ({customersData.pagination.total} total)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Spinner className="w-12 h-12" />
                </div>
              ) : customersData?.data && customersData.data.length > 0 ? (
                <div className="space-y-3">
                  <AnimatePresence>
                    {customersData.data.map((customer, index) => (
                      <motion.div
                        key={customer.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group flex items-center gap-4 p-4 bg-[#0a0a0a] border border-[#333] rounded-lg hover:border-[#E31B23]/50 transition-all cursor-pointer"
                        onClick={() => handleViewDetail(customer.id)}
                      >
                        {/* Avatar */}
                        <Avatar className="w-12 h-12 bg-[#E31B23]">
                          <AvatarFallback className="font-heading bg-[#E31B23] text-white">
                            {customer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-heading truncate">{customer.name}</h3>
                            {customer.totalVisits > 5 && (
                              <Star className="w-4 h-4 text-[#FFD700] fill-[#FFD700]" />
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-white/50 text-sm flex items-center gap-1">
                              <Phone size={12} />
                              {customer.phone}
                            </span>
                            <SourceBadge source={customer.source} />
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="hidden sm:flex items-center gap-6 text-center">
                          <div>
                            <div className="text-lg font-bold text-white">{customer.totalVisits}</div>
                            <div className="text-xs text-white/50">visitas</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-[#FFD700]">{customer.rating || '-'}</div>
                            <div className="text-xs text-white/50">rating</div>
                          </div>
                        </div>

                        {/* Status & Actions */}
                        <div className="flex items-center gap-2">
                          <CustomerStatus customer={customer} />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetail(customer.id);
                            }}
                          >
                            <Eye className="w-4 h-4 text-white/60" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/60">No se encontraron clientes</p>
                  <p className="text-white/40 text-sm mt-1">
                    Intenta con otros filtros o espera a que los clientes se registren
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Gráfico de barras: Clientes por mes */}
            <Card className="bg-[#1a1a1a] border-[#333] lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white font-semibold text-lg flex items-center gap-2">
                  <BarChart3 className="text-[#E31B23]" />
                  Nuevos Clientes por Mes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <NewCustomersChart />
              </CardContent>
            </Card>

            {/* Gráfico pie: Distribución de ratings */}
            <Card className="bg-[#1a1a1a] border-[#333]">
              <CardHeader>
                <CardTitle className="text-white font-semibold text-lg flex items-center gap-2">
                  <Star className="text-[#FFD700]" />
                  Distribución de Ratings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RatingDistributionChart />
              </CardContent>
            </Card>
          </div>

          {/* Gráfico pie: Mensajes por estado */}
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardHeader>
              <CardTitle className="text-white font-semibold text-lg flex items-center gap-2">
                <MessageCircle className="text-green-500" />
                Mensajes WhatsApp por Estado
              </CardTitle>
            </CardHeader>
            <CardContent className="max-w-md mx-auto">
              <MessagesByStatusChart />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages">
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardHeader>
              <CardTitle className="text-white font-semibold text-lg flex items-center gap-2">
                <MessageCircle className="text-[#E31B23]" />
                Log de Mensajes WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MessagesLog />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de detalle */}
      <CustomerDetailModal 
        customerId={selectedCustomer} 
        isOpen={isDetailOpen} 
        onClose={() => setIsDetailOpen(false)} 
      />
    </div>
  );
}
