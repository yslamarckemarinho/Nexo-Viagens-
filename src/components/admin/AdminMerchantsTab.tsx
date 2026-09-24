import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Merchant } from '../../types';
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  Edit2,
  DollarSign,
  Ban,
  Check,
  KeyRound,
  Copy,
  MessageCircle,
  CheckCircle2,
  User,
  ShieldAlert,
  Clock,
} from 'lucide-react';

export const AdminMerchantsTab: React.FC = () => {
  const {
    merchants,
    criarComercio,
    editarComercio,
    toggleComercioStatus,
    ajustarCreditoManual,
    confirmarPassageiro,
    settings,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed'>('all');
  const [search, setSearch] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [credentialModalMerchant, setCredentialModalMerchant] = useState<Merchant | null>(null);
  const [adjustingCreditMerchant, setAdjustingCreditMerchant] = useState<Merchant | null>(null);
  const [manualCreditAmount, setManualCreditAmount] = useState<number>(50);
  const [manualCreditReason, setManualCreditReason] = useState('Bônus inicial de boas-vindas');
  const [copiedNotification, setCopiedNotification] = useState(false);

  // New Merchant form fields
  const [newName, setNewName] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newPix, setNewPix] = useState('');
  const [newLoginUser, setNewLoginUser] = useState('');
  const [newPassword, setNewPassword] = useState('123456');
  const [newInitialCredit, setNewInitialCredit] = useState<number>(0);

  const pendingCount = merchants.filter((m) => m.status_cadastro === 'pendente').length;

  const filteredMerchants = merchants.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.ownerName && m.ownerName.toLowerCase().includes(search.toLowerCase())) ||
      m.phone.includes(search) ||
      (m.loginUsername && m.loginUsername.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'pending') {
      return m.status_cadastro === 'pendente';
    }
    if (statusFilter === 'confirmed') {
      return m.status_cadastro === 'confirmado' || (m.active && m.status_cadastro !== 'pendente');
    }
    return true;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim() || !newAddress.trim()) return;

    const res = criarComercio({
      name: newName.trim(),
      ownerName: newOwner.trim() || newName.trim(),
      phone: newPhone.trim(),
      address: newAddress.trim(),
      active: true,
      pixKey: newPix.trim() || undefined,
      loginUsername: newLoginUser.trim() || newPhone.replace(/\D/g, ''),
      password: newPassword.trim() || '123456',
      creditBalance: Number(newInitialCredit) || 0,
    });

    if (res.success && res.merchant) {
      setCredentialModalMerchant(res.merchant);
    }

    // Reset Form
    setNewName('');
    setNewOwner('');
    setNewPhone('');
    setNewAddress('');
    setNewPix('');
    setNewLoginUser('');
    setNewPassword('123456');
    setNewInitialCredit(0);
    setShowNewModal(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMerchant) return;

    editarComercio(editingMerchant.id, {
      name: editingMerchant.name,
      ownerName: editingMerchant.ownerName,
      phone: editingMerchant.phone,
      address: editingMerchant.address,
      pixKey: editingMerchant.pixKey,
      loginUsername: editingMerchant.loginUsername,
      password: editingMerchant.password,
    });

    setEditingMerchant(null);
  };

  const handleAdjustCredit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingCreditMerchant) return;

    ajustarCreditoManual(
      adjustingCreditMerchant.id,
      Number(manualCreditAmount) || 0,
      manualCreditReason.trim() || 'Ajuste manual pela Central'
    );

    setAdjustingCreditMerchant(null);
  };

  const getWhatsAppAccessUrl = (merchant: Merchant) => {
    const cleanPhone = merchant.phone.replace(/\D/g, '');
    const user = merchant.loginUsername || merchant.phone;
    const pass = merchant.password || '123456';
    const appUrl = window.location.origin;

    const text = `🚗 *Bem-vindo(a) à Nexo Viagens - Alagoinha-PB!*

Olá, *${merchant.name}*! O seu cadastro de passageiro foi confirmado pela Central Nexo Viagens.

Acesse o portal da Nexo Viagens para solicitar suas viagens e deslocamentos:
🌐 *Link de Acesso:* ${appUrl}

🔐 *SEUS DADOS DE ACESSO:*
👤 *Usuário/Telefone:* ${user}
🔑 *Senha Inicial:* ${pass}
💰 *Saldo Inicial de Crédito:* R$ ${merchant.creditBalance.toFixed(2)}

Qualquer dúvida, estamos à disposição na Central Nexo Viagens!`;

    return `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const copyCredentialsText = (merchant: Merchant) => {
    const user = merchant.loginUsername || merchant.phone;
    const pass = merchant.password || '123456';
    const text = `Nexo Viagens - Passageiro: ${merchant.name}\nUsuário: ${user}\nSenha: ${pass}`;
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-merchants"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por passageiro, telefone ou usuário..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
          />
        </div>

        <button
          id="btn-open-new-merchant"
          onClick={() => setShowNewModal(true)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Passageiro</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          Todos ({merchants.length})
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('pending')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            statusFilter === 'pending'
              ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-sm'
              : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-amber-300'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Aguardando Confirmação ({pendingCount})</span>
          {pendingCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('confirmed')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            statusFilter === 'confirmed'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-emerald-300'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Confirmados / Ativos ({merchants.length - pendingCount})</span>
        </button>
      </div>

      {/* Merchants Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMerchants.length === 0 ? (
          <div className="md:col-span-2 p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">Nenhum passageiro encontrado</p>
            <p className="text-xs text-slate-500">Cadastre os passageiros de Alagoinha para gerenciar créditos e viagens.</p>
          </div>
        ) : (
          filteredMerchants.map((merchant) => (
            <div
              key={merchant.id}
              className={`p-5 rounded-3xl border transition-all space-y-4 ${
                merchant.status_cadastro === 'pendente'
                  ? 'bg-amber-950/20 border-amber-500/40 shadow-xl'
                  : merchant.active
                  ? 'bg-slate-900 border-slate-800 hover:border-cyan-500/40 shadow-xl'
                  : 'bg-slate-900/60 border-rose-900/40 opacity-80'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  {merchant.photoUrl || merchant.foto_url ? (
                    <img
                      src={merchant.photoUrl || merchant.foto_url}
                      alt={merchant.name}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-cyan-400 shrink-0 shadow-md"
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center font-black text-lg ${
                      merchant.status_cadastro === 'pendente'
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                        : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                    }`}>
                      {merchant.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-white text-base leading-snug">{merchant.name}</h3>
                    <p className="text-xs text-slate-400">{merchant.ownerName || 'Passageiro'}</p>
                  </div>
                </div>

                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    merchant.status_cadastro === 'pendente'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                      : merchant.active
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {merchant.status_cadastro === 'pendente'
                    ? 'Aguardando Confirmação'
                    : merchant.active
                    ? 'Confirmado / Ativo'
                    : 'Bloqueado'}
                </span>
              </div>

              {/* Se o cadastro estiver pendente, exibir card de ação direta para a Central */}
              {merchant.status_cadastro === 'pendente' && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 text-amber-300 text-xs font-semibold">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Cadastro solicitado pelo app. Confirme para liberar recarga e viagens.</span>
                  </div>
                  <button
                    onClick={() => confirmarPassageiro(merchant.id, 'Central ADM')}
                    className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer shrink-0"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirmar Cadastro</span>
                  </button>
                </div>
              )}

              {/* Information Rows */}
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-2 text-slate-400">
                  <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="text-white font-medium">{merchant.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{merchant.address}</span>
                </div>
                {merchant.loginUsername && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Usuário: <strong className="text-cyan-300 font-mono">{merchant.loginUsername}</strong></span>
                  </div>
                )}
              </div>

              {/* Balances */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Saldo de Crédito:</span>
                  <span className="font-black text-cyan-300 text-sm">
                    R$ {merchant.creditBalance.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Total Gasto em Viagens:</span>
                  <span className="font-bold text-slate-300 text-sm">
                    R$ {merchant.totalSpent.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                <a
                  href={getWhatsAppAccessUrl(merchant)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Enviar link de login e senha no WhatsApp do passageiro"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Enviar Acesso</span>
                </a>

                <button
                  onClick={() => setCredentialModalMerchant(merchant)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Ver credenciais"
                >
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Credenciais</span>
                </button>

                <button
                  onClick={() => setAdjustingCreditMerchant(merchant)}
                  className="px-2.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Ajustar créditos manualmente"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Crédito</span>
                </button>

                <button
                  onClick={() => setEditingMerchant(merchant)}
                  className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Editar dados"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => toggleComercioStatus(merchant.id)}
                  className={`p-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                    merchant.active
                      ? 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 text-rose-400'
                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                  }`}
                  title={merchant.active ? 'Bloquear passageiro' : 'Ativar passageiro'}
                >
                  {merchant.active ? <Ban className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: New Merchant Creation */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleCreate}
            className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Users className="w-6 h-6 text-cyan-400" />
                <h3 className="font-bold text-white text-lg">Cadastrar Passageiro na Central</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1">Nome Completo do Passageiro *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (!newLoginUser) {
                      setNewLoginUser(e.target.value.toLowerCase().replace(/\s+/g, ''));
                    }
                  }}
                  placeholder="Ex: Maria José de Alagoinha"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Ponto de Referência / Apelido</label>
                <input
                  type="text"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  placeholder="Ex: Próximo à Matriz"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Telefone / WhatsApp *</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="(83) 98888-0000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1">Endereço Completo em Alagoinha-PB *</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="Ex: Rua Central, 120, Centro"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Chave Pix (opcional)</label>
                <input
                  type="text"
                  value={newPix}
                  onChange={(e) => setNewPix(e.target.value)}
                  placeholder="Chave Pix para referências"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Saldo Inicial de Créditos (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={newInitialCredit}
                  onChange={(e) => setNewInitialCredit(Number(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-bold"
                />
              </div>

              {/* CREDENCIAIS CRIADAS PELA CENTRAL */}
              <div className="sm:col-span-2 p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 space-y-3">
                <div className="flex items-center gap-2 text-cyan-300 font-bold">
                  <KeyRound className="w-4 h-4" />
                  <span>Definição de Credenciais de Acesso (Geradas pela Central)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Usuário / Login *</label>
                    <input
                      type="text"
                      value={newLoginUser}
                      onChange={(e) => setNewLoginUser(e.target.value)}
                      placeholder="usuario.passageiro"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Senha de Acesso *</label>
                    <input
                      type="text"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="123456"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                Salvar & Gerar Acesso
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Credentials Card & WhatsApp Share */}
      {credentialModalMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-cyan-400">
                <CheckCircle2 className="w-6 h-6" />
                <h3 className="font-bold text-white text-base">Credenciais de Acesso do Passageiro</h3>
              </div>
              <button
                onClick={() => setCredentialModalMerchant(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between pb-1.5 border-b border-slate-900">
                <span className="text-slate-400">Passageiro:</span>
                <span className="font-bold text-white">{credentialModalMerchant.name}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-900">
                <span className="text-slate-400">WhatsApp:</span>
                <span className="font-bold text-white">{credentialModalMerchant.phone}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-900">
                <span className="text-slate-400">Usuário / Login:</span>
                <span className="font-mono font-bold text-cyan-300">
                  {credentialModalMerchant.loginUsername || credentialModalMerchant.phone}
                </span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-900">
                <span className="text-slate-400">Senha:</span>
                <span className="font-mono font-bold text-cyan-300">
                  {credentialModalMerchant.password || '123456'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Saldo de Crédito:</span>
                <span className="font-bold text-emerald-400">
                  R$ {credentialModalMerchant.creditBalance.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={getWhatsAppAccessUrl(credentialModalMerchant)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Dados no WhatsApp do Passageiro</span>
              </a>

              <button
                type="button"
                onClick={() => copyCredentialsText(credentialModalMerchant)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Copy className="w-4 h-4 text-cyan-400" />
                <span>{copiedNotification ? 'Copiado com Sucesso!' : 'Copiar Usuário e Senha'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Merchant */}
      {editingMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleEditSubmit}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Edit2 className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Editar Passageiro</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingMerchant(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={editingMerchant.name}
                  onChange={(e) => setEditingMerchant({ ...editingMerchant, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Ponto de Referência / Apelido</label>
                <input
                  type="text"
                  value={editingMerchant.ownerName || ''}
                  onChange={(e) => setEditingMerchant({ ...editingMerchant, ownerName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Telefone / WhatsApp *</label>
                <input
                  type="text"
                  value={editingMerchant.phone}
                  onChange={(e) => setEditingMerchant({ ...editingMerchant, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1">Endereço *</label>
                <input
                  type="text"
                  value={editingMerchant.address}
                  onChange={(e) => setEditingMerchant({ ...editingMerchant, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Usuário / Login</label>
                <input
                  type="text"
                  value={editingMerchant.loginUsername || ''}
                  onChange={(e) => setEditingMerchant({ ...editingMerchant, loginUsername: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Senha de Acesso</label>
                <input
                  type="text"
                  value={editingMerchant.password || ''}
                  onChange={(e) => setEditingMerchant({ ...editingMerchant, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingMerchant(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold cursor-pointer"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Manual Credit Adjustment */}
      {adjustingCreditMerchant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleAdjustCredit}
            className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3 text-cyan-400 pb-2 border-b border-slate-800">
              <DollarSign className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-bold text-white text-base">Ajuste Manual de Crédito</h3>
                <p className="text-xs text-slate-400">{adjustingCreditMerchant.name}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex justify-between items-center">
              <span className="text-slate-400">Saldo Atual:</span>
              <span className="font-bold text-cyan-300 text-sm">
                R$ {adjustingCreditMerchant.creditBalance.toFixed(2)}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Valor do Ajuste (use valor negativo para debitar):
              </label>
              <input
                type="number"
                step="1"
                value={manualCreditAmount}
                onChange={(e) => setManualCreditAmount(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-sm focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Motivo / Justificativa do Ajuste:
              </label>
              <input
                type="text"
                value={manualCreditReason}
                onChange={(e) => setManualCreditReason(e.target.value)}
                placeholder="Ex: Bonificação promocional, acerto no balcão"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdjustingCreditMerchant(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold cursor-pointer"
              >
                Confirmar Ajuste
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
