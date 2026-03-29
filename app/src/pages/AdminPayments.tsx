import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  ArrowLeft,
  Phone,
  Calendar,
  Ticket,
  DollarSign,
  Image,
  ShieldCheck,
  Ban,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { usePayments, usePaymentDetail, useConfirmPayment, useRejectPayment } from '@/hooks/usePayments';
import type { PaymentVerification } from '@/services/payment.service';

// ─── Status Badge ───────────────────────────────────────────
function PaymentStatusBadge({ status }: { status: PaymentVerification['status'] }) {
  const configs = {
    PENDING: { icon: Clock, label: 'Pendiente', color: 'bg-amber-500/20 text-amber-400' },
    CONFIRMED: { icon: CheckCircle, label: 'Confirmado', color: 'bg-green-500/20 text-green-400' },
    REJECTED: { icon: XCircle, label: 'Rechazado', color: 'bg-red-500/20 text-red-400' },
    EXPIRED: { icon: AlertTriangle, label: 'Expirado', color: 'bg-gray-500/20 text-gray-400' },
  };
  const config = configs[status] || configs.PENDING;
  const Icon = config.icon;
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon size={12} />
      {config.label}
    </div>
  );
}

// ─── Format Currency ────────────────────────────────────────
function formatCOP(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return '—';
  return `$${amount.toLocaleString('es-CO')}`;
}

