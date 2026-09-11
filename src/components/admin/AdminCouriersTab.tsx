import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Courier, PixKeyType, PilotApprovalStatus } from '../../types';
import { DEFAULT_OPERATING_ZONES } from '../../mockData';
import {
  Car,
  Plus,
  Search,
  Phone,
  Edit2,
  DollarSign,
  Ban,
  Check,
  KeyRound,
  Copy,
  MessageCircle,
  CheckCircle2,
  User,
  Camera,
  Upload,
  Image as ImageIcon,
  QrCode,
  Power,
  ShieldCheck,
  Clock,
  MapPin,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

const DEFAULT_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&h=200&fit=crop&crop=faces',
];

export const AdminCouriersTab: React.FC = () => {
  const {
    couriers,
    criarEntregador,
    editarEntregador,
    toggleEntregadorStatus,
    toggleEntregadorOnline,
    autorizarPiloto,
    settings,
  } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'aprovado' | 'bloqueado'>('todos');
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingCourier, setEditingCourier] = useState<Courier | null>(null);
  const [credentialModalCourier, setCredentialModalCourier] = useState<Courier | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // New Pilot form fields
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCpf, setNewCpf] = useState('');
  const [newPlate, setNewPlate] = useState('');
  const [newZoneId, setNewZoneId] = useState('praca_1_centro');
  const [newApprovalStatus, setNewApprovalStatus] = useState<PilotApprovalStatus>('aprovado');
  const [newPix, setNewPix] = useState('');
  const [newPixType, setNewPixType] = useState<PixKeyType>('cpf');
  const [newPhotoUrl, setNewPhotoUrl] = useState<string>(DEFAULT_AVATARS[0]);
  const [newLoginUser, setNewLoginUser] = useState('');
  const [newPassword, setNewPassword] = useState('123456');

  const pendingCount = couriers.filter((c) => c.approvalStatus === 'pendente').length;
  const approvedCount = couriers.filter((c) => c.approvalStatus === 'aprovado' || (!c.approvalStatus && c.isApproved !== false)).length;
  const blockedCount = couriers.filter((c) => c.approvalStatus === 'bloqueado' || !c.active).length;

  const filteredCouriers = couriers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.cpf && c.cpf.includes(search)) ||
      (c.loginUsername && c.loginUsername.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'pendente') return c.approvalStatus === 'pendente';
    if (statusFilter === 'aprovado') return c.approvalStatus === 'aprovado' || (!c.approvalStatus && c.isApproved !== false);
    if (statusFilter === 'bloqueado') return c.approvalStatus === 'bloqueado' || !c.active;
    return true;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditing = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (isEditing && editingCourier) {
          setEditingCourier({ ...editingCourier, photoUrl: base64 });
        } else {
          setNewPhotoUrl(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim() || !newPix.trim()) return;

    const res = criarEntregador({
      name: newName.trim(),
      phone: newPhone.trim(),
      cpf: newCpf.trim() || undefined,
      vehicleType: 'moto', // ESTRITAMENTE APENAS MOTO
      vehiclePlate: newPlate.trim() || undefined,
      assignedZoneId: newZoneId,
      approvalStatus: newApprovalStatus,
      isApproved: newApprovalStatus === 'aprovado',
      pixKey: newPix.trim(),
      pixKeyType: newPixType,
      photoUrl: newPhotoUrl,
      loginUsername: newLoginUser.trim() || newPhone.replace(/\D/g, ''),
      password: newPassword.trim() || '123456',
      active: true,
      isOnline: newApprovalStatus === 'aprovado',
    });

    if (res.success && res.courier) {
      setCredentialModalCourier(res.courier);
    }

    // Reset Form
    setNewName('');
    setNewPhone('');
    setNewCpf('');
    setNewPlate('');
    setNewZoneId('praca_1_centro');
    setNewApprovalStatus('aprovado');
    setNewPix('');
    setNewPhotoUrl(DEFAULT_AVATARS[0]);
    setNewLoginUser('');
    setNewPassword('123456');
    setShowNewModal(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourier) return;

    editarEntregador(editingCourier.id, {
      name: editingCourier.name,
      phone: editingCourier.phone,
      cpf: editingCourier.cpf,
      vehicleType: 'moto',
      vehiclePlate: editingCourier.vehiclePlate,
      assignedZoneId: editingCourier.assignedZoneId,
      approvalStatus: editingCourier.approvalStatus,
      isApproved: editingCourier.approvalStatus === 'aprovado',
      pixKey: editingCourier.pixKey,
      pixKeyType: editingCourier.pixKeyType,
      photoUrl: editingCourier.photoUrl,
      loginUsername: editingCourier.loginUsername,
      password: editingCourier.password,
    });

    setEditingCourier(null);
  };

  const getWhatsAppAccessUrl = (courier: Courier) => {
    const cleanPhone = courier.phone.replace(/\D/g, '');
    const user = courier.loginUsername || courier.phone;
    const pass = courier.password || '123456';
    const appUrl = window.location.origin;
    const isPending = courier.approvalStatus === 'pendente';

    const text = `🚗 *Nexo Viagens - Alagoinha-PB*

Olá, *${courier.name}*! 
${
  isPending
    ? 'Seu cadastro de motorista foi recebido e está sendo analisado pela administração da Central para liberação de acesso.'
    : 'Seu cadastro de motorista foi AUTORIZADO com sucesso pela administração da Central!'
}

Acesse o portal da Nexo Viagens pelo seu celular:
🌐 *Link do App:* ${appUrl}

🔐 *SEUS DADOS DE ACESSO:*
👤 *Usuário/Telefone:* ${user}
🔑 *Senha Inicial:* ${pass}
🛵 *Veículo:* Moto ${courier.vehiclePlate ? `(Placa: ${courier.vehiclePlate})` : ''}
📍 *Ponto de Referência:* ${
      courier.assignedZoneId === 'praca_2_patio'
        ? 'Ponto 2 (Pátio de Festas)'
        : courier.assignedZoneId === 'praca_3_rural'
        ? 'Ponto 3 (Zona Rural / Sítios)'
        : 'Ponto 1 (Centro da Cidade)'
    }

${isPending ? '⏳ Assim que autorizado, você poderá ficar Online para aceitar viagens.' : '✅ Você já pode ficar Online e receber viagens em Alagoinha!'}`;

    return `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const copyCredentialsText = (courier: Courier) => {
    const user = courier.loginUsername || courier.phone;
    const pass = courier.password || '123456';
    const text = `Nexo Viagens Alagoinha - Motorista: ${courier.name}\nUsuário: ${user}\nSenha: ${pass}\nStatus: ${courier.approvalStatus?.toUpperCase() || 'APROVADO'}`;
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const getZoneBadge = (zoneId?: string) => {
    if (zoneId === 'praca_2_patio') {
      return {
        label: 'Ponto 2 - Pátio de Festas',
        color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      };
    }
    if (zoneId === 'praca_3_rural') {
      return {
        label: 'Ponto 3 - Zona Rural / Sítios',
        color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      };
    }
    return {
      label: 'Ponto 1 - Centro da Cidade',
      color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    };
  };

  return (
    <div className="space-y-4">
      {/* Alert if pilots are pending admin approval */}
      {pendingCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-sm text-white">
                {pendingCount} {pendingCount === 1 ? 'novo motorista aguardando sua autorização' : 'novos motoristas aguardando sua autorização'}!
              </p>
              <p className="text-xs text-amber-300/80">
                Motoristas recém-cadastrados só têm permissão para ficar online e aceitar viagens após você autorizar.
              </p>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter('pendente')}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 transition-colors cursor-pointer"
          >
            Ver Motoristas Pendentes ({pendingCount})
          </button>
        </div>
      )}

      {/* Action Header & Quick Status Filters */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-couriers"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por motorista, telefone, placa..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setStatusFilter('todos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'todos'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Todos ({couriers.length})
            </button>
            <button
              onClick={() => setStatusFilter('pendente')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'pendente'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-amber-400 hover:bg-amber-500/10 border border-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pendentes ({pendingCount})</span>
            </button>
            <button
              onClick={() => setStatusFilter('aprovado')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'aprovado'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-emerald-400 hover:bg-emerald-500/10 border border-slate-800'
              }`}
            >
              Autorizados ({approvedCount})
            </button>
            <button
              onClick={() => setStatusFilter('bloqueado')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'bloqueado'
                  ? 'bg-rose-500 text-white font-bold'
                  : 'bg-slate-950 text-rose-400 hover:bg-rose-500/10 border border-slate-800'
              }`}
            >
              Bloqueados ({blockedCount})
            </button>
          </div>
        </div>

        <button
          id="btn-open-new-courier"
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Motorista</span>
        </button>
      </div>

      {/* Pilots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCouriers.length === 0 ? (
          <div className="md:col-span-2 p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-3xl space-y-2">
            <Car className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">Nenhum motorista encontrado</p>
            <p className="text-xs text-slate-500">
              {statusFilter === 'pendente'
                ? 'Nenhum motorista está aguardando autorização no momento.'
                : 'Cadastre motoristas parceiros para atender as viagens e deslocamentos de Alagoinha.'}
            </p>
          </div>
        ) : (
          filteredCouriers.map((courier) => {
            const isPending = courier.approvalStatus === 'pendente';
            const isApproved = courier.approvalStatus === 'aprovado' || (!courier.approvalStatus && courier.isApproved !== false);
            const isBlocked = courier.approvalStatus === 'bloqueado' || !courier.active;
            const zone = getZoneBadge(courier.assignedZoneId);

            return (
              <div
                key={courier.id}
                className={`p-5 rounded-3xl border transition-all space-y-4 ${
                  isPending
                    ? 'bg-amber-950/25 border-amber-500/50 shadow-xl shadow-amber-500/5'
                    : isBlocked
                    ? 'bg-slate-900/60 border-rose-900/40 opacity-80'
                    : 'bg-slate-900 border-slate-800 hover:border-cyan-500/40 shadow-xl'
                }`}
              >
                {/* Header: Photo, Name, Ponto & Approval Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {courier.photoUrl ? (
                        <img
                          src={courier.photoUrl}
                          alt={courier.name}
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 rounded-2xl object-cover border border-cyan-500/40 shadow-md"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-lg">
                          {courier.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                          courier.isOnline ? 'bg-emerald-400' : 'bg-slate-600'
                        }`}
                        title={courier.isOnline ? 'Online' : 'Offline'}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-base leading-snug">{courier.name}</h3>
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="font-bold text-cyan-400 flex items-center gap-1">
                          <Car className="w-3.5 h-3.5" /> Veículo
                        </span>
                        {courier.vehiclePlate && (
                          <span className="font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 text-slate-300 text-[11px]">
                            {courier.vehiclePlate}
                          </span>
                        )}
                      </p>
                      <div className="mt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${zone.color}`}>
                          <MapPin className="w-3 h-3" />
                          {zone.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    {isPending ? (
                      <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center gap-1 animate-pulse">
                        <Clock className="w-3.5 h-3.5" />
                        Pendente de Autorização
                      </span>
                    ) : isBlocked ? (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40">
                        🚫 Bloqueado
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Autorizado
                      </span>
                    )}

                    <span className="text-[10px] text-slate-500 font-medium">
                      {courier.isOnline ? '🟢 Online / Disponível' : '⚪ Offline'}
                    </span>
                  </div>
                </div>

                {/* SPECIAL ADMIN APPROVAL ACTION BOX (When pending) */}
                {isPending && (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
                    <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Aguardando sua autorização para liberar acesso:</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      O motorista já concluiu o cadastro no app. Deseja autorizá-lo a aceitar viagens em Alagoinha?
                    </p>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => autorizarPiloto(courier.id, 'aprovado')}
                        className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Autorizar Motorista</span>
                      </button>
                      <button
                        onClick={() => autorizarPiloto(courier.id, 'bloqueado')}
                        className="py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Ban className="w-4 h-4" />
                        <span>Recusar / Bloquear</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Information Rows */}
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="text-white font-medium">{courier.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <QrCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate font-mono">Pix ({courier.pixKeyType.toUpperCase()}): {courier.pixKey}</span>
                  </div>
                  {courier.loginUsername && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>Login: <strong className="text-cyan-300 font-mono">{courier.loginUsername}</strong></span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Saldo Acumulado no Ciclo:</span>
                    <span className="font-black text-cyan-400 text-sm">
                      R$ {courier.accumulatedBalance.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Corridas Concluídas:</span>
                    <span className="font-bold text-slate-300 text-sm">
                      {courier.completedDeliveries} viagens
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                  <a
                    href={getWhatsAppAccessUrl(courier)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Enviar dados de acesso no WhatsApp do motorista"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-cyan-400" />
                    <span>WhatsApp</span>
                  </a>

                  <button
                    onClick={() => setCredentialModalCourier(courier)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Ver usuário e senha"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Acesso</span>
                  </button>

                  {/* Authorization Toggle for approved/blocked */}
                  {!isPending && (
                    <button
                      onClick={() => autorizarPiloto(courier.id, isApproved ? 'bloqueado' : 'aprovado')}
                      className={`px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                        isApproved
                          ? 'bg-slate-950 hover:bg-rose-500/20 border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-300'
                          : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-300 font-bold'
                      }`}
                      title={isApproved ? 'Revogar autorização / Bloquear' : 'Autorizar acesso do motorista'}
                    >
                      {isApproved ? <Ban className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                      <span>{isApproved ? 'Revogar' : 'Autorizar'}</span>
                    </button>
                  )}

                  {isApproved && (
                    <button
                      onClick={() => toggleEntregadorOnline(courier.id)}
                      className={`p-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                        courier.isOnline
                          ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      }`}
                      title={courier.isOnline ? 'Desconectar motorista' : 'Colocar motorista Online'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    onClick={() => setEditingCourier(courier)}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer ml-auto"
                    title="Editar dados do motorista"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: New Pilot Creation */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleCreate}
            className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Car className="w-6 h-6 text-cyan-400" />
                <div>
                  <h3 className="font-bold text-white text-lg">Cadastrar Motorista</h3>
                  <p className="text-xs text-cyan-400/80">Mobilidade Urbana • Central Alagoinha</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Photo Selection Section */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="block text-xs font-bold text-cyan-400">Foto do Motorista Parceiro:</span>
              <div className="flex items-center gap-4">
                <img
                  src={newPhotoUrl}
                  alt="Preview"
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-500 shadow-md"
                />
                <div className="space-y-2 flex-1">
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Upload de Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, false)}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-500">Ou escolha um avatar predefinido:</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1 overflow-x-auto">
                {DEFAULT_AVATARS.map((avatar, idx) => (
                  <img
                    key={idx}
                    src={avatar}
                    alt={`Avatar ${idx}`}
                    referrerPolicy="no-referrer"
                    onClick={() => setNewPhotoUrl(avatar)}
                    className={`w-9 h-9 rounded-xl object-cover cursor-pointer transition-transform hover:scale-105 border-2 ${
                      newPhotoUrl === avatar ? 'border-cyan-400 scale-105 shadow-md shadow-cyan-500/30' : 'border-transparent opacity-70'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1">Nome Completo do Motorista *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (!newLoginUser) {
                      const firstName = e.target.value.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
                      setNewLoginUser(firstName ? `motorista.${firstName}` : '');
                    }
                  }}
                  placeholder="Ex: Severino de Alagoinha"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Telefone / WhatsApp *</label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="(83) 99999-0000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">CPF do Motorista</label>
                <input
                  type="text"
                  value={newCpf}
                  onChange={(e) => setNewCpf(e.target.value)}
                  placeholder="000.000.000-00"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Veículo</label>
                <div className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 font-bold flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  <span>Veículo Cadastrado</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Placa do Veículo</label>
                <input
                  type="text"
                  value={newPlate}
                  onChange={(e) => setNewPlate(e.target.value)}
                  placeholder="Ex: NEX-2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 uppercase font-mono"
                />
              </div>

              {/* Ponto de Atuação */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Ponto de Referência Principal *</label>
                <select
                  value={newZoneId}
                  onChange={(e) => setNewZoneId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="praca_1_centro">Ponto 1 - Centro da Cidade</option>
                  <option value="praca_2_patio">Ponto 2 - Pátio de Festas / Saídas</option>
                  <option value="praca_3_rural">Ponto 3 - Zona Rural / Sítios</option>
                </select>
              </div>

              {/* Status de Autorização Inicial */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Autorização de Acesso *</label>
                <select
                  value={newApprovalStatus}
                  onChange={(e) => setNewApprovalStatus(e.target.value as PilotApprovalStatus)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="aprovado">Aprovado (Acesso Liberado Imediato)</option>
                  <option value="pendente">Pendente de Autorização</option>
                  <option value="bloqueado">Bloqueado</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Tipo da Chave Pix *</label>
                <select
                  value={newPixType}
                  onChange={(e) => setNewPixType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="cpf">CPF</option>
                  <option value="telefone">Telefone</option>
                  <option value="email">E-mail</option>
                  <option value="aleatoria">Chave Aleatória</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Chave Pix do Motorista *</label>
                <input
                  type="text"
                  value={newPix}
                  onChange={(e) => setNewPix(e.target.value)}
                  placeholder="Informe a chave Pix"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  required
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
                      placeholder="motorista.nome"
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
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                Salvar Motorista & Gerar Acesso
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Credentials Card & WhatsApp Share */}
      {credentialModalCourier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-cyan-400">
                <CheckCircle2 className="w-6 h-6" />
                <h3 className="font-bold text-white text-base">Acesso do Motorista</h3>
              </div>
              <button
                onClick={() => setCredentialModalCourier(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between pb-1.5 border-b border-slate-900">
                <span className="text-slate-400">Motorista:</span>
                <span className="font-bold text-white">{credentialModalCourier.name}</span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-900">
                <span className="text-slate-400">Usuário / Login:</span>
                <span className="font-mono font-bold text-cyan-300">
                  {credentialModalCourier.loginUsername || credentialModalCourier.phone}
                </span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-900">
                <span className="text-slate-400">Senha:</span>
                <span className="font-mono font-bold text-cyan-300">
                  {credentialModalCourier.password || '123456'}
                </span>
              </div>
              <div className="flex justify-between pb-1.5 border-b border-slate-900">
                <span className="text-slate-400">Status de Autorização:</span>
                <span className="font-bold text-amber-300 uppercase">
                  {credentialModalCourier.approvalStatus || 'APROVADO'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Chave Pix:</span>
                <span className="font-mono text-slate-300">
                  {credentialModalCourier.pixKey}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={getWhatsAppAccessUrl(credentialModalCourier)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Dados no WhatsApp do Motorista</span>
              </a>

              <button
                type="button"
                onClick={() => copyCredentialsText(credentialModalCourier)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Copy className="w-4 h-4 text-cyan-400" />
                <span>{copiedNotification ? 'Copiado com Sucesso!' : 'Copiar Usuário e Senha'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Pilot */}
      {editingCourier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleEditSubmit}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Edit2 className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Editar Motorista</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCourier(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Photo Section in Edit */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="block text-xs font-bold text-cyan-400">Foto do Motorista:</span>
              <div className="flex items-center gap-4">
                <img
                  src={editingCourier.photoUrl || DEFAULT_AVATARS[0]}
                  alt="Preview"
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-500 shadow-md"
                />
                <div className="space-y-2 flex-1">
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Trocar Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, true)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-300 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={editingCourier.name}
                  onChange={(e) => setEditingCourier({ ...editingCourier, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Telefone / WhatsApp *</label>
                <input
                  type="text"
                  value={editingCourier.phone}
                  onChange={(e) => setEditingCourier({ ...editingCourier, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">CPF</label>
                <input
                  type="text"
                  value={editingCourier.cpf || ''}
                  onChange={(e) => setEditingCourier({ ...editingCourier, cpf: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Placa do Veículo</label>
                <input
                  type="text"
                  value={editingCourier.vehiclePlate || ''}
                  onChange={(e) => setEditingCourier({ ...editingCourier, vehiclePlate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 uppercase font-mono"
                />
              </div>

              {/* Ponto */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Ponto de Referência Principal *</label>
                <select
                  value={editingCourier.assignedZoneId || 'praca_1_centro'}
                  onChange={(e) => setEditingCourier({ ...editingCourier, assignedZoneId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="praca_1_centro">Ponto 1 - Centro da Cidade</option>
                  <option value="praca_2_patio">Ponto 2 - Pátio de Festas / Saídas</option>
                  <option value="praca_3_rural">Ponto 3 - Zona Rural / Sítios</option>
                </select>
              </div>

              {/* Status de Autorização */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Status de Autorização *</label>
                <select
                  value={editingCourier.approvalStatus || 'aprovado'}
                  onChange={(e) => setEditingCourier({ ...editingCourier, approvalStatus: e.target.value as PilotApprovalStatus })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="aprovado">Aprovado (Autorizado)</option>
                  <option value="pendente">Pendente de Autorização</option>
                  <option value="bloqueado">Bloqueado</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Chave Pix *</label>
                <input
                  type="text"
                  value={editingCourier.pixKey}
                  onChange={(e) => setEditingCourier({ ...editingCourier, pixKey: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Senha de Acesso</label>
                <input
                  type="text"
                  value={editingCourier.password || ''}
                  onChange={(e) => setEditingCourier({ ...editingCourier, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingCourier(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 text-xs font-bold shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
