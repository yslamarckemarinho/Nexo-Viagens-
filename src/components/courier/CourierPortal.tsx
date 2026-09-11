import React, { useState, useEffect, useRef } from 'react';
import { useApp, getStatusBadgeClasses, getStatusDescription } from '../../context/AppContext';
import { Delivery, PixKeyType } from '../../types';
import { getZoneBadgeDetails } from '../../utils/routeIntelligence';
import { generateMapsNavigationUrl, cleanWhatsAppNumber } from '../../utils/whatsapp';
import {
  Car,
  Power,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Navigation,
  ArrowRight,
  Sparkles,
  DollarSign,
  AlertTriangle,
  Send,
  MessageSquare,
  Check,
  ChevronRight,
  Package,
  History,
  ShieldCheck,
  Info,
  LogOut,
  QrCode,
  CheckCircle2,
  TrendingUp,
  Wallet,
  Route,
  Key,
  ExternalLink,
  RefreshCw,
  X,
  CreditCard,
  Bell,
  Radio,
  ShieldAlert,
  Compass,
  Moon,
  Sun,
  Share2,
  FileText,
} from 'lucide-react';
import { RideChatModal } from '../common/RideChatModal';
import { RideSosModal } from '../common/RideSosModal';
import {
  solicitarPermissaoNotificacao,
  enviarNotificacaoWeb,
  tocarAlertaChamado,
} from '../../utils/notifications';
import { detectarPracaMaisProxima, gerarUrlGoogleMapsRota } from '../../utils/geofencing';