// ─── Payment Detail ─────────────────────────────────────────
function PaymentDetail({
  paymentId,
  onBack,
}: {
  paymentId: string;
  onBack: () => void;
}) {
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const { data: payment, isLoading } = usePaymentDetail(paymentId);
  const confirmMutation = useConfirmPayment();
  const rejectMutation = useRejectPayment();

  const handleConfirm = () => {
    confirmMutation.mutate(
      { id: paymentId, notes: notes.trim() || undefined },
      { onSuccess: onBack },
    );
  };

  const handleReject = () => {
    rejectMutation.mutate(
      { id: paymentId, reason: reason.trim() || undefined },
      { onSuccess: onBack },
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="w-12 h-12" />
      </div>
    );
  }

  if (!payment) {
    return <p className="text-white/50 text-center py-8">Pago no encontrado</p>;
  }

  const visionData = payment.visionAnalysis;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-white">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h2 className="text-white font-heading text-lg">Pago {payment.reference}</h2>
            <div className="flex items-center gap-2 text-white/50 text-sm">
              <Phone size={12} />
              {payment.customer.name} — {payment.customer.phone}
            </div>
          </div>
        </div>
        <PaymentStatusBadge status={payment.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Info */}
        <Card className="bg-[#1a1a1a] border-[#333]">
          <CardHeader>
            <CardTitle className="text-white font-semibold text-base flex items-center gap-2">
              <CreditCard className="text-[#E31B23]" size={18} />
              Información del Pago
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-white/50 text-xs mb-1">Referencia</p>
                <p className="text-white font-mono font-bold">{payment.reference}</p>
              </div>
              <div>
                <p className="text-white/50 text-xs mb-1">Estado</p>
                <PaymentStatusBadge status={payment.status} />
              </div>
              <div>
                <p className="text-white/50 text-xs mb-1">Evento</p>
                <p className="text-white text-sm">{payment.event.name}</p>
              </div>
              <div>
                <p className="text-white/50 text-xs mb-1">Fecha Evento</p>
                <p className="text-white text-sm flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(payment.event.eventDate).toLocaleDateString('es-CO', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <p className="text-white/50 text-xs mb-1">Boletas</p>
                <p className="text-white text-sm flex items-center gap-1">
                  <Ticket size={12} />
                  {payment.quantity} ({payment.ticketType})
                </p>
              </div>
              <div>
                <p className="text-white/50 text-xs mb-1">Monto Esperado</p>
                <p className="text-white font-bold text-lg">{formatCOP(payment.expectedAmount)}</p>
              </div>
            </div>

            <div className="border-t border-[#333] pt-4">
              <p className="text-white/50 text-xs mb-1">Creado</p>
              <p className="text-white/70 text-sm">
                {new Date(payment.createdAt).toLocaleString('es-CO')}
              </p>
            </div>

            {payment.expiresAt && (
              <div>
                <p className="text-white/50 text-xs mb-1">Expira</p>
                <p className="text-white/70 text-sm">
                  {new Date(payment.expiresAt).toLocaleString('es-CO')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vision Analysis + Receipt */}
        <Card className="bg-[#1a1a1a] border-[#333]">
          <CardHeader>
            <CardTitle className="text-white font-semibold text-base flex items-center gap-2">
              <Eye className="text-purple-400" size={18} />
              Análisis GPT Vision
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {visionData ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/50 text-xs mb-1">¿Es comprobante?</p>
                  <p className={`text-sm font-medium ${visionData.isPaymentReceipt ? 'text-green-400' : 'text-red-400'}`}>
                    {visionData.isPaymentReceipt ? '✅ Sí' : '❌ No'}
                  </p>
                </div>
                <div>
                  <p className="text-white/50 text-xs mb-1">Confianza</p>
                  <p className="text-white text-sm">
                    {visionData.confidence ? `${(visionData.confidence * 100).toFixed(0)}%` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-white/50 text-xs mb-1">Monto Detectado</p>
                  <p className={`font-bold text-lg ${
                    payment.detectedAmount && payment.detectedAmount >= payment.expectedAmount
                      ? 'text-green-400'
                      : payment.detectedAmount
                      ? 'text-amber-400'
                      : 'text-white/50'
                  }`}>
                    {formatCOP(payment.detectedAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-white/50 text-xs mb-1">Banco</p>
                  <p className="text-white text-sm">{visionData.bank ?? '—'}</p>
                </div>
                {visionData.date && (
                  <div>
                    <p className="text-white/50 text-xs mb-1">Fecha Comprobante</p>
                    <p className="text-white text-sm">{visionData.date}</p>
                  </div>
                )}
                {visionData.reference && (
                  <div>
                    <p className="text-white/50 text-xs mb-1">Ref. en Comprobante</p>
                    <p className="text-white text-sm font-mono">{visionData.reference}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <Image className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-white/50 text-sm">Sin comprobante recibido</p>
              </div>
            )}

            {/* Receipt Image */}
            {payment.receiptUrl && (
              <div className="border-t border-[#333] pt-4">
                <p className="text-white/50 text-xs mb-2">Comprobante</p>
                <a
                  href={payment.receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="relative group rounded-lg overflow-hidden border border-[#333] hover:border-[#E31B23]/50 transition-all">
                    <img
                      src={payment.receiptUrl}
                      alt="Comprobante de pago"
                      className="w-full max-h-[300px] object-contain bg-black"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <ExternalLink className="text-white" size={24} />
                    </div>
                  </div>
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Admin Actions */}
      {payment.status === 'PENDING' && (
        <Card className="bg-[#1a1a1a] border-[#333]">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Confirm */}
              <div className="space-y-3">
                <h3 className="text-green-400 font-medium flex items-center gap-2">
                  <ShieldCheck size={16} />
                  Confirmar Pago
                </h3>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notas (opcional)..."
                  className="bg-[#0a0a0a] border-[#333] text-white placeholder:text-white/30"
                />
                <Button
                  onClick={handleConfirm}
                  disabled={confirmMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle size={16} className="mr-2" />
                  {confirmMutation.isPending ? 'Confirmando...' : 'Confirmar Pago'}
                </Button>
              </div>

              {/* Reject */}
              <div className="space-y-3">
                <h3 className="text-red-400 font-medium flex items-center gap-2">
                  <Ban size={16} />
                  Rechazar Pago
                </h3>
                <Input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Motivo del rechazo (opcional)..."
                  className="bg-[#0a0a0a] border-[#333] text-white placeholder:text-white/30"
                />
                <Button
                  onClick={handleReject}
                  disabled={rejectMutation.isPending}
                  variant="outline"
                  className="w-full border-red-500/50 text-red-400 hover:bg-red-500/20"
                >
                  <XCircle size={16} className="mr-2" />
                  {rejectMutation.isPending ? 'Rechazando...' : 'Rechazar Pago'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admin Notes (if already processed) */}
      {payment.adminNotes && (
        <Card className="bg-[#1a1a1a] border-[#333]">
          <CardContent className="p-4">
            <p className="text-white/50 text-xs mb-1">Notas del admin</p>
            <p className="text-white text-sm">{payment.adminNotes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────
export function AdminPayments() {
  const [statusFilter, setStatusFilter] = useState<PaymentVerification['status'] | undefined>(undefined);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);

  const { data: paymentsData, isLoading } = usePayments({
    status: statusFilter,
    limit: 50,
  });

  // Stats from data
  const payments = paymentsData?.data ?? [];
  const pendingCount = payments.filter(p => p.status === 'PENDING').length;

  if (selectedPayment) {
    return (
      <div className="space-y-6">
        <PaymentDetail
          paymentId={selectedPayment}
          onBack={() => setSelectedPayment(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <CreditCard className="text-[#E31B23]" />
          Pagos
        </h1>
        <p className="text-white/60 mt-1">
          Verificación de comprobantes de pago
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-[#333]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total</p>
                <p className="text-2xl font-heading text-white">{paymentsData?.pagination?.total || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#E31B23]/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-[#E31B23]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-[#333]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Pendientes</p>
                <p className="text-2xl font-heading text-amber-400">{pendingCount}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-[#333]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Confirmados</p>
                <p className="text-2xl font-heading text-green-400">
                  {payments.filter(p => p.status === 'CONFIRMED').length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-[#333]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Rechazados</p>
                <p className="text-2xl font-heading text-red-400">
                  {payments.filter(p => p.status === 'REJECTED').length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { value: undefined, label: 'Todos' },
          { value: 'PENDING' as const, label: 'Pendientes' },
          { value: 'CONFIRMED' as const, label: 'Confirmados' },
          { value: 'REJECTED' as const, label: 'Rechazados' },
          { value: 'EXPIRED' as const, label: 'Expirados' },
        ].map((tab) => (
          <Button
            key={tab.label}
            variant={statusFilter === tab.value ? 'default' : 'outline'}
            size="sm"
            className={
              statusFilter === tab.value
                ? 'bg-[#E31B23] text-white'
                : 'border-[#333] text-white/60 hover:text-white hover:bg-[#1a1a1a]'
            }
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Payments List */}
      <Card className="bg-[#1a1a1a] border-[#333]">
        <CardHeader>
          <CardTitle className="text-white font-semibold text-lg flex items-center gap-2">
            <DollarSign className="text-[#E31B23]" />
            Pagos Registrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner className="w-12 h-12" />
            </div>
          ) : payments.length > 0 ? (
            <div className="space-y-2">
              <AnimatePresence>
                {payments.map((payment, index) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`group flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                      payment.status === 'PENDING'
                        ? 'bg-amber-500/5 border-amber-500/30 hover:border-amber-500/60'
                        : payment.status === 'CONFIRMED'
                        ? 'bg-green-500/5 border-green-500/20 hover:border-green-500/50'
                        : 'bg-[#0a0a0a] border-[#333] hover:border-[#E31B23]/50'
                    }`}
                    onClick={() => setSelectedPayment(payment.id)}
                  >
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      payment.status === 'PENDING' ? 'bg-amber-500/20' :
                      payment.status === 'CONFIRMED' ? 'bg-green-500/20' :
                      payment.status === 'REJECTED' ? 'bg-red-500/20' :
                      'bg-gray-500/20'
                    }`}>
                      <CreditCard size={18} className={
                        payment.status === 'PENDING' ? 'text-amber-400' :
                        payment.status === 'CONFIRMED' ? 'text-green-400' :
                        payment.status === 'REJECTED' ? 'text-red-400' :
                        'text-gray-400'
                      } />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-white font-mono font-bold text-sm">{payment.reference}</h3>
                        <PaymentStatusBadge status={payment.status} />
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-white/50 text-sm">
                        <span className="truncate">{payment.customer.name}</span>
                        <span>•</span>
                        <span className="truncate">{payment.event.name}</span>
                      </div>
                    </div>

                    {/* Amount + Meta */}
                    <div className="text-right hidden sm:block shrink-0">
                      <div className="text-white font-bold">{formatCOP(payment.expectedAmount)}</div>
                      <div className="text-white/30 text-xs flex items-center gap-1 justify-end mt-1">
                        <Ticket size={10} />
                        {payment.quantity} boleta{payment.quantity > 1 ? 's' : ''}
                      </div>
                      <div className="text-white/30 text-xs mt-0.5">
                        {new Date(payment.createdAt).toLocaleDateString('es-CO', {
                          day: '2-digit', month: 'short',
                        })}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60">No hay pagos registrados</p>
              <p className="text-white/40 text-sm mt-1">
                Los pagos aparecerán cuando los clientes compren boletas por WhatsApp
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
