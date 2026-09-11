import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CentralSettings, PixKeyType } from '../../types';
import { SUPABASE_SQL_SCHEMA } from '../../lib/supabaseSchema';
import {
  Settings,
  DollarSign,
  Save,
  Trash2,
  AlertTriangle,
  QrCode,
  Phone,
  CheckCircle2,
  Percent,
  RefreshCw,
  Database,
  Copy,
  Check,
  Shield,
  Layers,
} from 'lucide-react';

export const AdminSettingsTab: React.FC = () => {
  const { settings, updateSettings, limparTudoZerado, isSupabaseActive } = useApp();

  const [formSettings, setFormSettings] = useState<CentralSettings>({ ...settings });
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formSettings);
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleResetData = () => {
    limparTudoZerado();
    setShowResetModal(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* SUPABASE STATUS & SQL SCHEMA */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Banco de Dados Supabase (Postgres & Realtime)</h3>
              <p className="text-xs text-slate-400">
                Arquitetura segura com RLS, backend Express com Service Role e client com Anon Key.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
                isSupabaseActive
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isSupabaseActive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {isSupabaseActive ? 'Supabase Conectado' : 'Supabase em Modo Local'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              Script SQL do Schema Oficial (Tabelas, RLS e Realtime)
            </h4>
            <p className="text-xs text-slate-400">
              Execute este script no SQL Editor do Supabase para criar as tabelas `pracas`, `mototaxistas`, `passageiros`, `corridas` e políticas de segurança.
            </p>
          </div>

          <button
            onClick={handleCopySql}
            type="button"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs shrink-0 cursor-pointer border border-cyan-500/20 transition-all"
          >
            {copiedSql ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedSql ? 'Copiado!' : 'Copiar Script SQL'}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* MODELO DE NEGÓCIO: TAXAS DA CENTRAL */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Percent className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-bold text-white text-base">Modelo de Negócio (Monetização da Central)</h3>
              <p className="text-xs text-slate-400">
                A Central ganha dinheiro com taxa do passageiro e taxa/comissão do mototaxista. Valores 100% configuráveis.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Taxa Passageiro */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-cyan-300 uppercase tracking-wider">
                  1. Taxa Cobrada do Passageiro
                </span>
                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20 font-bold">
                  Receita Central
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Valor cobrado adicionalmente do passageiro ao solicitar cada corrida.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Tipo de Cobrança
                  </label>
                  <select
                    value={formSettings.taxa_passageiro_tipo || 'fixo'}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        taxa_passageiro_tipo: e.target.value as 'fixo' | 'percentual',
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-cyan-500"
                  >
                    <option value="fixo">Valor Fixo (R$)</option>
                    <option value="percentual">Percentual (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Valor da Taxa
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formSettings.taxa_passageiro_valor ?? 0}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        taxa_passageiro_valor: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>

            {/* Taxa Mototaxista */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-emerald-300 uppercase tracking-wider">
                  2. Comissão Cobrada do Mototaxista
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                  Comissão Central
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Percentual ou valor retido do valor da corrida no repasse para o mototaxista.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Tipo de Comissão
                  </label>
                  <select
                    value={formSettings.taxa_mototaxista_tipo || 'percentual'}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        taxa_mototaxista_tipo: e.target.value as 'fixo' | 'percentual',
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-cyan-500"
                  >
                    <option value="percentual">Percentual (%)</option>
                    <option value="fixo">Valor Fixo (R$)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Valor da Comissão
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formSettings.taxa_mototaxista_valor ?? 15}
                    onChange={(e) =>
                      setFormSettings({
                        ...formSettings,
                        taxa_mototaxista_valor: Number(e.target.value),
                        centralCommissionRate: Number(e.target.value) / 100,
                        centralFeePercentage: Number(e.target.value) / 100,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Parametrização Tarifária Base */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <DollarSign className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">Tarifas Base Urbanas & Controle de Qualidade</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-2xl bg-slate-950 border border-blue-500/20">
              <label className="block font-semibold text-blue-300 mb-1.5 flex items-center gap-1">
                🏙️ Corrida Urbana Central (R$)
              </label>
              <input
                id="input-fee-urban-central"
                type="number"
                step="0.5"
                min="1"
                value={formSettings.feeUrbanCentral ?? 4.0}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, feeUrbanCentral: Number(e.target.value), tarifa_base_corrida: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-cyan-500"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">Matriz, Centro, Nova Alagoinha, etc.</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-purple-500/20">
              <label className="block font-semibold text-purple-300 mb-1.5 flex items-center gap-1">
                🚗 Urbana Periférica / Saídas (R$)
              </label>
              <input
                id="input-fee-urban-distante"
                type="number"
                step="0.5"
                min="1"
                value={formSettings.feeUrbanDistante ?? 5.0}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, feeUrbanDistante: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:border-purple-500"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">Pátio de Festas, saída Cuitegi, Periferias.</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-amber-500/20">
              <label className="block font-semibold text-amber-300 mb-1.5 flex items-center gap-1">
                ⭐ Nota Mínima de Qualidade (Trava)
              </label>
              <input
                id="input-nota-minima-qualidade"
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={formSettings.nota_minima_qualidade ?? 3.8}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, nota_minima_qualidade: Number(e.target.value) })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-bold text-sm focus:outline-none focus:border-amber-500"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">Bloqueio preventivo se média cair abaixo (padrão 3.8).</p>
            </div>
          </div>
        </div>

        {/* Dados de Pix e Contato da Central */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <QrCode className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Conta Pix & Suporte da Central Nexo Viagens</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Tipo da Chave Pix da Central
              </label>
              <select
                id="select-central-pix-type"
                value={formSettings.centralPixKeyType}
                onChange={(e) =>
                  setFormSettings({
                    ...formSettings,
                    centralPixKeyType: e.target.value as PixKeyType,
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="telefone">Telefone</option>
                <option value="cpf">CPF / CNPJ</option>
                <option value="email">E-mail</option>
                <option value="aleatoria">Chave Aleatória</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Chave Pix da Central (para recargas dos passageiros)
              </label>
              <input
                id="input-central-pix-key"
                type="text"
                value={formSettings.centralPixKey}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, centralPixKey: e.target.value })
                }
                placeholder="Ex: 83999990000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                Nome do Titular da Conta Pix
              </label>
              <input
                id="input-central-pix-name"
                type="text"
                value={formSettings.centralPixName}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, centralPixName: e.target.value })
                }
                placeholder="Ex: Central Nexo Viagens"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1.5">
                WhatsApp Oficial do Suporte da Central
              </label>
              <input
                id="input-central-whatsapp"
                type="text"
                value={formSettings.centralWhatsApp}
                onChange={(e) =>
                  setFormSettings({ ...formSettings, centralWhatsApp: e.target.value })
                }
                placeholder="83988887777"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showSaveSuccess && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" />
                Configurações e taxas da Central salvas com sucesso!
              </span>
            )}
          </div>

          <button
            id="btn-save-settings"
            type="submit"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/25 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Configurações & Taxas</span>
          </button>
        </div>
      </form>

      {/* Zona de Manutenção / Reset */}
      <div className="bg-slate-900 border border-rose-900/40 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2.5 text-rose-400 pb-2 border-b border-slate-800">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="font-bold text-white text-base">Zerar Dados & Começar Testes</h3>
        </div>

        <p className="text-xs text-slate-400">
          Para realizar testes limpos sem nenhum histórico falso, você pode zerar as viagens, recargas e saques, mantendo as configurações operacionais da Central.
        </p>

        <button
          id="btn-open-reset-modal"
          type="button"
          onClick={() => setShowResetModal(true)}
          className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>Zerar Banco de Dados para Novos Testes</span>
        </button>
      </div>

      {/* Modal: Reset Confirmation */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-7 h-7 shrink-0" />
              <div>
                <h3 className="font-bold text-white text-base">Tem certeza que deseja zerar os dados?</h3>
                <p className="text-xs text-slate-400">Esta ação apagará todas as viagens, recargas e saques de teste.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Os passageiros e motoristas cadastrados serão mantidos para que você não precise recadastrá-los, mas seus saldos e históricos de viagens serão zerados.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResetData}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Confirmar e Zerar Tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
