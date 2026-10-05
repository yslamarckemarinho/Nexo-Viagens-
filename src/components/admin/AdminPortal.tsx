import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Navigation,
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
  const {
    logout,
    merchants,
    recharges,
    withdrawals,
    deliveries,
    couriers,
    pracas,
    settings,
    toggleTarifaDinamica,
    liveNotification,
    limparLiveNotification,
  } = useApp();
  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');

  const pendingRechargesCount = recharges.filter((r) => r.status === 'pendente').length;
  const pendingWithdrawalsCount = withdrawals.filter((w) => w.status === 'aguardando_pagamento').length;
  const pendingPilotsCount = couriers.filter((c) => c.approvalStatus === 'pendente').length;
  const pendingPassengersCount = merchants.filter((m) => m.status_cadastro === 'pendente').length;
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

            {pendingPassengersCount > 0 && (
              <button
                onClick={() => setCurrentTab('comercios')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-xs font-bold animate-pulse cursor-pointer"
                title="Passageiros aguardando confirmação"
              >
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>{pendingPassengersCount} {pendingPassengersCount === 1 ? 'Novo Passageiro' : 'Novos Passageiros'}</span>
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

      {/* Alerta / Toast em Tempo Real da Torre de Controle (Novo Cadastro ou Pix) */}
      {liveNotification && (
        <div className="bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 text-slate-950 px-4 py-2.5 shadow-lg flex items-center justify-between gap-3 animate-slide-down sticky top-16 z-35">
          <div className="flex items-center gap-2.5 max-w-4xl">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-ping shrink-0" />
            <span className="font-black text-xs sm:text-sm">{liveNotification.titulo}:</span>
            <span className="text-xs sm:text-sm font-semibold truncate">{liveNotification.mensagem}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                if (liveNotification.tipo === 'passageiro') setCurrentTab('comercios');
                if (liveNotification.tipo === 'piloto') setCurrentTab('entregadores');
                if (liveNotification.tipo === 'pix') setCurrentTab('creditos');
                if (liveNotification.tipo === 'corrida') setCurrentTab('entregas');
                limparLiveNotification();
              }}
              className="px-3 py-1 rounded-lg bg-slate-950 text-white font-bold text-xs hover:bg-slate-900 transition-colors cursor-pointer"
            >
              Ver Agora
            </button>
            <button
              onClick={limparLiveNotification}
              className="p-1 rounded-lg text-slate-950 hover:bg-black/10 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs Bar - Minimalista e Focado */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-16 z-30 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-2 py-2">
          {/* As 4 Abas Essenciais do Dia a Dia */}
          <div className="flex items-center gap-1.5 sm:gap-2">
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
              <Navigation className="w-4 h-4" />
              <span>Corridas</span>
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
              id="tab-btn-comercios"
              onClick={() => setCurrentTab('comercios')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer relative ${
                currentTab === 'comercios'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Passageiros</span>
              {pendingPassengersCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    currentTab === 'comercios' ? 'bg-slate-950 text-cyan-400' : 'bg-cyan-400 text-slate-950'
                  }`}
                >
                  {pendingPassengersCount} novo{pendingPassengersCount > 1 ? 's' : ''}
                </span>
              )}
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
                  {pendingPilotsCount}
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
              <span>Pix & Saldo</span>
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
          </div>

          {/* Abas Secundárias / Financeiro e Configurações */}
          <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
            <button
              id="tab-btn-saques"
              onClick={() => setCurrentTab('saques')}
              className={`px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'saques'
                  ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title="Repasses dos Motoristas"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Repasses</span>
            </button>

            <button
              id="tab-btn-pracas"
              onClick={() => setCurrentTab('pracas')}
              className={`px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'pracas'
                  ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title="Praças de Mototáxi"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Praças</span>
            </button>

            <button
              id="tab-btn-dre"
              onClick={() => setCurrentTab('dre')}
              className={`px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'dre'
                  ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title="DRE e Fechamento Contábil"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">DRE</span>
            </button>

            <button
              id="tab-btn-configuracoes"
              onClick={() => setCurrentTab('configuracoes')}
              className={`px-2.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                currentTab === 'configuracoes'
                  ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
              title="Tarifas e Parâmetros"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ajustes</span>
            </button>
          </div>
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
