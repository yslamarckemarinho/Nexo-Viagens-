import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CreditRecharge } from '../../types';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  DollarSign,
  User,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

export const AdminCreditsTab: React.FC = () => {
  const { recharges, confirmarRecargaPix, recusarRecargaPix } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todas' | 'pendente' | 'confirmado' | 'recusado'>('todas');
  const [confirmingRecharge, setConfirmingRecharge] = useState<CreditRecharge | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [rejectingRecharge, setRejectingRecharge] = useState<CreditRecharge | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const filteredRecharges = recharges.filter((r) => {
    const matchesStatus = statusFilter === 'todas' || r.status === statusFilter;
    const matchesSearch =
      r.merchantName.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      (r.pixTransactionId && r.pixTransactionId.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmingRecharge) return;
    confirmarRecargaPix(confirmingRecharge.id, transactionId.trim() || undefined);
    setConfirmingRecharge(null);
    setTransactionId('');
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingRecharge) return;
    recusarRecargaPix(rejectingRecharge.id, rejectReason.trim() || 'Comprovante inválido ou Pix não identificado');
    setRejectingRecharge(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-recharges"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por passageiro ou comprovante..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            id="select-filter-recharge-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-auto px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="todas">Todos os Status ({recharges.length})</option>
            <option value="pendente">Pendentes de Confirmação</option>
            <option value="confirmado">Confirmados / Injetados</option>
            <option value="recusado">Recusados</option>
          </select>
        </div>
      </div>

      {/* Recharges List Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-sm sm:text-base">
              Recargas de Crédito via Pix dos Passageiros ({filteredRecharges.length})
            </h3>
          </div>
        </div>

        {filteredRecharges.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <CreditCard className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">Nenhuma solicitação de recarga encontrada</p>
            <p className="text-xs text-slate-500">Quando os passageiros efetuarem recargas via Pix, elas aparecerão aqui para conferência.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredRecharges.map((recharge) => (
              <div
                key={recharge.id}
                className="p-4 sm:p-5 hover:bg-slate-850/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm sm:text-base flex items-center gap-1.5">
                      <User className="w-4 h-4 text-cyan-400" />
                      {recharge.merchantName}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        recharge.status === 'confirmado'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : recharge.status === 'recusado'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {recharge.status === 'confirmado'
                        ? 'Confirmado'
                        : recharge.status === 'recusado'
                        ? 'Recusado'
                        : 'Aguardando Aprovação'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span className="text-emerald-400 font-black text-sm">
                      R$ {recharge.amountRequested.toFixed(2)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(recharge.createdAt).toLocaleString([], {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {recharge.pixTransactionId && (
                      <span className="font-mono text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                        Pix: {recharge.pixTransactionId}
                      </span>
                    )}
                  </div>
                </div>

                {recharge.status === 'pendente' && (
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      id={`btn-confirm-recharge-${recharge.id}`}
                      onClick={() => setConfirmingRecharge(recharge)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Confirmar Pix</span>
                    </button>
                    <button
                      id={`btn-reject-recharge-${recharge.id}`}
                      onClick={() => setRejectingRecharge(recharge)}
                      className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Recusar</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Confirm Recharge */}
      {confirmingRecharge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleConfirm}
            className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3 text-emerald-400 pb-2 border-b border-slate-800">
              <FileCheck className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-bold text-white text-base">Confirmar Recarga Pix</h3>
                <p className="text-xs text-slate-400">{confirmingRecharge.merchantName}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block mb-1">Valor a ser creditado:</span>
              <span className="text-3xl font-black text-emerald-400">
                R$ {confirmingRecharge.amountRequested.toFixed(2)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ID da Transação / Comprovante Pix (opcional):
              </label>
              <input
                id="input-confirm-txid"
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Ex: E123456782026..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmingRecharge(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                Aprovar & Injetar Crédito
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Reject Recharge */}
      {rejectingRecharge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleReject}
            className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3 text-rose-400 pb-2 border-b border-slate-800">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-bold text-white text-base">Recusar Recarga</h3>
                <p className="text-xs text-slate-400">{rejectingRecharge.merchantName}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Motivo da Recusa:
              </label>
              <textarea
                id="input-reject-recharge-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ex: Valor não caiu na conta bancária da Central ou comprovante incorreto."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-rose-500 min-h-[70px]"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingRecharge(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Confirmar Recusa
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
