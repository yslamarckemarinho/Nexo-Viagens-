import React, { useState } from 'react';
import { useApp, getStatusBadgeClasses, getStatusDescription } from '../../context/AppContext';
import { Delivery } from '../../types';
import { getZoneBadgeDetails } from '../../utils/routeIntelligence';
import {
  Navigation,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  Phone,
  MapPin,
  FileText,
  Calendar,
  ExternalLink,
  DollarSign,
  AlertCircle,
  Building2,
  Car,
  Sparkles,
  Key,
} from 'lucide-react';

export const AdminDeliveriesTab: React.FC = () => {
  const { deliveries, settings, cancelarEntrega, avancarStatusEntrega } = useApp();

  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState<string>('todas');
  const [deliverySearch, setDeliverySearch] = useState('');
  const [selectedDeliveryDetails, setSelectedDeliveryDetails] = useState<Delivery | null>(null);
  const [cancellingDelivery, setCancellingDelivery] = useState<Delivery | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const filteredDeliveries = deliveries.filter((d) => {
    const matchesStatus = deliveryStatusFilter === 'todas' || d.status === deliveryStatusFilter;
    const matchesSearch =
      d.code.toLowerCase().includes(deliverySearch.toLowerCase()) ||
      d.merchantName.toLowerCase().includes(deliverySearch.toLowerCase()) ||
      (d.courierName && d.courierName.toLowerCase().includes(deliverySearch.toLowerCase())) ||
      d.deliveryAddress.toLowerCase().includes(deliverySearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingDelivery) return;
    cancelarEntrega(cancellingDelivery.id, cancelReason.trim() || 'Cancelado pela Central Nexo Viagens');
    setCancellingDelivery(null);
    setCancelReason('');
    if (selectedDeliveryDetails?.id === cancellingDelivery.id) {
      setSelectedDeliveryDetails(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-deliveries"
            type="text"
            value={deliverySearch}
            onChange={(e) => setDeliverySearch(e.target.value)}
            placeholder="Buscar por código, passageiro, motorista ou endereço..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            id="select-filter-status"
            value={deliveryStatusFilter}
            onChange={(e) => setDeliveryStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="todas">Todos os Status ({deliveries.length})</option>
            <option value="solicitada">Solicitada / Nova</option>
            <option value="aguardando_entregador">Aguardando Motorista</option>
            <option value="entregador_aceitou">Motorista Aceitou</option>
            <option value="a_caminho_coleta">A Caminho do Embarque</option>
            <option value="pedido_coletado">Passageiro Embarcou</option>
            <option value="a_caminho_entrega">Em Viagem ao Destino</option>
            <option value="concluida">Viagem Concluída</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>
      </div>

      {/* Deliveries List */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Navigation className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-sm sm:text-base">
              Monitoramento Operacional de Corridas e Viagens ({filteredDeliveries.length})
            </h3>
          </div>
        </div>

        {filteredDeliveries.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Navigation className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">Nenhuma viagem encontrada</p>
            <p className="text-xs text-slate-500">Altere os filtros ou visualize solicitações criadas pelos passageiros.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredDeliveries.map((delivery) => {
              const badge = getStatusBadgeClasses(delivery.status);
              return (
                <div
                  key={delivery.id}
                  className="p-4 sm:p-5 hover:bg-slate-850/50 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-cyan-400">
                        {delivery.code}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        {badge.label}
                      </span>
                      {delivery.zoneType && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            getZoneBadgeDetails(delivery.zoneType, delivery.deliveryFee, delivery.isRural).bg
                          } ${
                            getZoneBadgeDetails(delivery.zoneType, delivery.deliveryFee, delivery.isRural).text
                          } ${
                            getZoneBadgeDetails(delivery.zoneType, delivery.deliveryFee, delivery.isRural).border
                          }`}
                        >
                          {getZoneBadgeDetails(delivery.zoneType, delivery.deliveryFee, delivery.isRural).icon}{' '}
                          {getZoneBadgeDetails(delivery.zoneType, delivery.deliveryFee, delivery.isRural).label}
                        </span>
                      )}
                      {/* PIN de Segurança */}
                      {delivery.pinCode && (
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <Key className="w-3 h-3 text-amber-400" />
                          PIN: {delivery.pinCode}
                        </span>
                      )}

                      {/* Status de Pagamento via Créditos */}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                        💳 Crédito Nexo Viagens
                      </span>

                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {new Date(delivery.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 block">Passageiro / Solicitante:</span>
                        <span className="font-semibold text-slate-200">{delivery.merchantName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Motorista:</span>
                        <span className="font-semibold text-slate-200">
                          {delivery.courierName ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <Car className="w-3.5 h-3.5" />
                              {delivery.courierName}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">Aguardando motorista...</span>
                          )}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-500 block">Destino da Viagem:</span>
                        <span className="text-slate-300 font-medium">{delivery.deliveryAddress}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800 justify-end">
                    <button
                      id={`btn-view-details-${delivery.id}`}
                      onClick={() => setSelectedDeliveryDetails(delivery)}
                      className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Detalhes</span>
                    </button>

                    {delivery.status !== 'concluida' && delivery.status !== 'cancelada' && (
                      <>
                        <button
                          id={`btn-advance-status-${delivery.id}`}
                          onClick={() => avancarStatusEntrega(delivery.id, 'admin')}
                          className="px-3 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-colors cursor-pointer"
                          title="Avançar status manualmente pela Central"
                        >
                          Avançar Etapa
                        </button>
                        <button
                          id={`btn-cancel-delivery-${delivery.id}`}
                          onClick={() => setCancellingDelivery(delivery)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold transition-colors cursor-pointer"
                          title="Cancelar viagem"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Delivery Details & History */}
      {selectedDeliveryDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-cyan-400 text-lg">
                  {selectedDeliveryDetails.code}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    getStatusBadgeClasses(selectedDeliveryDetails.status).bg
                  } ${getStatusBadgeClasses(selectedDeliveryDetails.status).text}`}
                >
                  {getStatusBadgeClasses(selectedDeliveryDetails.status).label}
                </span>
              </div>
              <button
                onClick={() => setSelectedDeliveryDetails(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Forma de Pagamento:</span>
                  <span className="font-bold text-cyan-300">Créditos Nexo Viagens (100% via Central)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Taxa Total da Viagem:</span>
                  <span className="font-bold text-white">
                    {selectedDeliveryDetails.isRural && selectedDeliveryDetails.ruralAgreedDirectly ? (
                      <span className="text-amber-400">A Combinar (Zona Rural)</span>
                    ) : (
                      `R$ ${selectedDeliveryDetails.deliveryFee.toFixed(2)}`
                    )}
                  </span>
                </div>
                {selectedDeliveryDetails.zoneType && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ponto de Referência / Zona Tarifária:</span>
                    <span className="font-bold text-cyan-300">
                      {getZoneBadgeDetails(selectedDeliveryDetails.zoneType, selectedDeliveryDetails.deliveryFee, selectedDeliveryDetails.isRural).label}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Comissão Retida pela Central:</span>
                  <span className="text-cyan-400 font-semibold">R$ {selectedDeliveryDetails.centralFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800/80 pt-1.5">
                  <span className="text-slate-400 font-semibold">Repasse Líquido do Motorista:</span>
                  <span className="text-emerald-400 font-black">
                    {selectedDeliveryDetails.isRural && selectedDeliveryDetails.ruralAgreedDirectly ? (
                      <span className="text-amber-400">A Combinar</span>
                    ) : (
                      `R$ ${selectedDeliveryDetails.courierEarnings.toFixed(2)}`
                    )}
                  </span>
                </div>
              </div>

              {/* Informações de PIN de Segurança */}
              {selectedDeliveryDetails.pinCode && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span>Código PIN de Desembarque:</span>
                  </div>
                  <span className="font-mono font-black text-sm text-amber-200 bg-amber-500/20 px-3 py-0.5 rounded border border-amber-500/40 tracking-wider">
                    {selectedDeliveryDetails.pinCode}
                  </span>
                </div>
              )}

              {/* Nota de Cobrança Zero em Mãos */}
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>O passageiro utilizou saldo de créditos pré-pagos. A Central repassará os R$ {selectedDeliveryDetails.courierEarnings.toFixed(2)} ao motorista via Pix.</span>
              </div>

              {selectedDeliveryDetails.zoneReason && (
                <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs flex items-start gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
                  <span><strong>Inteligência de Rota:</strong> {selectedDeliveryDetails.zoneReason}</span>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-slate-400 font-semibold block">Histórico de Linha do Tempo:</span>
                <div className="space-y-2 max-h-44 overflow-y-auto p-2 rounded-xl bg-slate-950 border border-slate-800">
                  {selectedDeliveryDetails.statusHistory.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px] pb-1.5 border-b border-slate-900 last:border-0">
                      <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">{getStatusDescription(step.status)}</span>
                          <span className="text-slate-500">
                            {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        {step.note && <p className="text-slate-400 mt-0.5">{step.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedDeliveryDetails(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cancel Delivery Confirmation */}
      {cancellingDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleConfirmCancel}
            className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3 text-rose-400 pb-2 border-b border-slate-800">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-white text-base">Cancelar Viagem {cancellingDelivery.code}</h3>
            </div>

            <p className="text-xs text-slate-300">
              O cancelamento pela Central estornará os créditos para o passageiro caso a viagem ainda não tenha sido finalizada.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Motivo do Cancelamento:
              </label>
              <textarea
                id="input-cancel-reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ex: Passageiro solicitou cancelamento ou endereço incorreto"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-rose-500 min-h-[70px]"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCancellingDelivery(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
