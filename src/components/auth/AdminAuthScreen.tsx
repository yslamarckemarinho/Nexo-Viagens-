import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { NexoLogo } from '../common/NexoLogo';
import {
  ShieldCheck,
  ArrowLeft,
  Lock,
  User,
  KeyRound,
  AlertCircle,
  Sparkles,
  Info,
} from 'lucide-react';

interface AdminAuthScreenProps {
  onBack: () => void;
}

export const AdminAuthScreen: React.FC<AdminAuthScreenProps> = ({ onBack }) => {
  const { loginAdmin, settings } = useApp();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password.trim()) {
      setError('Por favor, digite a senha da Central.');
      return;
    }

    const res = loginAdmin(password.trim(), username.trim());
    if (!res.success) {
      setError(res.error || 'Acesso não autorizado.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Bar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-4 py-3 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Início</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="text-xs font-mono font-bold text-cyan-400">PAINEL RESTRITO</span>
          </div>
        </div>
      </header>

      {/* Main Admin Box */}
      <main className="max-w-md mx-auto px-4 py-8 w-full flex-1 flex flex-col justify-center">
        <div className="bg-slate-900/95 border border-cyan-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 mx-auto flex items-center justify-center text-cyan-400 mb-3 shadow-lg shadow-cyan-500/10">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Central Nexo Viagens ADM</h1>
            <p className="text-xs text-slate-400 mt-1">
              Gestão Operacional & Financeira • {settings.city}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Usuário Operador
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-admin-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Senha de Acesso Master
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="input-admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite a senha master"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                  autoFocus
                  required
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                Credenciais padrão para testes: Usuário <strong className="text-white">admin</strong> e Senha <strong className="text-white">admin</strong> (alterável nas configurações).
              </span>
            </div>

            <button
              id="btn-admin-submit-login"
              type="submit"
              className="w-full mt-2 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-slate-950 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer"
            >
              Acessar Painel Central
            </button>
          </form>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="py-4 text-center text-xs text-slate-600 border-t border-slate-900">
        Nexo Viagens • Sistema de Administração Operacional
      </footer>
    </div>
  );
};
