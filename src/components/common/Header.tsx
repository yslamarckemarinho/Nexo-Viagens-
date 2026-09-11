import React from 'react';
import { useApp } from '../../context/AppContext';
import { NexoLogo } from './NexoLogo';
import {
  Car,
  ShieldCheck,
  Volume2,
  VolumeX,
  LogOut,
  Power,
  Wallet,
  Trophy,
  MapPin,
  Sparkles,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    session,
    logout,
    currentMerchant,
    currentCourier,
    settings,
    soundEnabled,
    setSoundEnabled,
    toggleEntregadorOnline,
    recharges,
    withdrawals,
    deliveries,
  } = useApp();

  const pendingRechargesCount = recharges.filter((r) => r.status === 'aguardando_pix').length;
  const pendingWithdrawalsCount = withdrawals.filter((w) => w.status === 'aguardando_pagamento').length;
  const waitingDeliveriesCount = deliveries.filter(
    (d) => d.status === 'aguardando_entregador' || d.status === 'solicitada'
  ).length;

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-slate-100 shadow-md">
      {/* City & Support Bar */}
      <div className="bg-slate-950 px-4 py-1.5 border-b border-slate-800/80 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="text-slate-400">Cidade:</span>
            <span className="font-bold text-cyan-400 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-cyan-400" />
              {settings.city}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
              title={soundEnabled ? 'Desativar Alertas Sonoros' : 'Ativar Alertas Sonoros'}
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              )}
              <span className="hidden sm:inline">{soundEnabled ? 'Sons Ativos' : 'Silencioso'}</span>
            </button>

            <span className="text-slate-700 hidden sm:inline">|</span>
            <span className="text-slate-400 text-[11px] hidden sm:inline">
              Central: {settings.centralPhone}
            </span>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <NexoLogo size="sm" variant="light" showSubtitle={true} citySubtitle={false} />
        </div>

        {/* User Identity & Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Admin Role Identity */}
          {session.role === 'admin' && (
            <div className="flex items-center gap-2 bg-slate-800/90 border border-cyan-500/30 rounded-2xl px-3 py-1.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-white leading-tight">
                  {session.adminName || 'Central ADM'}
                </div>
                <div className="text-[10px] text-cyan-400 font-semibold uppercase">
                  Gestor Operacional
                </div>
              </div>
            </div>
          )}

          {/* Merchant / Passenger Role Identity */}
          {session.role === 'merchant' && currentMerchant && (
            <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-2xl px-3 py-1.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white leading-tight max-w-[140px] truncate">
                  {currentMerchant.name}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                  <span>Passageiro</span>
                  <span>•</span>
                  <span className="text-cyan-400 font-bold">R$ {currentMerchant.creditBalance.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Courier Role Identity */}
          {session.role === 'courier' && currentCourier && (
            <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-2xl px-3 py-1.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Car className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-white leading-tight max-w-[130px] truncate">
                  {currentCourier.name}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                  <Trophy className="w-3 h-3 text-amber-400" />
                  <span>
                    R$ {currentCourier.accumulatedBalance.toFixed(2)} / R$ {settings.goalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Online status toggle */}
              <button
                id="btn-courier-header-online-toggle"
                onClick={() => toggleEntregadorOnline(currentCourier.id)}
                className={`ml-1 px-2 py-1 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  currentCourier.isOnline
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-700 text-slate-400'
                }`}
                title={currentCourier.isOnline ? 'Você está Online' : 'Você está Offline'}
              >
                <Power className="w-3 h-3" />
                <span className="hidden sm:inline">{currentCourier.isOnline ? 'Online' : 'Offline'}</span>
              </button>
            </div>
          )}

          {/* Sair / Encerrar Sessão Button */}
          <button
            id="btn-logout-header"
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 transition-all cursor-pointer shadow-xs"
            title="Sair desta conta com segurança"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
};
