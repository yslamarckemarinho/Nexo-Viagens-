import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NexoLogo } from '../common/NexoLogo';
import {
  Car,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  MapPin,
  CheckCircle2,
  Lock,
  ChevronRight,
  Zap,
  TrendingUp,
} from 'lucide-react';

interface PortalSelectScreenProps {
  onSelectPortal: (portal: 'merchant' | 'courier' | 'admin') => void;
}

export const PortalSelectScreen: React.FC<PortalSelectScreenProps> = ({ onSelectPortal }) => {
  const { settings, merchants, couriers } = useApp();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] bg-gradient-to-b from-cyan-600/15 via-blue-700/10 to-transparent blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/10 blur-3xl pointer-events-none"></div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-4 py-3.5 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <NexoLogo size="md" variant="light" showSubtitle={true} citySubtitle={true} />
          
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Operação Ativa • {settings.city}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 py-8 sm:py-12 w-full flex-1 flex flex-col justify-center">
        {/* Welcome Tagline */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30 mb-3 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Central de Mobilidade & Viagens
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Conectando passageiros aos melhores motoristas de{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
              Alagoinha
            </span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base mt-3 leading-relaxed">
            Selecione seu perfil de acesso para entrar com o login e senha gerados pela Central Nexo Viagens.
          </p>
        </div>

        {/* 2 Main Role Portals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-4xl mx-auto w-full">
          {/* Card 1: Passageiro / Solicitante de Viagem */}
          <div
            onClick={() => onSelectPortal('merchant')}
            className="group relative rounded-3xl p-6 sm:p-8 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/60 shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all"></div>
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md group-hover:scale-110 transition-transform">
                  <Sparkles className="w-7 h-7" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800/60">
                  Para Passageiros
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                Passageiro / Viagens
              </h2>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Peça sua viagem com facilidade em Alagoinha, viaje com agilidade e segurança com motoristas credenciados da Nexo Viagens.
              </p>

              <div className="mt-5 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Operação por Pontos de Referência (Centro, Pátio e Rural)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Pagamento 100% digital via créditos pré-pagos da Central</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Segurança garantida com Código PIN de desembarque</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-400">
                Auto-Cadastro ou Login Rápido
              </span>
              <button
                id="btn-portal-passageiro"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:from-cyan-400 hover:to-blue-500 shadow-md group-hover:shadow-cyan-500/25 transition-all cursor-pointer"
              >
                <span>Cadastrar / Entrar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 2: Motorista Parceiro */}
          <div
            onClick={() => onSelectPortal('courier')}
            className="group relative rounded-3xl p-6 sm:p-8 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/60 shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md group-hover:scale-110 transition-transform">
                  <Car className="w-7 h-7" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/60">
                  Para Motoristas
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                Motorista Parceiro
              </h2>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Trabalhe com autonomia em Alagoinha-PB, realize viagens e corridas com passageiros e receba repasses rápidos no seu Pix.
              </p>

              <div className="mt-5 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Notificações sonoras e lista de viagens disponíveis</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Painel completo de ganhos com repasse direto via Pix</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Fluxo operacional transparente com validação por PIN</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Acesso com Login e Senha
              </span>
              <button
                id="btn-portal-motorista"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 hover:from-emerald-300 hover:to-teal-400 shadow-md group-hover:shadow-emerald-500/25 transition-all cursor-pointer"
              >
                <span>Acessar Motorista</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Hidden / Discreet Central Admin Button at Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/80 px-4 py-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-cyan-500" />
            <span>Nexo Viagens • Operando em {settings.city}</span>
          </div>

          {/* Discreet Admin Login Link */}
          <button
            id="btn-portal-admin-hidden"
            onClick={() => onSelectPortal('admin')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-900 border border-slate-800/80 transition-all cursor-pointer group"
          >
            <Lock className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            <span>Acesso Restrito • Central ADM</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
