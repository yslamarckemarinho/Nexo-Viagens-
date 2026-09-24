import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NexoLogo } from '../common/NexoLogo';
import {
  Car,
  ArrowLeft,
  KeyRound,
  Phone,
  AlertCircle,
  MessageCircle,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

interface CourierAuthScreenProps {
  onBack: () => void;
}

export const CourierAuthScreen: React.FC<CourierAuthScreenProps> = ({ onBack }) => {
  const { loginCourier, settings, couriers } = useApp();

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginIdentifier.trim()) {
      setLoginError('Informe seu Telefone/WhatsApp, CPF ou Usuário cadastrado.');
      return;
    }

    const res = loginCourier(loginIdentifier.trim(), loginPassword.trim() || undefined);
    if (!res.success) {
      setLoginError(res.error || 'Erro ao realizar login.');
    }
  };

  const whatsappPhone = settings.centralPhone.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/55${whatsappPhone}?text=${encodeURIComponent(
    'Olá! Quero me cadastrar como motorista parceiro na Nexo Viagens de Alagoinha-PB e solicitar meu login e senha de acesso.'
  )}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 py-3 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          <NexoLogo size="sm" variant="light" showSubtitle={false} />
        </div>
      </header>

      {/* Auth Container */}
      <main className="max-w-md mx-auto px-4 py-8 w-full flex-1 flex flex-col justify-center">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

          {/* Header Title */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Acesso do Moto Táxi
              </h2>
              <p className="text-xs text-slate-400">
                Acesse com o login e senha fornecidos pela Central Nexo Viagens
              </p>
            </div>
          </div>

          {/* LOGIN FORM */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Telefone / WhatsApp, CPF ou Usuário
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-motorista-login-user"
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="(83) 99999-0000 ou seu CPF"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Senha de Acesso
                </label>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-emerald-400 hover:text-emerald-300"
                >
                  Esqueceu a senha?
                </a>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-motorista-login-pass"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Digite sua senha cadastrada"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <button
              id="btn-motorista-submit-login"
              type="submit"
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 hover:from-emerald-300 hover:to-teal-400 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              Entrar no Painel do Motorista
            </button>
          </form>

          {/* Credenciamento Informativo via Central */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-start gap-2.5">
              <UserCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-200">
                  Ainda não é um motorista parceiro?
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  O cadastro de novos motoristas, aplicação de foto e emissão de senha são realizados <b>exclusivamente pela Central Nexo Viagens</b>.
                </p>
              </div>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Solicitar Cadastro no WhatsApp da Central</span>
            </a>
          </div>

          <div className="pt-2 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Central Nexo Viagens Alagoinha • Suporte: {settings.centralPhone}</span>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 py-3 text-center text-xs text-slate-500">
        Nexo Viagens • Sistema Oficial de Mobilidade em Alagoinha-PB
      </footer>
    </div>
  );
};
