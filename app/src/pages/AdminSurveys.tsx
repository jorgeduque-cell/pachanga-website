import { useState, useEffect, useCallback } from 'react';
import { Music, Smile, Sparkles, ShieldCheck, Star, RefreshCw, BarChart3, Send, Loader2, MessageSquare, User, Phone, Calendar, Table2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { surveyAdminService, type SurveyItem, type SurveyStatsResponse } from '@/services/survey-admin.service';

// ─── Stat Card Component ─────────────────────────────────────
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <Card className="bg-[#1a1a1a] border-[#333]">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-xs uppercase font-heading">{label}</p>
            <p className="text-2xl font-heading text-white mt-1">{value.toFixed(1)}</p>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
            {icon}
          </div>
        </div>
        {/* Rating bar */}
        <div className="mt-3 h-1.5 rounded-full bg-[#333]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${color.replace('/20', '')}`}
            style={{ width: `${(value / 5) * 100}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Star Rating Display ─────────────────────────────────────
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={i <= rating ? 'text-[#FFD700] fill-[#FFD700]' : 'text-[#333]'}
        />
      ))}
    </div>
  );
}

// ─── Rating Bar for Detail Modal ─────────────────────────────
function RatingBar({ label, rating, icon, color }: { label: string; rating: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-white/70 text-sm">{label}</span>
          <span className="text-white font-heading text-sm">{rating}/5</span>
        </div>
        <div className="h-2 rounded-full bg-[#333]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${color.replace('/20', '')}`}
            style={{ width: `${(rating / 5) * 100}%` }}
          />
        </div>
      </div>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} size={12} className={i <= rating ? 'text-[#FFD700] fill-[#FFD700]' : 'text-[#333]'} />
        ))}
      </div>
    </div>
  );
}