export const CourierPortal: React.FC = () => {
  const {
    currentCourier,
    deliveries,
    withdrawals,
    settings,
    pracas,
    aceitarEntrega,
    avancarStatusEntrega,
    atualizarTelemetriaGps,
    confirmarRetornoDinheiroEntregador,
    solicitarSaque,
    toggleEntregadorOnline,
    enviarMensagemChat,
    acionarSos,
    obterPosicaoFilaMototaxista,
    atualizarPracaMototaxista,
    confirmarPresencaNaFila,
    logout,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'operacao' | 'ganhos' | 'historico'>('operacao');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [pixKeyInput, setPixKeyInput] = useState(currentCourier?.pixKey || '');
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>(currentCourier?.pixKeyType || 'cpf');
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [presencaConfirmada, setPresencaConfirmada] = useState(false);

  // Sugestão 3: Modo Noturno / Alto Contraste para Rua / Sol Forte
  const [highContrastMode, setHighContrastMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nexo_courier_high_contrast') === 'true';
    } catch {
      return false;
    }
  });

  const toggleHighContrast = () => {
    const next = !highContrastMode;
    setHighContrastMode(next);
    try {
      localStorage.setItem('nexo_courier_high_contrast', String(next));
    } catch {}
  };

  // PIN validation state
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState(false);

  // Chat & SOS Modals
  const [showChatModal, setShowChatModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);

  // Push & Geofencing states
  const [pushEnabled, setPushEnabled] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted'
  );
  const [geoLocating, setGeoLocating] = useState(false);
  const [geoMessage, setGeoMessage] = useState<string | null>(null);

  if (!currentCourier) {
    return (
      <div className="max-w-md mx-auto p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl mt-12 text-white space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold">Nenhum Motorista Conectado</h2>
        <p className="text-slate-400 text-sm">
          Por favor, faça login com seu usuário e senha fornecidos pela Central Nexo Viagens.
        </p>
        <button
          onClick={logout}
          className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm cursor-pointer"
        >
          Ir para Login
        </button>
      </div>
    );
  }

  // Active delivery currently assigned to this courier
  const myActiveDelivery = deliveries.find(
    (d) =>
      d.courierId === currentCourier.id &&
      d.status !== 'concluida' &&
      d.status !== 'cancelada'
  );

  // Telemetria GPS em Tempo Real - Loop Inteligente de 15 Segundos
  const [gpsPingAtivo, setGpsPingAtivo] = useState(false);
  const [ultimoSinalGps, setUltimoSinalGps] = useState<Date | null>(null);
  const [segundosProximoPing, setSegundosProximoPing] = useState<number>(15);

  const transmitirLocalizacaoAtual = () => {
    if (!myActiveDelivery) return;
    setGpsPingAtivo(true);

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, heading, speed } = position.coords;
          setUltimoSinalGps(new Date());
          setSegundosProximoPing(15);
          atualizarTelemetriaGps(myActiveDelivery.id, {
            courierLat: latitude,
            courierLng: longitude,
            heading: heading || undefined,
            speed: speed ? Math.round(speed * 3.6) : undefined,
          });
          setGpsPingAtivo(false);
        },
        () => {
          // Fallback com coordenadas da praça de origem se permissão ou sinal oscilar
          const praca = pracas.find((p) => p.id === currentCourier.assignedZoneId);
          const fallbackLat = myActiveDelivery.currentCourierLat || praca?.latitude || -6.9535;
          const fallbackLng = myActiveDelivery.currentCourierLng || praca?.longitude || -35.5463;
          setUltimoSinalGps(new Date());
          setSegundosProximoPing(15);
          atualizarTelemetriaGps(myActiveDelivery.id, {
            courierLat: fallbackLat,
            courierLng: fallbackLng,
          });
          setGpsPingAtivo(false);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
      );
    }
  };

  useEffect(() => {
    if (!myActiveDelivery || !currentCourier?.isOnline) return;

    // Dispara primeira telemetria
    transmitirLocalizacaoAtual();

    // Intervalo de transmissão contínua a cada 15 segundos
    const intervalId = setInterval(() => {
      transmitirLocalizacaoAtual();
    }, 15000);

    // Cronômetro regressivo para feedback visual
    const timerId = setInterval(() => {
      setSegundosProximoPing((prev) => (prev <= 1 ? 15 : prev - 1));
    }, 1000);

    return () => {
      clearInterval(intervalId);
      clearInterval(timerId);
    };
  }, [myActiveDelivery?.id, currentCourier?.isOnline]);

  // Available new requests waiting for any courier
  const availableDeliveries = deliveries.filter(
    (d) => d.status === 'aguardando_entregador' || d.status === 'solicitada'
  );

  // Completed deliveries by this courier
  const myCompletedDeliveries = deliveries.filter(
    (d) => d.courierId === currentCourier.id && d.status === 'concluida'
  );

  // Deliveries completed by this courier that still need cash return to merchant
  const myPendingCashReturns = deliveries.filter(
    (d) =>
      d.courierId === currentCourier.id &&
      d.needsCashReturnToMerchant &&
      d.cashReturnStatus !== 'devolvido'
  );

  // My withdrawals
  const myWithdrawals = withdrawals.filter((w) => w.courierId === currentCourier.id);

  // Financial calculations
  const accumulated = currentCourier.accumulatedBalance || 0;
  const centralFeeEstimated = accumulated * (settings.centralFeePercentage || 0.15);
  const netEstimated = accumulated - centralFeeEstimated;

  // Sugestão 2: Fechamento de Caixa Diário
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const todayCompletedDeliveries = myCompletedDeliveries.filter((d) => {
    const dDate = d.deliveredAt ? new Date(d.deliveredAt).toISOString().slice(0, 10) : '';
    return dDate === todayDateStr;
  });
  const todayGross = todayCompletedDeliveries.reduce((sum, d) => sum + d.deliveryFee, 0);
  const todayCentralFee = todayGross * (settings.centralFeePercentage || 0.15);
  const todayNet = todayGross - todayCentralFee;

  const handleExportarFechamentoWhatsApp = () => {
    const dateFormatted = new Date().toLocaleDateString('pt-BR');
    const text =
      `🏁 *FECHAMENTO DIÁRIO DE CAIXA - NEXO VIAGENS ALAGOINHA*\n` +
      `👤 *Motorista Parceiro:* ${currentCourier.name}\n` +
      `📱 *Contato:* ${currentCourier.phone || 'Sem telefone'}\n` +
      `📅 *Data do Fechamento:* ${dateFormatted}\n\n` +
      `🛵 *Total de Viagens Concluídas Hoje:* ${todayCompletedDeliveries.length}\n` +
      `💰 *Total Bruto Movimentado:* R$ ${todayGross.toFixed(2)}\n` +
      `🏢 *Taxa Central Nexo (${((settings.centralFeePercentage || 0.15) * 100).toFixed(0)}%):* R$ ${todayCentralFee.toFixed(2)}\n` +
      `✅ *Líquido do Piloto Hoje:* R$ ${todayNet.toFixed(2)}\n\n` +
      `_Fechamento gerado automaticamente pelo App Nexo Viagens Alagoinha-PB._`;

    const centralNumber = cleanWhatsAppNumber(settings.centralWhatsapp || '83999999999');
    window.open(`https://wa.me/${centralNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleConfirmPin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    if (!myActiveDelivery) return;

    if (!pinInput || pinInput.trim().length !== 4) {
      setPinError('Informe os 4 dígitos do código PIN fornecido pelo cliente.');
      return;
    }

    const result = avancarStatusEntrega(myActiveDelivery.id, 'courier', pinInput.trim());
    if (result.success) {
      setPinSuccess(true);
      setTimeout(() => {
        setShowPinModal(false);
        setPinSuccess(false);
        setPinInput('');
      }, 1000);
    } else {
      setPinError(result.error || 'Código PIN incorreto! Verifique com o cliente ou chame a loja.');
    }
  };

  const handleWithdrawRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);

    if (!pixKeyInput.trim()) {
      setWithdrawError('Por favor, informe sua Chave Pix para receber o repasse.');
      return;
    }

    if (accumulated <= 0) {
      setWithdrawError('Você precisa ter saldo acumulado para solicitar um saque.');
      return;
    }

    const res = solicitarSaque(currentCourier.id, pixKeyInput.trim(), pixKeyType);
    if (res.success) {
      setWithdrawSuccess(true);
      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawSuccess(false);
        setActiveTab('ganhos');
      }, 2000);
    } else {
      setWithdrawError(res.error || 'Erro ao solicitar saque.');
    }
  };

  // Fila Virtual FIFO Status
  const filaStatus = currentCourier ? obterPosicaoFilaMototaxista(currentCourier.id) : null;

  // Auto-Detecção Geofencing via GPS
  const handleDetectarLocalizacaoGps = () => {
    if (!navigator.geolocation) {
      setGeoMessage('Geolocalização não suportada neste dispositivo.');
      return;
    }
    setGeoLocating(true);
    setGeoMessage(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLocating(false);
        const result = detectarPracaMaisProxima(
          pos.coords.latitude,
          pos.coords.longitude,
          pracas,
          450
        );
        if (result.dentroDePraca && result.pracaDetectada) {
          atualizarPracaMototaxista(currentCourier.id, result.pracaDetectada.id);
          setGeoMessage(
            `✅ Detectado na ${result.pracaDetectada.nome} (~${result.distanciaMetros}m). Você entrou na fila virtual desta praça!`
          );
        } else {
          setGeoMessage(`ℹ️ ${result.mensagem}`);
        }
      },
      (err) => {
        setGeoLocating(false);
        setGeoMessage(`Não foi possível ler o GPS (${err.message}). Selecione sua praça.`);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Solicitar Notificações Web e Push
  const handleAtivarNotificacoes = async () => {
    const ok = await solicitarPermissaoNotificacao();
    setPushEnabled(ok);
    if (ok) {
      enviarNotificacaoWeb('Nexo Viagens Alagoinha', {
        body: 'Notificações sonoras e avisos de chamados ativados com sucesso!',
      });
      tocarAlertaChamado();
    }
  };

  const getNextActionLabel = (status: string, serviceCategory?: string) => {
    const isPassageiro = serviceCategory === 'passageiro';

    switch (status) {
      case 'entregador_aceitou':
        return {
          label: isPassageiro ? '1. A Caminho do Embarque' : '1. A Caminho da Coleta',
          nextStep: 'a_caminho_coleta',
          color: 'bg-cyan-500 hover:bg-cyan-400 text-slate-950',
        };
      case 'a_caminho_coleta':
        return {
          label: isPassageiro ? '2. Cheguei / Passageiro Embarcou' : '2. Cheguei / Pedido Coletado',
          nextStep: 'pedido_coletado',
          color: 'bg-blue-600 hover:bg-blue-500 text-white',
        };
      case 'pedido_coletado':
        return {
          label: isPassageiro ? '3. Em Viagem ao Destino' : '3. A Caminho da Entrega',
          nextStep: 'a_caminho_entrega',
          color: 'bg-indigo-600 hover:bg-indigo-500 text-white',
        };
      case 'a_caminho_entrega':
        return {
          label: isPassageiro ? '4. Concluir Desembarque ✅' : '4. Concluir Entrega ✅',
          nextStep: 'concluida',
          color: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black',
        };
      default:
        return { label: 'Avançar Status', nextStep: 'concluida', color: 'bg-slate-700 hover:bg-slate-600 text-white' };
    }
  };

  return (
    <div className={`min-h-screen ${highContrastMode ? 'bg-black text-amber-200' : 'bg-slate-950 text-slate-100'} flex flex-col font-sans pb-20 sm:pb-8 transition-colors`}>
      {/* Top Header */}
      <header className={`sticky top-0 z-40 ${highContrastMode ? 'bg-black border-amber-500/40' : 'bg-slate-900/95 border-slate-800'} backdrop-blur-md border-b`}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              {currentCourier.photoUrl ? (
                <img
                  src={currentCourier.photoUrl}
                  alt={currentCourier.name}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-2xl object-cover border border-emerald-500/40 shadow-md"
                />
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black">
                  {currentCourier.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span
                className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                  currentCourier.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-white text-sm sm:text-base leading-tight">
                  {currentCourier.name}
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 capitalize flex items-center gap-1.5">
                <span>{currentCourier.vehicleType}</span>
                {currentCourier.vehiclePlate && <span>• {currentCourier.vehiclePlate}</span>}
                <span>• Alagoinha-PB</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sugestão 3: Modo Noturno / Alto Contraste para Rua & Sol Forte */}
            <button
              type="button"
              onClick={toggleHighContrast}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                highContrastMode
                  ? 'bg-amber-400 text-black border-amber-300 shadow-lg shadow-amber-400/30'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Modo Alto Contraste para Sol Forte ou Pilotagem Noturna"
            >
              {highContrastMode ? <Sun className="w-3.5 h-3.5 text-black" /> : <Moon className="w-3.5 h-3.5 text-amber-400" />}
              <span className="hidden sm:inline">{highContrastMode ? 'Contraste: ON' : 'Modo Sol / Rua'}</span>
            </button>

            {/* Online / Offline Switch */}
            <button
              id="btn-toggle-online"
              onClick={() => toggleEntregadorOnline(currentCourier.id)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                currentCourier.isOnline
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{currentCourier.isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </button>

            <button
              id="btn-courier-logout"
              onClick={logout}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 border border-slate-700 text-slate-400 transition-colors cursor-pointer"
              title="Sair da Conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-[61px] z-30">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-around">
          <button
            id="tab-courier-operacao"
            onClick={() => setActiveTab('operacao')}
            className={`py-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'operacao'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span>Viagens</span>
            {availableDeliveries.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black animate-pulse">
                {availableDeliveries.length}
              </span>
            )}
          </button>

          <button
            id="tab-courier-ganhos"
            onClick={() => setActiveTab('ganhos')}
            className={`py-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'ganhos'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Ganhos & Saques</span>
          </button>

          <button
            id="tab-courier-historico"
            onClick={() => setActiveTab('historico')}
            className={`py-3 px-4 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'historico'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Histórico</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Quality Restriction Warning Banner */}
        {currentCourier.bloqueado_por_avaliacao && (
          <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs space-y-1.5 shadow-lg">
            <div className="flex items-center gap-2 text-rose-400 font-extrabold text-sm">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>Restrição Preventiva de Qualidade (Nota: {currentCourier.avaliacao_media?.toFixed(1) || '0.0'}★)</span>
            </div>
            <p className="text-rose-300">
              {currentCourier.motivo_bloqueio_avaliacao ||
                'Sua conta atingiu uma média de avaliações inferior à nota mínima exigida pela Central.'}{' '}
              Procure a administração da Central Nexo Viagens para suporte e reciclagem.
            </p>
          </div>
        )}

        {/* Offline Warning Banner */}
        {!currentCourier.isOnline && !currentCourier.bloqueado_por_avaliacao && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-amber-300 text-xs sm:text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Você está <strong>OFFLINE</strong>. Fique online para receber chamados de viagens em Alagoinha.</span>
            </div>
            <button
              onClick={() => toggleEntregadorOnline(currentCourier.id)}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shrink-0 cursor-pointer shadow"
            >
              Ficar Online
            </button>
          </div>
        )}

        {/* TAB 1: OPERAÇÃO (VIAGENS DISPONÍVEIS & ATIVA) */}
        {activeTab === 'operacao' && (
          <div className="space-y-6">
            {/* Cartão de Fila Virtual FIFO & Auto-Detecção Geofencing */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-slate-300">
                    Sua Praça: <strong className="text-white">{currentCourier.praca_atual_nome || 'Aguardando seleção'}</strong>
                  </span>
                </div>

                {filaStatus && (
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${
                      filaStatus.isPrimeiro
                        ? 'bg-amber-400/15 border-amber-400/40 text-amber-300'
                        : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    }`}
                  >
                    <span>
                      {filaStatus.isPrimeiro
                        ? '🏆 1º da Fila (Prioridade de Chamado)'
                        : `📍 Posição ${filaStatus.posicao} de ${filaStatus.totalNaFila} na fila virtual`}
                    </span>
                  </div>
                )}
              </div>

              {/* Botões de Ação Geofencing e Notificações */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDetectarLocalizacaoGps}
                  disabled={geoLocating}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Compass className={`w-3.5 h-3.5 text-cyan-400 ${geoLocating ? 'animate-spin' : ''}`} />
                  <span>{geoLocating ? 'Lendo GPS...' : '📍 Auto-Detectar Praça via GPS'}</span>
                </button>

                {/* Sugestão 8: Confirmação de Presença na Praça para evitar remoção */}
                {currentCourier.praca_atual_id && (
                  <button
                    type="button"
                    onClick={() => {
                      confirmarPresencaNaFila(currentCourier.id);
                      setPresencaConfirmada(true);
                      setTimeout(() => setPresencaConfirmada(false), 2500);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Evita pausa automática por inatividade na fila da praça"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{presencaConfirmada ? '✅ Presença Confirmada!' : 'Estou na Praça (Confirmar Fila)'}</span>
                  </button>
                )}

                {!pushEnabled && (
                  <button
                    type="button"
                    onClick={handleAtivarNotificacoes}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ativar Alertas Web Push & Som</span>
                  </button>
                )}
              </div>

              {geoMessage && (
                <p className="text-[11px] text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 p-2.5 rounded-xl">
                  {geoMessage}
                </p>
              )}
            </div>
            {/* 1. VIAGEM ATIVA EM ANDAMENTO */}
            {myActiveDelivery ? (
              <div className="p-5 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500/50 shadow-2xl space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-400" />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-emerald-400 text-base">
                      {myActiveDelivery.code}
                    </span>
                    {/* Badge do Tipo de Serviço */}
                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                        myActiveDelivery.serviceCategory === 'passageiro'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      }`}
                    >
                      {myActiveDelivery.serviceCategory === 'passageiro'
                        ? `👤 Passageiro (${myActiveDelivery.passengerCount || 1} pes.)`
                        : '📦 Encomenda Expressa'}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        getStatusBadgeClasses(myActiveDelivery.status).bg
                      } ${getStatusBadgeClasses(myActiveDelivery.status).text}`}
                    >
                      {getStatusBadgeClasses(myActiveDelivery.status).label}
                    </span>
                    {myActiveDelivery.zoneType && (
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                          getZoneBadgeDetails(myActiveDelivery.zoneType, myActiveDelivery.deliveryFee, myActiveDelivery.isRural).bg
                        } ${
                          getZoneBadgeDetails(myActiveDelivery.zoneType, myActiveDelivery.deliveryFee, myActiveDelivery.isRural).text
                        } ${
                          getZoneBadgeDetails(myActiveDelivery.zoneType, myActiveDelivery.deliveryFee, myActiveDelivery.isRural).border
                        }`}
                      >
                        {getZoneBadgeDetails(myActiveDelivery.zoneType, myActiveDelivery.deliveryFee, myActiveDelivery.isRural).icon}{' '}
                        {getZoneBadgeDetails(myActiveDelivery.zoneType, myActiveDelivery.deliveryFee, myActiveDelivery.isRural).label}
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Seu Ganho Líquido:</span>
                    <span className="text-xl font-black text-emerald-400">
                      {myActiveDelivery.isRural && myActiveDelivery.ruralAgreedDirectly ? (
                        <span className="text-amber-400 text-sm">A Combinar (Direto)</span>
                      ) : (
                        `R$ ${myActiveDelivery.courierEarnings.toFixed(2)}`
                      )}
                    </span>
                  </div>
                </div>

                {/* 📡 PAINEL DE TELEMETRIA GPS INTELIGENTE (LOOP 15s) */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-cyan-500/40 shadow-inner space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-cyan-400" />
                        GPS Inteligente Ativo • Conectado à Central e Passageiro
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-cyan-300 font-mono bg-cyan-950/60 px-2.5 py-0.5 rounded-lg border border-cyan-500/30">
                        {gpsPingAtivo ? '📡 Transmitindo...' : `Próximo ping em: ${segundosProximoPing}s`}
                      </span>
                      <button
                        type="button"
                        onClick={transmitirLocalizacaoAtual}
                        className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                        title="Enviar sinal de GPS imediatamente"
                      >
                        <RefreshCw className={`w-2.5 h-2.5 ${gpsPingAtivo ? 'animate-spin' : ''}`} />
                        <span>Atualizar</span>
                      </button>
                    </div>
                  </div>

                  {/* Telemetria de Distância e Tempo */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">Distância em Linha:</span>
                      <span className="text-sm font-black text-cyan-300">
                        {myActiveDelivery.status === 'a_caminho_entrega' || myActiveDelivery.status === 'corrida_iniciada'
                          ? myActiveDelivery.distanceToDestinationMeters !== undefined
                            ? `${myActiveDelivery.distanceToDestinationMeters}m até destino`
                            : 'Calculando...'
                          : myActiveDelivery.distanceToPassengerMeters !== undefined
                          ? `${myActiveDelivery.distanceToPassengerMeters}m até coleta`
                          : 'Calculando...'}
                      </span>
                    </div>

                    <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-medium">Previsão de Chegada:</span>
                      <span className="text-sm font-black text-emerald-400">
                        {myActiveDelivery.estimatedArrivalMinutes !== undefined
                          ? `~${myActiveDelivery.estimatedArrivalMinutes} min`
                          : '~2-4 min'}
                      </span>
                    </div>

                    <div className="col-span-2 sm:col-span-1 bg-slate-900/80 p-2 rounded-xl border border-slate-800 flex items-center justify-between sm:block">
                      <span className="text-[10px] text-slate-400 block font-medium">Loop Telemetria:</span>
                      <span className="text-[11px] font-bold text-slate-200">
                        A cada 15 segundos
                      </span>
                    </div>
                  </div>
                </div>

                {/* Origem & Destino da Viagem */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Item Description se houver */}
                  {myActiveDelivery.itemDescription && (
                    <div className="sm:col-span-2 p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-200 flex items-center gap-2 font-semibold">
                      <Package className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>Item / Objeto informado: {myActiveDelivery.itemDescription}</span>
                    </div>
                  )}

                  {/* Coleta / Embarque */}
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {myActiveDelivery.serviceCategory === 'passageiro'
                        ? '1. EMBARQUE DO PASSAGEIRO'
                        : '1. LOCAL DE RETIRADA / COLETA'}
                    </span>
                    <p className="font-bold text-white text-sm">{myActiveDelivery.merchantName}</p>
                    <p className="text-slate-300">{myActiveDelivery.pickupAddress}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={gerarUrlGoogleMapsRota(
                          myActiveDelivery.currentCourierLat,
                          myActiveDelivery.currentCourierLng,
                          myActiveDelivery.origem_latitude,
                          myActiveDelivery.origem_longitude,
                          myActiveDelivery.pickupAddress
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                      >
                        <Route className="w-3 h-3 text-cyan-400" />
                        <span>GPS até Passageiro</span>
                      </a>
                      {myActiveDelivery.merchantPhone && (
                        <a
                          href={`https://wa.me/${cleanWhatsAppNumber(myActiveDelivery.merchantPhone)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                        >
                          <MessageSquare className="w-3 h-3 text-cyan-400" />
                          <span>WhatsApp do Ponto / Solicitante</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Entrega / Desembarque */}
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5" />
                      {myActiveDelivery.serviceCategory === 'passageiro'
                        ? '2. DESEMBARQUE (DESTINO)'
                        : '2. DESTINO DE ENTREGA (CLIENTE)'}
                    </span>
                    <p className="font-bold text-white text-sm">
                      {myActiveDelivery.customerName || (myActiveDelivery.serviceCategory === 'passageiro' ? 'Passageiro' : 'Cliente Final')}
                      {myActiveDelivery.serviceCategory === 'passageiro' && myActiveDelivery.passengerCount && myActiveDelivery.passengerCount > 1 && (
                        <span className="ml-2 text-xs font-bold text-blue-400">({myActiveDelivery.passengerCount} pessoas)</span>
                      )}
                    </p>
                    <p className="text-slate-300">{myActiveDelivery.deliveryAddress}</p>
                    {myActiveDelivery.deliveryNeighborhood && (
                      <p className="text-slate-400">Bairro: {myActiveDelivery.deliveryNeighborhood}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <a
                        href={gerarUrlGoogleMapsRota(
                          myActiveDelivery.currentCourierLat,
                          myActiveDelivery.currentCourierLng,
                          myActiveDelivery.destino_latitude,
                          myActiveDelivery.destino_longitude,
                          myActiveDelivery.deliveryAddress
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                      >
                        <Route className="w-3 h-3 text-emerald-400" />
                        <span>Abrir Rota Destino GPS</span>
                      </a>
                      {myActiveDelivery.customerPhone && (
                        <a
                          href={`https://wa.me/${cleanWhatsAppNumber(myActiveDelivery.customerPhone)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                        >
                          <MessageSquare className="w-3 h-3 text-emerald-400" />
                          <span>{myActiveDelivery.serviceCategory === 'passageiro' ? 'Zap Passageiro' : 'Zap do Cliente'}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Financeiro da Corrida: Pago via Créditos da Central Nexo */}
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1.5 text-emerald-300">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-emerald-400 text-xs flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      PAGAMENTO EXCLUSIVO VIA CRÉDITOS NEXO VIAGENS (CENTRAL)
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-400 text-slate-950 font-black text-xs">
                      Seu Ganho Líquido: R$ {myActiveDelivery.courierEarnings.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-200">
                    ✓ <strong>NÃO COBRE NADA DO PASSAGEIRO.</strong> O passageiro já pagou via créditos pré-pagos arrecadados pela Central. Ao confirmar o código PIN no desembarque, seus <strong>R$ {myActiveDelivery.courierEarnings.toFixed(2)}</strong> entram automaticamente no seu saldo acumulado para repasse via Pix.
                  </p>
                </div>

                {/* Observações do Pedido */}
                {myActiveDelivery.notes && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-amber-300 flex items-start gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span><strong>Obs do Ponto / Passageiro:</strong> {myActiveDelivery.notes}</span>
                  </div>
                )}

                {/* Ações de Comunicação e Segurança da Corrida Ativa */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowChatModal(true)}
                    className="py-2.5 px-3 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow"
                  >
                    <MessageSquare className="w-4 h-4 text-cyan-400" />
                    <span>Chat com Passageiro</span>
                    {myActiveDelivery.mensagens_chat && myActiveDelivery.mensagens_chat.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px]">
                        {myActiveDelivery.mensagens_chat.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSosModal(true)}
                    className="py-2.5 px-3 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow"
                  >
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>SOS Emergência</span>
                  </button>
                </div>

                {/* Botão de Ação para Avançar Etapa com Suporte ao PIN */}
                <div className="pt-2">
                  {(() => {
                    const isFinishingStep = myActiveDelivery.status === 'a_caminho_entrega';
                    const action = getNextActionLabel(myActiveDelivery.status, myActiveDelivery.serviceCategory);
                    const isPassageiro = myActiveDelivery.serviceCategory === 'passageiro';
                    return (
                      <button
                        id="btn-advance-active-delivery"
                        onClick={() => {
                          if (isFinishingStep) {
                            setPinInput('');
                            setPinError(null);
                            setShowPinModal(true);
                          } else {
                            avancarStatusEntrega(myActiveDelivery.id, 'courier');
                          }
                        }}
                        className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-all transform active:scale-98 ${
                          isFinishingStep
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950'
                            : action.color
                        }`}
                      >
                        {isFinishingStep ? (
                          <>
                            <Key className="w-4 h-4" />
                            <span>
                              {isPassageiro
                                ? 'Desembarcar Passageiro (Digitar PIN / U-Código)'
                                : 'Entregar ao Destinatário (Digitar PIN)'}
                            </span>
                          </>
                        ) : (
                          <>
                            <span>{action.label}</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-2">
                <Navigation className="w-10 h-10 text-emerald-400 mx-auto mb-1" />
                <h3 className="font-bold text-white text-base">Você não está em nenhuma viagem ativa no momento</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Fique atento às notificações abaixo. Quando um passageiro solicitar uma viagem em Alagoinha, o chamado aparecerá aqui instantaneamente.
                </p>
              </div>
            )}

            {/* 2. VIAGENS DISPONÍVEIS PARA ACEITE */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-white text-base">
                    Novas Viagens Disponíveis ({availableDeliveries.length})
                  </h3>
                </div>
                <span className="text-xs text-slate-400">Em Alagoinha-PB</span>
              </div>

              {availableDeliveries.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/80 text-center text-slate-500 text-xs">
                  Nenhuma viagem aguardando no momento. Assim que um passageiro solicitar, ela será listada aqui.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {availableDeliveries.map((delivery) => (
                    <div
                      key={delivery.id}
                      className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {delivery.code}
                          </span>
                          {/* Badge de Modalidade */}
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                              delivery.serviceCategory === 'passageiro'
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                                : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            }`}
                          >
                            {delivery.serviceCategory === 'passageiro'
                              ? `👤 Passageiro (${delivery.passengerCount || 1} pes.)`
                              : '📦 Encomenda Expressa'}
                          </span>
                          {delivery.zoneType && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                getZoneBadgeDetails(delivery.zoneType, delivery.deliveryFee, delivery.isRural).bg
                              } ${
                                getZoneBadgeDetails(delivery.zoneType, delivery.deliveryFee, delivery.isRural).text
                              } ${
                                getZoneBadgeDetails(delivery.zoneType, delivery.deliveryFee, delivery.isRural).border
                              }`}
                            >
                              {getZoneBadgeDetails(delivery.zoneType, delivery.deliveryFee, delivery.isRural).icon}{' '}
                              {getZoneBadgeDetails(delivery.zoneType, delivery.deliveryFee, delivery.isRural).label}
                            </span>
                          )}
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            {new Date(delivery.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 block">Ganha:</span>
                          <span className="text-base font-black text-emerald-400">
                            {delivery.isRural && delivery.ruralAgreedDirectly ? (
                              <span className="text-amber-400 text-xs">A Combinar (Direto)</span>
                            ) : (
                              `R$ ${delivery.courierEarnings.toFixed(2)}`
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Detalhes do Item ou Passageiro */}
                      {delivery.serviceCategory === 'encomenda' && delivery.itemDescription && (
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-purple-300 flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span>Pacote / Encomenda: <strong className="text-white">{delivery.itemDescription}</strong></span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                        <div>
                          <span className="text-slate-500 block text-[11px]">
                            {delivery.serviceCategory === 'passageiro' ? 'Embarque (Buscar):' : 'Coleta (Ponto):'}
                          </span>
                          <span className="font-semibold text-white">{delivery.pickupAddress}</span>
                          <p className="text-slate-400 text-[11px] truncate">Ponto / Solicitante: {delivery.merchantName}</p>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">
                            {delivery.serviceCategory === 'passageiro' ? 'Desembarque (Destino):' : 'Entrega (Destino):'}
                          </span>
                          <span className="font-semibold text-white">{delivery.deliveryAddress}</span>
                          {delivery.customerName && (
                            <p className="text-slate-400 text-[11px]">
                              {delivery.serviceCategory === 'passageiro' ? 'Passageiro: ' : 'Destinatário: '}
                              {delivery.customerName}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          id={`btn-accept-delivery-${delivery.id}`}
                          onClick={() => aceitarEntrega(delivery.id, currentCourier.id)}
                          disabled={!currentCourier.isOnline || !!myActiveDelivery}
                          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>{myActiveDelivery ? 'Finalize a viagem atual primeiro' : 'ACEITAR VIAGEM AGORA'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: GANHOS & SAQUES (EXTRATO CLARO) */}
        {activeTab === 'ganhos' && (
          <div className="space-y-6">
            {/* Sugestão 2: Painel de Fechamento de Caixa Diário / Exportação para WhatsApp */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Fechamento de Caixa de Hoje</h3>
                    <p className="text-xs text-slate-400">Prestação de contas diária com a Central Nexo</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExportarFechamentoWhatsApp}
                  disabled={todayCompletedDeliveries.length === 0}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
                  title="Exporta resumo diário formatado para o WhatsApp da Central"
                >
                  <Share2 className="w-4 h-4 text-slate-950" />
                  <span>Enviar Fechamento para WhatsApp</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-semibold">Viagens Hoje</span>
                  <span className="text-xl sm:text-2xl font-black text-white">{todayCompletedDeliveries.length}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-semibold">Bruto Total Hoje</span>
                  <span className="text-xl sm:text-2xl font-black text-white">R$ {todayGross.toFixed(2)}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-semibold">Taxa Nexo (15%)</span>
                  <span className="text-xl sm:text-2xl font-black text-amber-400">R$ {todayCentralFee.toFixed(2)}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[11px] text-slate-400 block font-semibold">Seu Líquido Hoje</span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-400">R$ {todayNet.toFixed(2)}</span>
                </div>
              </div>

              {todayCompletedDeliveries.length === 0 && (
                <p className="text-[11px] text-slate-500 text-center pt-1">
                  Nenhuma viagem concluída hoje ainda. Assim que você finalizar corridas, o cálculo do caixa é feito em tempo real.
                </p>
              )}
            </div>

            {/* Top Balance Summary Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Saldo Acumulado para Saque
                </span>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Ciclo Atual
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div className="space-y-1">
                  <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                    R$ {accumulated.toFixed(2)}
                  </span>
                  <p className="text-xs text-slate-400">
                    Comissão da Central ({((settings.centralFeePercentage || 0.15) * 100).toFixed(0)}%): ~R$ {centralFeeEstimated.toFixed(2)} • Líquido estimado: <strong className="text-emerald-400">R$ {netEstimated.toFixed(2)}</strong>
                  </p>
                </div>

                <button
                  id="btn-open-withdraw-modal"
                  onClick={() => setShowWithdrawModal(true)}
                  disabled={accumulated <= 0}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 cursor-pointer"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>SOLICITAR SAQUE PIX</span>
                </button>
              </div>
            </div>

            {/* Withdrawals History */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-white text-base">Histórico de Saques e Repasses</h3>
                </div>
              </div>

              {myWithdrawals.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Você ainda não solicitou nenhum saque. Quando solicitar, o status do pagamento via Pix aparecerá aqui.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80">
                  {myWithdrawals.map((w) => (
                    <div key={w.id} className="p-4 flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">
                            R$ {w.netAmount.toFixed(2)}
                          </span>
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                              w.status === 'pago'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : w.status === 'recusado'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {w.status === 'pago'
                              ? 'Transferência Pix Concluída'
                              : w.status === 'recusado'
                              ? 'Recusado'
                              : 'Aguardando Pagamento da Central'}
                          </span>
                        </div>
                        <p className="text-slate-400 font-mono">
                          Pix ({w.pixKeyType.toUpperCase()}): {w.pixKey} • Solicitado em: {new Date(w.createdAt).toLocaleDateString()}
                        </p>
                        {w.pixTransactionId && (
                          <p className="text-slate-500 text-[11px]">ID Comprovante: {w.pixTransactionId}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: HISTÓRICO DE VIAGENS CONCLUÍDAS */}
        {activeTab === 'historico' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">
                  Viagens Concluídas por Você ({myCompletedDeliveries.length})
                </h3>
              </div>
            </div>

            {myCompletedDeliveries.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Nenhuma viagem finalizada ainda. Suas viagens realizadas ficarão salvas aqui.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {myCompletedDeliveries.map((delivery) => (
                  <div key={delivery.id} className="p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-400">{delivery.code}</span>
                        <span className="text-slate-400">
                          {new Date(delivery.createdAt).toLocaleDateString()} às{' '}
                          {new Date(delivery.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className="font-black text-emerald-400 text-sm">
                        + R$ {delivery.courierEarnings.toFixed(2)}
                      </span>
                    </div>

                    <div className="text-slate-300">
                      <span className="text-slate-500">De (Ponto de Embarque):</span> {delivery.merchantName} ({delivery.pickupAddress})
                      <br />
                      <span className="text-slate-500">Para (Destino):</span> {delivery.deliveryAddress}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal: Solicitar Saque Pix */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleWithdrawRequest}
            className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400">
                <Wallet className="w-6 h-6" />
                <h3 className="font-bold text-white text-base">Solicitar Saque Pix</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Saldo Bruto Acumulado:</span>
                <span className="font-bold text-white">R$ {accumulated.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Comissão Central ({((settings.centralFeePercentage || 0.15) * 100).toFixed(0)}%):</span>
                <span className="text-cyan-400">R$ {centralFeeEstimated.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-900 text-sm">
                <span className="text-slate-300 font-bold">Valor Líquido a Receber:</span>
                <span className="font-black text-emerald-400">R$ {netEstimated.toFixed(2)}</span>
              </div>
            </div>

            {withdrawError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
                {withdrawError}
              </div>
            )}

            {withdrawSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Solicitação enviada com sucesso para a Central Nexo Viagens!</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Tipo da sua Chave Pix *</label>
                <select
                  id="select-courier-withdraw-pixtype"
                  value={pixKeyType}
                  onChange={(e) => setPixKeyType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="cpf">CPF</option>
                  <option value="telefone">Telefone / WhatsApp</option>
                  <option value="email">E-mail</option>
                  <option value="aleatoria">Chave Aleatória</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Sua Chave Pix para Recebimento *</label>
                <input
                  id="input-courier-withdraw-pixkey"
                  type="text"
                  value={pixKeyInput}
                  onChange={(e) => setPixKeyInput(e.target.value)}
                  placeholder="Informe a chave Pix correta"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                Confirmar Solicitação
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Validação de Código PIN (Segurança da Viagem) */}
      {showPinModal && myActiveDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleConfirmPin}
            className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border-2 border-emerald-500/40 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
                <h3 className="font-bold text-white text-base">Código PIN de Confirmação</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPinModal(false);
                  setPinError(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Tipo de Viagem:</span>
                <span className="font-bold text-emerald-400">
                  {myActiveDelivery.serviceCategory === 'passageiro'
                    ? `👤 Viagem com Passageiro (${myActiveDelivery.passengerCount || 1} pes.)`
                    : '📦 Encomenda Expressa'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Código:</span>
                <span className="font-mono font-bold text-white">{myActiveDelivery.code}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">
                  {myActiveDelivery.serviceCategory === 'passageiro' ? 'Passageiro:' : 'Destinatário:'}
                </span>
                <span className="font-semibold text-white">{myActiveDelivery.customerName || 'Passageiro'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Destino:</span>
                <span className="text-slate-300 truncate max-w-[200px]">{myActiveDelivery.deliveryAddress}</span>
              </div>
            </div>

            <div className="text-center space-y-2 py-1">
              <label className="block text-xs font-bold text-slate-300">
                {myActiveDelivery.serviceCategory === 'passageiro'
                  ? 'Solicite o código PIN de 4 dígitos ao passageiro para validar o desembarque:'
                  : 'Solicite os 4 dígitos ao destinatário para confirmar a entrega:'}
              </label>
              <div className="flex justify-center">
                <input
                  id="input-delivery-pin"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  autoFocus
                  value={pinInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setPinInput(val);
                    if (pinError) setPinError(null);
                  }}
                  placeholder="0000"
                  className="w-48 text-center text-3xl font-mono font-black tracking-widest py-3 px-4 rounded-2xl bg-slate-950 border-2 border-emerald-500 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 shadow-inner"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                O passageiro recebeu esse código no aplicativo e no WhatsApp.
              </p>
            </div>

            {pinError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium text-center">
                {pinError}
              </div>
            )}

            {pinSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>PIN validado com sucesso! Concluindo viagem...</span>
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <button
                type="submit"
                disabled={pinInput.length !== 4 || pinSuccess}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2 transition-all"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Validar PIN e Finalizar Viagem</span>
              </button>

              {/* Botão de Socorro: passageiro sem WhatsApp ou com dificuldade */}
              <div className="text-center pt-1">
                <a
                  href={
                    myActiveDelivery.merchantPhone
                      ? `https://wa.me/${cleanWhatsAppNumber(myActiveDelivery.merchantPhone)}?text=${encodeURIComponent(
                          `Olá, sou o motorista da viagem ${myActiveDelivery.code}. Estou com o passageiro (${myActiveDelivery.customerName || 'Passageiro'}) e precisamos confirmar o código PIN de desembarque. Poderiam me ajudar?`
                        )}`
                      : '#'
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium inline-flex items-center gap-1"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Passageiro não encontrou o PIN? Falar com o suporte / Central</span>
                </a>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Ride Chat Modal */}
      {myActiveDelivery && (
        <RideChatModal
          delivery={myActiveDelivery}
          currentUserId={currentCourier.id}
          currentUserType="mototaxista"
          currentUserName={currentCourier.name}
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          onSendMessage={(texto, rapida) => {
            enviarMensagemChat(
              myActiveDelivery.id,
              texto,
              currentCourier.id,
              'mototaxista',
              currentCourier.name,
              rapida
            );
          }}
        />
      )}

      {/* Ride SOS Modal */}
      {myActiveDelivery && (
        <RideSosModal
          delivery={myActiveDelivery}
          currentUserId={currentCourier.id}
          currentUserRole="mototaxista"
          currentUserName={currentCourier.name}
          isOpen={showSosModal}
          onClose={() => setShowSosModal(false)}
          onTriggerSos={(motivo) => {
            acionarSos(
              myActiveDelivery.id,
              currentCourier.name,
              'mototaxista',
              motivo
            );
          }}
        />
      )}
    </div>
  );
};
