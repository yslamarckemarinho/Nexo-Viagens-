import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Navigation,
  Clock,
  CheckCircle2,
  User,
  Car,
  DollarSign,
  TrendingUp,
  CreditCard,
  AlertCircle,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

interface AdminMetricsOverviewProps {
  onNavigateTab: (tab: 'entregas' | 'creditos' | 'saques' | 'comercios' | 'entregadores') => void;
}

export const AdminMetricsOverview: React.FC<AdminMetricsOverviewProps> = ({ onNavigateTab }) => {
  const { merchants, couriers, deliveries, recharges, withdrawals, settings } = useApp();

  const todayDateStr = new Date().toISOString().split('T')[0];
  const deliveriesToday = deliveries.filter((d) => d.createdAt.startsWith(todayDateStr)).length;
  const deliveriesInProgress = deliveries.filter(
    (d) => d.status !== 'concluida' && d.status !== 'corrida_concluida' && d.status !== 'cancelada'
  ).length;
  const deliveriesCompleted = deliveries.filter(
    (d) => d.status === 'concluida' || d.status === 'corrida_concluida'
  ).length;
  const activeMerchantsCount = merchants.filter((m) => m.active).length;
  const onlineCouriersCount = couriers.filter((c) => c.active && c.isOnline).length;

  const totalCreditsReceived = recharges
    .filter((r) => r.status === 'confirmado')
    .reduce((acc, r) => acc + (r.amountReceived || r.amountRequested), 0);

  const pendingWithdrawalsCount = withdrawals.filter((w) => w.status === 'aguardando_pagamento').length;

  const totalPaidToCouriers = withdrawals
    .filter((w) => w.status === 'pago')
    .reduce((acc, w) => acc + w.netAmount, 0);

  const centralRevenueEarned = withdrawals
    .filter((w) => w.status === 'pago')
    .reduce((acc, w) => acc + w.centralFeeAmount, 0);

  return (
    <div className="space-y-6">
      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Entregas em Andamento */}
        <div
          onClick={() => onNavigateTab('entregas')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 shadow-lg cursor-pointer transition-all hover:translate-y-[-2px] relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Viagens em Andamento</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{deliveriesInProgress}</span>
            <span className="text-xs text-slate-400">hoje: {deliveriesToday}</span>
          </div>
          <div className="mt-3 flex items-center text-xs text-cyan-400 font-medium">
            <span>Ver todas as viagens</span>
            <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

        {/* Passageiros Ativos */}
        <div
          onClick={() => onNavigateTab('comercios')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 shadow-lg cursor-pointer transition-all hover:translate-y-[-2px] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Passageiros Cadastrados</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
              <User className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{activeMerchantsCount}</span>
            <span className="text-xs text-slate-400">de {merchants.length} total</span>
          </div>
          <div className="mt-3 flex items-center text-xs text-blue-400 font-medium">
            <span>Gerenciar passageiros</span>
            <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

        {/* Motoristas Online */}
        <div
          onClick={() => onNavigateTab('entregadores')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 shadow-lg cursor-pointer transition-all hover:translate-y-[-2px] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Motoristas Online</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <Car className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{onlineCouriersCount}</span>
            <span className="text-xs text-slate-400">de {couriers.length} ativos</span>
          </div>
          <div className="mt-3 flex items-center text-xs text-emerald-400 font-medium">
            <span>Gerenciar motoristas</span>
            <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

        {/* Saques Pendentes */}
        <div
          onClick={() => onNavigateTab('saques')}
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 shadow-lg cursor-pointer transition-all hover:translate-y-[-2px] group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Saques Pendentes</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{pendingWithdrawalsCount}</span>
            <span className="text-xs text-amber-400 font-medium">
              {pendingWithdrawalsCount > 0 ? 'Requer atenção' : 'Tudo em dia'}
            </span>
          </div>
          <div className="mt-3 flex items-center text-xs text-amber-400 font-medium">
            <span>Ver repasses Pix</span>
            <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>
      </div>

      {/* Financial Overview Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Balanço Financeiro da Central</h3>
              <p className="text-xs text-slate-400">Operação em Alagoinha-PB • Comissão {(settings.centralCommissionRate * 100).toFixed(0)}%</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 block mb-1">Recargas Pix Recebidas</span>
            <span className="text-2xl font-black text-emerald-400">R$ {totalCreditsReceived.toFixed(2)}</span>
            <p className="text-[11px] text-slate-500 mt-1">Créditos arrecadados dos passageiros</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 block mb-1">Repasses Pagos aos Motoristas</span>
            <span className="text-2xl font-black text-sky-400">R$ {totalPaidToCouriers.toFixed(2)}</span>
            <p className="text-[11px] text-slate-500 mt-1">Líquido transferido via Pix</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 block mb-1">Receita Líquida da Central</span>
            <span className="text-2xl font-black text-cyan-300">R$ {centralRevenueEarned.toFixed(2)}</span>
            <p className="text-[11px] text-slate-500 mt-1">Comissões retidas pela plataforma</p>
          </div>
        </div>
      </div>
    </div>
  );
};
