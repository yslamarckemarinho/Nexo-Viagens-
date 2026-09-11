import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Withdrawal } from '../../types';
import {
  DollarSign,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Car,
  QrCode,
  AlertCircle,
  FileCheck,
  Percent,
} from 'lucide-react';

export const AdminWithdrawalsTab: React.FC = () => {
  const { withdrawals, confirmarPagamentoSaque, recusarSaque, settings } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todas' | 'aguardando_pagamento' | 'pago' | 'recusado'>('todas');
  const [payingWithdrawal, setPayingWithdrawal] = useState<Withdrawal | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [rejectingWithdrawal, setRejectingWithdrawal] = useState<Withdrawal | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const filteredWithdrawals = withdrawals.filter((w) => {
    const matchesStatus = statusFilter === 'todas' || w.status === statusFilter;
    const matchesSearch =
      w.courierName.toLowerCase().includes(search.toLowerCase()) ||
      w.id.toLowerCase().includes(search.toLowerCase()) ||
      w.pixKey.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleConfirmPay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingWithdrawal) return;
    confirmarPagamentoSaque(payingWithdrawal.id, transactionId.trim() || undefined);
    setPayingWithdrawal(null);
    setTransactionId('');
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingWithdrawal) return;
    recusarSaque(rejectingWithdrawal.id, rejectReason.trim() || 'Chave Pix inválida ou dados incorretos');
    setRejectingWithdrawal(null);
    setRejectReason('');
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-withdrawals"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por motorista ou chave Pix..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            id="select-filter-withdrawal-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-auto px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="todas">Todos os Saques ({withdrawals.length})</option>
            <option value="aguardando_pagamento">Aguardando Pagamento</option>
            <option value="pago">Pagos via Pix</option>
            <option value="recusado">Recusados</option>
          </select>
        </div>
      </div>

      {/* Withdrawals List Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-sm sm:text-base">
              Solicitações de Repasse Pix para Motoristas ({filteredWithdrawals.length})
            </h3>
          </div>
        </div>

        {filteredWithdrawals.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <DollarSign className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">Nenhum saque solicitado ainda</p>
            <p className="text-xs text-slate-500">
              Conforme os motoristas completarem suas viagens e corridas, as solicitações de transferência aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredWithdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="p-4 sm:p-5 hover:bg-slate-855/50 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm sm:text-base flex items-center gap-1.5">
                      <Car className="w-4 h-4 text-emerald-400" />
                      {withdrawal.courierName}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        withdrawal.status === 'pago'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : withdrawal.status === 'recusado'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {withdrawal.status === 'pago'
                        ? 'Pago via Pix'
                        : withdrawal.status === 'recusado'
                        ? 'Recusado'
                        : 'Pendente de Pagamento'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-300">
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 block text-[11px]">Total Bruto Acumulado:</span>
                      <span className="font-bold text-slate-200">R$ {withdrawal.grossAmount.toFixed(2)}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 block text-[11px]">Comissão Central ({(withdrawal.centralFeePercentage * 100).toFixed(0)}%):</span>
                      <span className="font-bold text-cyan-400">R$ {withdrawal.centralFeeAmount.toFixed(2)}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 block text-[11px]">Valor Líquido a Transferir:</span>
                      <span className="font-black text-emerald-400 text-sm">R$ {withdrawal.netAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1 font-mono text-cyan-300">
                      <QrCode className="w-3.5 h-3.5" />
                      Pix ({withdrawal.pixKeyType.toUpperCase()}): {withdrawal.pixKey}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(withdrawal.createdAt).toLocaleString([], {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {withdrawal.pixTransactionId && (
                      <span className="font-mono text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                        Comprovante: {withdrawal.pixTransactionId}
                      </span>
                    )}
                  </div>
                </div>

                {withdrawal.status === 'aguardando_pagamento' && (
                  <div className="flex items-center gap-2 justify-end pt-2 lg:pt-0">
                    <button
                      id={`btn-pay-withdrawal-${withdrawal.id}`}
                      onClick={() => setPayingWithdrawal(withdrawal)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Confirmar Pagamento Pix</span>
                    </button>
                    <button
                      id={`btn-reject-withdrawal-${withdrawal.id}`}
                      onClick={() => setRejectingWithdrawal(withdrawal)}
                      className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
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

      {/* Modal: Confirm Payment */}
      {payingWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleConfirmPay}
            className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3 text-emerald-400 pb-2 border-b border-slate-800">
              <FileCheck className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-bold text-white text-base">Confirmar Pagamento de Saque</h3>
                <p className="text-xs text-slate-400">{payingWithdrawal.courierName}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-center">
              <span className="text-xs text-slate-400 block">Transferir para a Chave Pix:</span>
              <p className="text-sm font-mono font-bold text-cyan-300 break-all">{payingWithdrawal.pixKey}</p>
              <div className="pt-2 border-t border-slate-900">
                <span className="text-xs text-slate-400 block mb-1">Valor Líquido:</span>
                <span className="text-3xl font-black text-emerald-400">
                  R$ {payingWithdrawal.netAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                ID do Comprovante Pix do Banco (opcional):
              </label>
              <input
                id="input-confirm-withdrawal-txid"
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
                onClick={() => setPayingWithdrawal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                Confirmar Saque Pago
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Reject Withdrawal */}
      {rejectingWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleReject}
            className="bg-slate-900 border border-rose-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3 text-rose-400 pb-2 border-b border-slate-800">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-bold text-white text-base">Recusar Solicitação de Saque</h3>
                <p className="text-xs text-slate-400">{rejectingWithdrawal.courierName}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Motivo da Recusa:
              </label>
              <textarea
                id="input-reject-withdrawal-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ex: Chave Pix informada está incorreta ou banco rejeitou a transferência."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-rose-500 min-h-[70px]"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingWithdrawal(null)}
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