// ─── Survey Detail Dialog ────────────────────────────────────
function SurveyDetailDialog({ survey, open, onOpenChange }: { survey: SurveyItem | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  if (!survey) return null;

  const avgRating = ((survey.musicRating + survey.serviceRating + survey.ambienceRating + survey.hygieneRating) / 4).toFixed(1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a1a] border-[#333] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white font-heading uppercase tracking-wider">
            Detalle de Encuesta
          </DialogTitle>
        </DialogHeader>

        {/* Customer info */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-[#0a0a0a] border border-[#333]">
          <div className="w-12 h-12 rounded-full bg-[#E31B23]/20 flex items-center justify-center">
            <User size={24} className="text-[#E31B23]" />
          </div>
          <div className="flex-1">
            <p className="text-white font-heading text-lg">{survey.customer.name}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-white/50 text-sm">
                <Phone size={12} /> {survey.customer.phone}
              </span>
              {survey.qrTable && (
                <span className="flex items-center gap-1 text-[#FFD700] text-sm">
                  <Table2 size={12} /> Mesa {survey.qrTable}
                </span>
              )}
            </div>
          </div>
          <div className="text-center">
            <p className="text-3xl font-heading text-[#FFD700]">{avgRating}</p>
            <p className="text-white/40 text-xs">Promedio</p>
          </div>
        </div>

        {/* Ratings */}
        <div className="space-y-3">
          <RatingBar label="Música" rating={survey.musicRating} icon={<Music size={16} className="text-purple-400" />} color="bg-purple-500/20" />
          <RatingBar label="Servicio" rating={survey.serviceRating} icon={<Smile size={16} className="text-blue-400" />} color="bg-blue-500/20" />
          <RatingBar label="Ambiente" rating={survey.ambienceRating} icon={<Sparkles size={16} className="text-amber-400" />} color="bg-amber-500/20" />
          <RatingBar label="Higiene" rating={survey.hygieneRating} icon={<ShieldCheck size={16} className="text-green-400" />} color="bg-green-500/20" />
        </div>

        {/* Comment */}
        {survey.comments && (
          <div className="p-4 rounded-lg bg-[#0a0a0a] border border-[#333]">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={16} className="text-[#FFD700]" />
              <span className="text-white/60 text-sm font-heading uppercase">Comentario</span>
            </div>
            <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">
              {survey.comments}
            </p>
          </div>
        )}

        {/* Date */}
        <div className="flex items-center gap-2 text-white/40 text-sm">
          <Calendar size={14} />
          {new Date(survey.createdAt).toLocaleDateString('es-CO', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ──────────────────────────────────────────
export function AdminSurveys() {
  const [stats, setStats] = useState<SurveyStatsResponse['data'] | null>(null);
  const [surveys, setSurveys] = useState<SurveyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyItem | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, surveysRes] = await Promise.all([
        surveyAdminService.getStats(),
        surveyAdminService.getSurveys(page, 15),
      ]);
      setStats(statsRes.data);
      setSurveys(surveysRes.data);
      setTotalPages(surveysRes.pagination?.totalPages ?? 1);
    } catch {
      toast.error('Error al cargar datos de encuestas');
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    await fetchData();
    toast.success('Datos actualizados');
  };

  const handleTriggerSend = async () => {
    setIsSending(true);
    try {
      const result = await surveyAdminService.triggerSend();
      if (result.data.found === 0) {
        toast.info('No hay clientes elegibles para encuesta hoy');
      } else {
        toast.success(result.message);
      }
      await fetchData();
    } catch {
      toast.error('Error al enviar encuestas');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading text-white uppercase tracking-wider">
            Encuestas
          </h1>
          <p className="text-white/60 mt-1">
            Analítica de satisfacción del cliente
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleTriggerSend}
            disabled={isSending}
            className="bg-[#E31B23] hover:bg-[#E31B23]/80 text-white"
          >
            {isSending ? (
              <Loader2 className="mr-2 animate-spin" size={18} />
            ) : (
              <Send className="mr-2" size={18} />
            )}
            {isSending ? 'Enviando...' : 'Enviar Encuestas'}
          </Button>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
            className="border-[#333] bg-[#1a1a1a] text-white hover:bg-[#333]"
          >
            <RefreshCw className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} size={18} />
            Recargar
          </Button>
        </div>
      </div>

      {isLoading && !stats ? (
        <div className="flex justify-center py-20">
          <Spinner className="w-12 h-12" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          {stats && (
            <>
              {/* Overview Card */}
              <Card className="bg-gradient-to-r from-[#1a1a1a] to-[#222] border-[#333]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/60 text-sm uppercase font-heading">Promedio General</p>
                      <p className="text-5xl font-heading text-[#FFD700] mt-2">
                        {stats.overallAverage.toFixed(1)}
                      </p>
                      <p className="text-white/40 text-sm mt-1">
                        de {stats.totalSurveys} encuesta{stats.totalSurveys !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="w-16 h-16 rounded-full bg-[#FFD700]/10 flex items-center justify-center">
                      <BarChart3 size={32} className="text-[#FFD700]" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Category Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  label="Música"
                  value={stats.averages.music}
                  icon={<Music size={20} className="text-purple-400" />}
                  color="bg-purple-500/20"
                />
                <StatCard
                  label="Servicio"
                  value={stats.averages.service}
                  icon={<Smile size={20} className="text-blue-400" />}
                  color="bg-blue-500/20"
                />
                <StatCard
                  label="Ambiente"
                  value={stats.averages.ambience}
                  icon={<Sparkles size={20} className="text-amber-400" />}
                  color="bg-amber-500/20"
                />
                <StatCard
                  label="Higiene"
                  value={stats.averages.hygiene}
                  icon={<ShieldCheck size={20} className="text-green-400" />}
                  color="bg-green-500/20"
                />
              </div>
            </>
          )}

          {/* Surveys Table */}
          <Card className="bg-[#1a1a1a] border-[#333]">
            <CardHeader>
              <CardTitle className="text-white font-heading uppercase">
                Historial de Encuestas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {surveys.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#333]">
                          <th className="text-left py-3 px-4 text-white/60 font-heading uppercase text-sm">Cliente</th>
                          <th className="text-left py-3 px-4 text-white/60 font-heading uppercase text-sm">Mesa</th>
                          <th className="text-center py-3 px-4 text-white/60 font-heading uppercase text-sm">Música</th>
                          <th className="text-center py-3 px-4 text-white/60 font-heading uppercase text-sm">Servicio</th>
                          <th className="text-center py-3 px-4 text-white/60 font-heading uppercase text-sm">Ambiente</th>
                          <th className="text-center py-3 px-4 text-white/60 font-heading uppercase text-sm">Higiene</th>
                          <th className="text-left py-3 px-4 text-white/60 font-heading uppercase text-sm">Fecha</th>
                          <th className="text-left py-3 px-4 text-white/60 font-heading uppercase text-sm">Comentario</th>
                        </tr>
                      </thead>
                      <tbody>
                        {surveys.map((survey) => (
                          <tr key={survey.id} className="border-b border-[#333] hover:bg-[#0a0a0a]/50 cursor-pointer transition-colors" onClick={() => setSelectedSurvey(survey)}>
                            <td className="py-4 px-4">
                              <div>
                                <p className="text-white font-heading">{survey.customer.name}</p>
                                <p className="text-white/60 text-sm">{survey.customer.phone}</p>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              {survey.qrTable ? (
                                <span className="px-2 py-1 rounded bg-[#FFD700]/10 text-[#FFD700] text-xs font-heading uppercase">
                                  {survey.qrTable}
                                </span>
                              ) : (
                                <span className="text-white/30 text-sm">—</span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-center">
                              <StarRating rating={survey.musicRating} />
                            </td>
                            <td className="py-4 px-4 text-center">
                              <StarRating rating={survey.serviceRating} />
                            </td>
                            <td className="py-4 px-4 text-center">
                              <StarRating rating={survey.ambienceRating} />
                            </td>
                            <td className="py-4 px-4 text-center">
                              <StarRating rating={survey.hygieneRating} />
                            </td>
                            <td className="py-4 px-4 text-white/60 text-sm">
                              {new Date(survey.createdAt).toLocaleDateString('es-CO', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="py-4 px-4">
                              {survey.comments ? (
                                <div className="group relative max-w-[200px]">
                                  <div className="flex items-start gap-1.5">
                                    <MessageSquare size={14} className="text-[#FFD700] mt-0.5 flex-shrink-0" />
                                    <p className="text-white/70 text-sm truncate" title={survey.comments}>
                                      {survey.comments}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-white/30 text-sm">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="border-[#333] bg-[#0a0a0a] text-white hover:bg-[#333]"
                      >
                        Anterior
                      </Button>
                      <span className="text-white/60 text-sm px-3">
                        {page} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="border-[#333] bg-[#0a0a0a] text-white hover:bg-[#333]"
                      >
                        Siguiente
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <BarChart3 size={48} className="text-white/20 mx-auto" />
                  <p className="text-white/60 text-lg">Aún no hay encuestas</p>
                  <p className="text-white/40 text-sm max-w-md mx-auto">
                    Las encuestas aparecerán aquí cuando los clientes las completen.
                    El sistema envía links automáticamente al día siguiente de su visita.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Survey Detail Dialog */}
      <SurveyDetailDialog
        survey={selectedSurvey}
        open={!!selectedSurvey}
        onOpenChange={(open) => { if (!open) setSelectedSurvey(null); }}
      />
    </div>
  );
}
