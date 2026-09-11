import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Package,
  Users,
  Car,
  CreditCard,
  DollarSign,
  Settings,
  LogOut,
  ShieldCheck,
  Bell,
  Sparkles,
  CheckCircle2,
  Clock,
  MapPin,
} from 'lucide-react';
import { AdminMetricsOverview } from './AdminMetricsOverview';
import { AdminDeliveriesTab } from './AdminDeliveriesTab';
import { AdminMerchantsTab } from './AdminMerchantsTab';
import { AdminCouriersTab } from './AdminCouriersTab';
import { AdminCreditsTab } from './AdminCreditsTab';
import { AdminWithdrawalsTab } from './AdminWithdrawalsTab';
import { AdminSettingsTab } from './AdminSettingsTab';
import { AdminPracasTab } from './AdminPracasTab';
import { AdminDreReportTab } from './AdminDreReportTab';
import { AdminDemandHeatmapTab } from './AdminDemandHeatmapTab';
import { TrendingUp, Compass, CloudRain } from 'lucide-react';

type AdminTab =
  | 'dashboard'
  | 'entregas'
  | 'pracas'
  | 'demandas'
  | 'dre'
  | 'comercios'
  | 'entregadores'
  | 'creditos'
  | 'saques'
  | 'configuracoes';

export const AdminPortal: React.FC = () => {
  const { logout, recharges, withdrawals, deliveries, couriers, pracas, settings, toggleTarifaDinamica } = useApp();
  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');

  const pendingRechargesCount = recharges.filter((r) => r.status === 'pendente').length;
  const pendingWithdrawalsCount = withdrawals.filter((w) => w.status === 'aguardando_pagamento').length;
  const pendingPilotsCount = couriers.filter((c) => c.approvalStatus === 'pendente').length;
  const activeDeliveriesCount = deliveries.filter(
    (d) => d.status !== 'concluida' && d.status !== 'cancelada'
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <ShieldCheck className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                  NEXO <span className="text-cyan-400">VIAGENS</span>
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  CENTRAL ALAGOINHA-PB
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Mobilidade Urbana & Viagens em Alagoinha-PB</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Sugestão 7: Tarifa Dinâmica por Chuva / Eventos Quick Toggle */}
            <button
              type="button"
              onClick={() => toggleTarifaDinamica(!settings.tarifa_dinamica_ativa)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                settings.tarifa_dinamica_ativa
                  ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-sm shadow-blue-500/20 animate-pulse'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Ativar/desativar bandeira especial de chuva ou eventos"
            >
              <CloudRain className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">
                {settings.tarifa_dinamica_ativa
                  ? `Bandeira Chuva Ativa (+R$ ${(settings.tarifa_dinamica_adicional ?? 2).toFixed(2)})`
                  : 'Bandeira Chuva/Eventos'}
              </span>
            </button>

            {pendingPilotsCount > 0 && (
              <button
                onClick={() => setCurrentTab('entregadores')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold animate-pulse cursor-pointer"
                title="Motoristas aguardando sua autorização"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{pendingPilotsCount} {pendingPilotsCount === 1 ? 'Motorista Pendente' : 'Motoristas Pendentes'}</span>
              </button>
            )}

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium">Central Online</span>
            </div>

            <button
              id="btn-admin-logout"
              onClick={logout}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:border-rose-500/30 hover:text-rose-400 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair da Central</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs Bar */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-16 z-30 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 sm:gap-2 py-2">
          <button
            id="tab-btn-dashboard"
            onClick={() => setCurrentTab('dashboard')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              currentTab === 'dashboard'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Visão Geral</span>
          </button>

          <button
            id="tab-btn-entregas"
            onClick={() => setCurrentTab('entregas')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer relative ${
              currentTab === 'entregas'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Viagens</span>
            {activeDeliveriesCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  currentTab === 'entregas' ? 'bg-slate-950 text-cyan-400' : 'bg-cyan-500 text-slate-950'
                }`}
              >
                {activeDeliveriesCount}
              </span>
            )}
          </button>

          <button
            id="tab-btn-pracas"
            onClick={() => setCurrentTab('pracas')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer relative ${
              currentTab === 'pracas'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Praças de Mototáxi</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                currentTab === 'pracas' ? 'bg-slate-950 text-cyan-400' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {pracas.length}
            </span>
          </button>

          {/* Sugestão 10: Relatório Mensal de Demandas */}
          <button
            id="tab-btn-demandas"
            onClick={() => setCurrentTab('demandas')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              currentTab === 'demandas'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Demanda & Zonas Rurais</span>
          </button>

          <button
            id="tab-btn-dre"
            onClick={() => setCurrentTab('dre')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              currentTab === 'dre'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>DRE & Fechamento</span>
          </button>

          <button
            id="tab-btn-comercios"
            onClick={() => setCurrentTab('comercios')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              currentTab === 'comercios'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Passageiros</span>
          </button>

          <button
            id="tab-btn-entregadores"
            onClick={() => setCurrentTab('entregadores')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer relative ${
              currentTab === 'entregadores'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Motoristas</span>
            {pendingPilotsCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  currentTab === 'entregadores' ? 'bg-slate-950 text-amber-400' : 'bg-amber-400 text-slate-950'
                }`}
              >
                {pendingPilotsCount} pendente{pendingPilotsCount > 1 ? 's' : ''}
              </span>
            )}
          </button>

          <button
            id="tab-btn-creditos"
            onClick={() => setCurrentTab('creditos')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer relative ${
              currentTab === 'creditos'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Recargas Pix</span>
            {pendingRechargesCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  currentTab === 'creditos' ? 'bg-slate-950 text-cyan-400' : 'bg-amber-400 text-slate-950'
                }`}
              >
                {pendingRechargesCount}
              </span>
            )}
          </button>

          <button
            id="tab-btn-saques"
            onClick={() => setCurrentTab('saques')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer relative ${
              currentTab === 'saques'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Repasses dos Motoristas</span>
            {pendingWithdrawalsCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  currentTab === 'saques' ? 'bg-slate-950 text-cyan-400' : 'bg-amber-400 text-slate-950'
                }`}
              >
                {pendingWithdrawalsCount}
              </span>
            )}
          </button>

          <button
            id="tab-btn-configuracoes"
            onClick={() => setCurrentTab('configuracoes')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              currentTab === 'configuracoes'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Pontos & Tarifas</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentTab === 'dashboard' && (
          <AdminMetricsOverview onNavigateTab={(tab) => setCurrentTab(tab as AdminTab)} />
        )}
        {currentTab === 'entregas' && <AdminDeliveriesTab />}
        {currentTab === 'pracas' && <AdminPracasTab />}
        {currentTab === 'demandas' && <AdminDemandHeatmapTab />}
        {currentTab === 'dre' && <AdminDreReportTab />}
        {currentTab === 'comercios' && <AdminMerchantsTab />}
        {currentTab === 'entregadores' && <AdminCouriersTab />}
        {currentTab === 'creditos' && <AdminCreditsTab />}
        {currentTab === 'saques' && <AdminWithdrawalsTab />}
        {currentTab === 'configuracoes' && <AdminSettingsTab />}
      </main>
    </div>
  );
};
