import React, { useState } from 'react';
import {
  ShieldCheck,
  Bike,
  MapPin,
  Clock,
  Star,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Share2,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { Delivery } from '../../types';
import { NexoLogo } from './NexoLogo';

interface PublicRideTrackingProps {
  delivery: Delivery | null | undefined;
  trackingCode?: string;
  onClose?: () => void;
}

export const PublicRideTracking: React.FC<PublicRideTrackingProps> = ({
  delivery,
  trackingCode,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  if (!delivery) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">Corrida Não Localizada</h2>
          <p className="text-sm text-slate-400">
            Não encontramos nenhuma viagem ativa com o código{' '}
            <strong className="text-amber-400">{trackingCode || 'informado'}</strong>. Verifique o link enviado ou entre em contato com a pessoa.
          </p>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-colors cursor-pointer"
            >
              Voltar ao Início
            </button>
          )}
        </div>
      </div>
    );
  }

  const isCompleted = delivery.status === 'concluida';
  const isCancelled = delivery.status === 'cancelada';
  const isActive = !isCompleted && !isCancelled;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-4 sm:p-6 selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Bar with Branding */}
      <header className="w-full max-w-xl flex items-center justify-between py-3 mb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <NexoLogo className="w-8 h-8" />
          <div>
            <h1 className="text-sm font-black text-white tracking-wide">Nexo Viagens</h1>
            <p className="text-[10px] text-cyan-400 font-medium">Alagoinha • Rastreio de Segurança da Família</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>{copied ? 'Link Copiado!' : 'Copiar Link'}</span>
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </header>

      {/* Main Tracking Card */}
      <main className="w-full max-w-xl space-y-4">
        {/* Status Live Banner */}
        <div
          className={`p-4 sm:p-5 rounded-3xl border shadow-xl flex items-center justify-between gap-3 ${
            isCompleted
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : isCancelled
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                isCompleted
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : isCancelled
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'bg-cyan-500/20 text-cyan-400 relative'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : isCancelled ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <>
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-400 animate-ping" />
                  <Bike className="w-6 h-6" />
                </>
              )}
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                Status da Corrida {delivery.code}
              </span>
              <h2 className="text-base sm:text-lg font-black text-white">
                {isCompleted && 'Viagem Concluída com Sucesso!'}
                {isCancelled && 'Viagem Cancelada'}
                {delivery.status === 'aguardando_entregador' && 'Aguardando Mototaxista da Praça'}
                {delivery.status === 'entregador_aceitou' && 'Mototaxista a Caminho do Passageiro'}
                {delivery.status === 'a_caminho_coleta' && 'Piloto Deslocando-se ao Embarque'}
                {delivery.status === 'pedido_coletado' && 'Passageiro Embarcado • Em Trânsito'}
                {delivery.status === 'a_caminho_entrega' && 'A Caminho do Destino'}
              </h2>
              <p className="text-xs opacity-85">
                {isCompleted
                  ? 'O passageiro chegou em segurança ao destino em Alagoinha.'
                  : isActive
                  ? 'Esta viagem está sob monitoramento e telemetria da Central.'
                  : 'A corrida foi cancelada.'}
              </p>
            </div>
          </div>
        </div>

        {/* Pilot Credential Card */}
        {delivery.courierId && (
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Motorista Credenciado
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30">
                Cadastro Verificado
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center font-black text-xl shrink-0">
                {delivery.courierName ? delivery.courierName.charAt(0).toUpperCase() : 'M'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-white truncate">{delivery.courierName || 'Mototaxista Oficial'}</h3>
                <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <span className="flex items-center text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                    4.9 ★
                  </span>
                  <span>•</span>
                  <span>{delivery.pracaZoneName || 'Praça Central'}</span>
                </p>
                {delivery.courierPhone && (
                  <p className="text-xs text-slate-400 mt-1">
                    Telefone: <strong className="text-slate-200">{delivery.courierPhone}</strong>
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Veículo Oficial</span>
                <strong className="text-slate-200">Motocicleta Licenciada</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Identificação</span>
                <strong className="text-cyan-300">Alagoinha / Paraíba</strong>
              </div>
            </div>
          </div>
        )}

        {/* Route Details */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Itinerário da Viagem</h4>

          <div className="space-y-3 relative pl-6 border-l-2 border-dashed border-slate-700 ml-3">
            <div className="relative">
              <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950" />
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Ponto de Embarque</span>
              <p className="text-sm font-semibold text-white mt-0.5">{delivery.pickupAddress}</p>
            </div>

            <div className="relative pt-2">
              <div className="absolute -left-[31px] top-3 w-4 h-4 rounded-full bg-cyan-500 border-2 border-slate-950" />
              <span className="text-[10px] font-bold text-cyan-400 uppercase">Destino Final</span>
              <p className="text-sm font-semibold text-white mt-0.5">{delivery.deliveryAddress}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Passageiro</span>
              <strong className="text-white truncate block">{delivery.merchantName}</strong>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Horário do Pedido</span>
              <strong className="text-slate-200">
                {new Date(delivery.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </strong>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-slate-500 block">Código da Corrida</span>
              <strong className="text-cyan-400 font-mono">{delivery.code}</strong>
            </div>
          </div>
        </div>

        {/* Security / Central Seal */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Viagem Monitorada pela Central de Alagoinha</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Dúvidas ou emergências sobre esta corrida? A Central atende pelo suporte oficial.
          </p>
        </div>
      </main>
    </div>
  );
};
