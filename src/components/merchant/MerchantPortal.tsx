import React, { useState, useEffect } from 'react';
import { useApp, getStatusBadgeClasses, getStatusDescription } from '../../context/AppContext';
import { Delivery, DeliveryZoneType } from '../../types';
import { DEFAULT_OPERATING_ZONES } from '../../mockData';
import {
  Car,
  Plus,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Search,
  ExternalLink,
  ChevronRight,
  Info,
  DollarSign,
  QrCode,
  User,
  Sparkles,
  Navigation,
  Route,
  Key,
  MessageSquare,
  Send,
  CheckCircle,
  Wallet,
  History,
  ShieldCheck,
  X,
  CreditCard,
  ArrowRight,
  Star,
  ShieldAlert,
  Share2,
  CloudRain,
  Zap,
  Radio,
  Crosshair,
  LocateFixed,
  RefreshCw,
  Compass,
} from 'lucide-react';
import {
  generateCustomerWhatsAppUrl,
  generateCourierDispatchWhatsAppUrl,
  cleanWhatsAppNumber,
} from '../../utils/whatsapp';
import { RideChatModal } from '../common/RideChatModal';
import { RideSosModal } from '../common/RideSosModal';
import {
  identificarPontoAlagoinhaPorCoords,
  gerarUrlGoogleMapsRota,
  PONTOS_REFERENCIA_ALAGOINHA,
} from '../../utils/geofencing';

export const MerchantPortal: React.FC = () => {
  const {
    currentMerchant,
    deliveries,
    couriers,
    recharges,
    settings,
    solicitarEntrega,
    atualizarTelemetriaGps,
    solicitarRecarga,
    confirmarRecargaPix,
    cancelarEntrega,
    enviarMensagemChat,
    acionarSos,
    avaliarCorrida,
  } = useApp();

  const feeCentral = settings.feeUrbanCentral || 3.50;
  const feeDistante = settings.feeUrbanDistante || 7.00;

  const [activeTab, setActiveTab] = useState<'ativas' | 'historico' | 'extrato'>('ativas');
  const [showNewRideModal, setShowNewRideModal] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  // Chat, SOS and Rating Modals
  const [chatDelivery, setChatDelivery] = useState<Delivery | null>(null);
  const [sosDelivery, setSosDelivery] = useState<Delivery | null>(null);
  const [ratingDelivery, setRatingDelivery] = useState<Delivery | null>(null);
  const [ratingStars, setRatingStars] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState<string>('');
  const [ratingSuccessMsg, setRatingSuccessMsg] = useState<string | null>(null);

  // Form states for New Ride / Dispatch
  const [serviceCategory, setServiceCategory] = useState<'passageiro' | 'encomenda'>('passageiro');
  const [selectedPracaId, setSelectedPracaId] = useState<string>('praca-centro');
  const [itemDescription, setItemDescription] = useState<string>('');
  const [pickupAddress, setPickupAddress] = useState(currentMerchant?.address || 'Centro de Alagoinha');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerName, setCustomerName] = useState(currentMerchant?.name || 'Passageiro');
  const [customerPhone, setCustomerPhone] = useState(currentMerchant?.phone || '');
  const [deliveryFee, setDeliveryFee] = useState<number>(feeCentral);
  const [observations, setObservations] = useState('');
  const [rideFormError, setRideFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados de GPS do Passageiro ("Estou Aqui" e Telemetria Inteligente)
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [gpsOriginCoords, setGpsOriginCoords] = useState<{
    lat: number;
    lng: number;
    accuracy?: number;
    label?: string;
  } | null>(null);
  const [gpsDestCoords, setGpsDestCoords] = useState<{ lat: number; lng: number } | null>(null);

  const handleEstouAquiGps = () => {
    setGpsDetecting(true);
    setRideFormError(null);

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          const ponto = identificarPontoAlagoinhaPorCoords(latitude, longitude);
          const enderecoDetectado =
            ponto.descricaoSugerida || `Localização Atual (GPS ±${Math.round(accuracy)}m)`;
          setPickupAddress(enderecoDetectado);
          setGpsOriginCoords({
            lat: latitude,
            lng: longitude,
            accuracy: Math.round(accuracy),
            label: ponto.pontoMaisProximo?.nome || enderecoDetectado,
          });
          setGpsDetecting(false);
        },
        (err) => {
          console.warn('GPS do celular indisponível ou permissão negada:', err);
          // Fallback inteligente para Alagoinha Centro
          const pontoCentro = PONTOS_REFERENCIA_ALAGOINHA[0];
          setPickupAddress(`${pontoCentro.nome} - Centro`);
          setGpsOriginCoords({
            lat: pontoCentro.lat,
            lng: pontoCentro.lon,
            accuracy: 25,
            label: pontoCentro.nome,
          });
          setGpsDetecting(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
      );
    } else {
      const pontoCentro = PONTOS_REFERENCIA_ALAGOINHA[0];
      setPickupAddress(`${pontoCentro.nome} - Centro`);
      setGpsOriginCoords({
        lat: pontoCentro.lat,
        lng: pontoCentro.lon,
        accuracy: 25,
        label: pontoCentro.nome,
      });
      setGpsDetecting(false);
    }
  };

  const handleSelectDestinoAtalho = (pontoNome: string) => {
    setDeliveryAddress(pontoNome);
    const matched = PONTOS_REFERENCIA_ALAGOINHA.find(
      (p) => p.nome.toLowerCase().includes(pontoNome.toLowerCase()) || pontoNome.toLowerCase().includes(p.nome.toLowerCase())
    );
    if (matched) {
      setGpsDestCoords({ lat: matched.lat, lng: matched.lon });
    }
  };

  // Recharge modal states
  const [rechargeAmount, setRechargeAmount] = useState<number>(30);
  const [rechargeSuccessMsg, setRechargeSuccessMsg] = useState<string | null>(null);
  const [copiedPixKey, setCopiedPixKey] = useState(false);
  const [copiedPixCode, setCopiedPixCode] = useState(false);

  // History search
  const [historySearch, setHistorySearch] = useState('');

  // Selected Zone object
  const currentZone = DEFAULT_OPERATING_ZONES.find((z) => z.id === selectedPracaId) || DEFAULT_OPERATING_ZONES[0];

  // Adjust fee when praça changes (urban only) and apply dynamic tariff if active
  useEffect(() => {
    const found = DEFAULT_OPERATING_ZONES.find((z) => z.id === selectedPracaId);
    const baseFee = found ? found.standardFee : feeCentral;
    const additional = settings.tarifa_dinamica_ativa ? (settings.tarifa_dinamica_adicional ?? 2.0) : 0;
    setDeliveryFee(baseFee + additional);
  }, [selectedPracaId, feeCentral, feeDistante, settings.tarifa_dinamica_ativa, settings.tarifa_dinamica_adicional]);

  if (!currentMerchant) {
    return (
      <div className="max-w-md mx-auto p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl mt-12 text-white space-y-4">
        <AlertCircle className="w-12 h-12 text-cyan-400 mx-auto" />
        <h2 className="text-xl font-bold">Nenhum Passageiro Conectado</h2>
        <p className="text-slate-400 text-sm">
          Por favor, faça login com seu número ou credenciais para pedir viagens em Alagoinha.
        </p>
      </div>
    );
  }

  // Filter deliveries belonging to this passenger/client
  const myDeliveries = deliveries.filter((d) => d.merchantId === currentMerchant.id);
  const activeDeliveries = myDeliveries.filter((d) => d.status !== 'concluida' && d.status !== 'cancelada');
  const completedDeliveries = myDeliveries.filter((d) => d.status === 'concluida' || d.status === 'cancelada');

  const filteredHistory = completedDeliveries.filter((d) => {
    const q = historySearch.toLowerCase();
    return (
      d.code.toLowerCase().includes(q) ||
      d.deliveryAddress.toLowerCase().includes(q) ||
      (d.pickupAddress && d.pickupAddress.toLowerCase().includes(q)) ||
      (d.courierName && d.courierName.toLowerCase().includes(q))
    );
  });

  // Recharges of this user
  const myRecharges = recharges.filter((r) => r.merchantId === currentMerchant.id);

  // Online and approved pilots
  const onlinePilots = couriers.filter(
    (c) => c.isOnline && (c.approvalStatus === 'aprovado' || (!c.approvalStatus && c.isApproved !== false))
  );

  const handleCreateRide = (e: React.FormEvent) => {
    e.preventDefault();
    setRideFormError(null);

    if (!pickupAddress.trim()) {
      setRideFormError('Informe o local de embarque ou ponto de partida.');
      return;
    }
    if (!deliveryAddress.trim()) {
      setRideFormError('Informe o local de destino / desembarque.');
      return;
    }
    if (!customerPhone.trim()) {
      setRideFormError('Informe um WhatsApp válido para acompanhar o piloto.');
      return;
    }

    // Validação estrita: Pagamento exclusivo via créditos pré-pagos
    if (currentMerchant.creditBalance < deliveryFee) {
      setRideFormError(
        `Saldo insuficiente (R$ ${currentMerchant.creditBalance.toFixed(2)}). Esta viagem custa R$ ${deliveryFee.toFixed(2)}. A Central Nexo Viagens opera exclusivamente com créditos pré-pagos para arrecadar e repassar com segurança aos motoristas. Faça uma recarga via Pix para pedir sua viagem!`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const zoneType: DeliveryZoneType =
        selectedPracaId === 'praca_3_rural'
          ? 'rural'
          : selectedPracaId === 'praca_2_patio'
          ? 'urbana_distante'
          : 'urbana_central';

      const result = solicitarEntrega({
        merchantId: currentMerchant.id,
        pickupAddress: pickupAddress.trim(),
        deliveryAddress: deliveryAddress.trim(),
        customerName: customerName.trim() || currentMerchant.name,
        customerPhone: customerPhone.trim(),
        deliveryFee,
        zoneType,
        isRural: selectedPracaId === 'praca_3_rural',
        ruralAgreedDirectly: false,
        paymentMethodType: 'saldo_credito',
        serviceCategory,
        passengerCount: 1,
        itemDescription: serviceCategory === 'encomenda' ? itemDescription.trim() || 'Encomenda Expressa' : undefined,
        notes: observations.trim() || undefined,
        pracaZoneId: selectedPracaId,
        pracaZoneName: currentZone.name,
        origemLatitude: gpsOriginCoords?.lat,
        origemLongitude: gpsOriginCoords?.lng,
        destinoLatitude: gpsDestCoords?.lat,
        destinoLongitude: gpsDestCoords?.lng,
      });

      if (result.success && result.delivery) {
        setShowNewRideModal(false);
        setDeliveryAddress('');
        setItemDescription('');
        setObservations('');
        setGpsOriginCoords(null);
        setGpsDestCoords(null);
        setSelectedDelivery(result.delivery);
        setActiveTab('ativas');
      } else {
        setRideFormError(result.error || 'Erro ao solicitar viagem.');
      }
    } catch (err: any) {
      setRideFormError(err.message || 'Erro inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(settings.centralPixKey);
    setCopiedPixKey(true);
    setTimeout(() => setCopiedPixKey(false), 2500);
  };

  const generatedPixCode = `00020126580014BR.GOV.BCB.PIX0114${(settings.centralPixKey || '83999999999').replace(/[^0-9a-zA-Z@.-]/g, '')}520400005303986540${rechargeAmount.toFixed(2).length < 10 ? '0' : ''}${rechargeAmount.toFixed(2)}5802BR5920CENTRAL NEXO VIAGENS6009ALAGOINHA62070503***6304`;

  const handleCopyPixCode = () => {
    navigator.clipboard.writeText(generatedPixCode);
    setCopiedPixCode(true);
    setTimeout(() => setCopiedPixCode(false), 2000);
  };

  const handleInstantWebhookPix = () => {
    if (rechargeAmount <= 0) return;
    const res = solicitarRecarga(currentMerchant.id, rechargeAmount, 'Pix Copia e Cola Instantâneo');
    if (res.success && res.recharge) {
      confirmarRecargaPix(res.recharge.id, `PIX-AUT-${Date.now().toString(36).toUpperCase()}`);
      setRechargeSuccessMsg(`Recarga Pix de R$ ${rechargeAmount.toFixed(2)} confirmada automaticamente pelo Webhook do Banco! Seu saldo já está disponível.`);
      setTimeout(() => {
        setShowRechargeModal(false);
        setRechargeSuccessMsg(null);
      }, 2500);
    }
  };

  const handleRechargeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rechargeAmount <= 0) return;

    const res = solicitarRecarga(currentMerchant.id, rechargeAmount);
    if (res.success) {
      setRechargeSuccessMsg(`Recarga de R$ ${rechargeAmount.toFixed(2)} registrada! Envie o comprovante via WhatsApp para liberação imediata.`);
      setTimeout(() => {
        setShowRechargeModal(false);
        setRechargeSuccessMsg(null);
      }, 3500);
    }
  };

  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingDelivery) return;
    const res = avaliarCorrida(ratingDelivery.id, ratingStars, ratingComment);
    if (res.success) {
      setRatingSuccessMsg('Avaliação registrada com sucesso! Muito obrigado pelo feedback.');
      setTimeout(() => {
        setRatingDelivery(null);
        setRatingSuccessMsg(null);
      }, 1500);
    }
  };

  const unratedRides = deliveries.filter(
    (d) => d.merchantId === currentMerchant.id && d.status === 'concluida' && !d.avaliacao_estrelas
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 selection:bg-cyan-500 selection:text-slate-950">
      {/* Sugestão 7: Alerta de Bandeira Especial / Tarifa Dinâmica Ativa */}
      {settings.tarifa_dinamica_ativa && (
        <div className="p-4 rounded-2xl bg-blue-500/15 border border-blue-500/40 text-blue-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5">
            <CloudRain className="w-5 h-5 text-blue-400 shrink-0 animate-bounce" />
            <div>
              <strong className="text-white block text-sm font-bold">
                Bandeira Especial Ativa: {settings.tarifa_dinamica_motivo || 'Chuva Intensa'}
              </strong>
              <span className="text-[11px] text-blue-300">
                Adicional de R$ {(settings.tarifa_dinamica_adicional ?? 2).toFixed(2)} por corrida aplicado para valorizar a saída dos mototaxistas parceiros.
              </span>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-blue-500 text-slate-950 font-black text-xs shrink-0 self-start sm:self-center">
            + R$ {(settings.tarifa_dinamica_adicional ?? 2).toFixed(2)} na Tarifa
          </span>
        </div>
      )}

      {/* Top Banner: Passenger Profile, Zone & Quick Actions */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4">
          {/* Passenger Photo Profile */}
          <div className="relative shrink-0">
            {currentMerchant.photoUrl || currentMerchant.foto_url ? (
              <img
                src={currentMerchant.photoUrl || currentMerchant.foto_url}
                alt={currentMerchant.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl object-cover border-2 border-cyan-400 shadow-xl shadow-cyan-500/10"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-2 border-cyan-500/40 flex items-center justify-center text-cyan-300 font-black text-2xl shadow-xl">
                {currentMerchant.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center" title="Passageiro Verificado">
              <Check className="w-3 h-3 text-slate-950 stroke-[3]" />
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Nexo Viagens Alagoinha</span>
              </span>

              <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{onlinePilots.length} pilotos online</span>
              </span>
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Olá, {currentMerchant.name}</span>
              </h1>
              <p className="text-xs text-slate-400">
                Experiência ágil modelo Uber com mototaxistas credenciados de Alagoinha-PB.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button & Wallet Glance */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-cyan-500/30 text-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Saldo Pré-Pago:</span>
            <span className="text-lg font-black text-cyan-400">
              R$ {currentMerchant.creditBalance.toFixed(2)}
            </span>
          </div>

          <button
            id="btn-open-recharge-top"
            onClick={() => setShowRechargeModal(true)}
            className="px-4 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-750 text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Wallet className="w-4 h-4 text-cyan-400" />
            <span>Recarga Pix</span>
          </button>

          <button
            id="btn-open-request-ride"
            onClick={() => {
              setRideFormError(null);
              setShowNewRideModal(true);
            }}
            className="flex-1 md:flex-none px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer transform active:scale-98"
          >
            <Navigation className="w-5 h-5" />
            <span>Pedir Agora</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('ativas')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'ativas'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>Viagens em Andamento</span>
          {activeDeliveries.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-slate-950 text-cyan-400 text-[10px] font-black">
              {activeDeliveries.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('historico')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'historico'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Histórico de Viagens ({completedDeliveries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('extrato')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'extrato'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Créditos & Recarga Pix</span>
        </button>
      </div>

      {/* TAB 1: VIAGENS EM ANDAMENTO */}
      {activeTab === 'ativas' && (
        <div className="space-y-4">
          {unratedRides.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs sm:text-sm">
                    Você tem {unratedRides.length} {unratedRides.length === 1 ? 'viagem recente pendente de avaliação' : 'viagens recentes pendentes de avaliação'}!
                  </h4>
                  <p className="text-[11px] text-amber-200/80">
                    Sua nota é fundamental para mantermos os melhores motoristas em Alagoinha.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRatingDelivery(unratedRides[0]);
                  setRatingStars(5);
                  setRatingComment('');
                  setRatingSuccessMsg(null);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow self-start sm:self-auto transition-colors"
              >
                <Star className="w-3.5 h-3.5 fill-slate-950" />
                <span>Avaliar Corrida ({unratedRides[0].code})</span>
              </button>
            </div>
          )}

          {activeDeliveries.length === 0 ? (
            <div className="space-y-4">
              {/* Uber-like "Para Onde Vamos?" Card */}
              <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-cyan-500/10 via-blue-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

                <div className="max-w-2xl space-y-6">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Experiência Instantânea Uber em Alagoinha
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-white">
                      Para onde vamos hoje?
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400">
                      Chame um mototaxista credenciado em segundos com tarifa fixa e pagamento automático por créditos.
                    </p>
                  </div>

                  {/* Search Bar "Para onde?" */}
                  <div
                    onClick={() => {
                      setRideFormError(null);
                      setShowNewRideModal(true);
                    }}
                    className="p-4 rounded-2xl bg-slate-950 border-2 border-cyan-500/40 hover:border-cyan-400 flex items-center justify-between gap-3 shadow-lg cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 group-hover:bg-cyan-500 text-cyan-400 group-hover:text-slate-950 flex items-center justify-center transition-colors">
                        <Search className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-sm font-black text-white group-hover:text-cyan-300 block transition-colors">
                          Digite seu destino ou escolha abaixo
                        </span>
                        <span className="text-xs text-slate-400">
                          Partida padrão: {pickupAddress || 'Ponto Central'}
                        </span>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs">
                      <span>Pedir</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Sugestões de Destinos Frequentes / Rápidos modelo Uber */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Destinos Populares em Alagoinha:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { title: 'Centro Comercial', sub: 'Praça Central', fee: feeCentral },
                        { title: 'Igreja Matriz', sub: 'Centro', fee: feeCentral },
                        { title: 'Pátio de Eventos', sub: 'Área de Lazer', fee: feeCentral },
                        { title: 'Bairro São José', sub: 'Zona Residencial', fee: feeCentral },
                        { title: 'Rua Nova', sub: 'Zona Urbana', fee: feeCentral },
                        { title: 'Bairro Boa Vista', sub: 'Zona Alta', fee: feeDistante },
                        { title: 'Conjunto Novo', sub: 'Zona Sul', fee: feeDistante },
                        { title: 'Zona Rural / Sítio', sub: 'Sob Consulta', fee: settings.feeRural || 15 },
                      ].map((item) => (
                        <button
                          key={item.title}
                          type="button"
                          onClick={() => {
                            setDeliveryAddress(item.title);
                            setShowNewRideModal(true);
                          }}
                          className="p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-left transition-all cursor-pointer group"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm">📍</span>
                            <span className="text-[10px] font-bold text-cyan-400">R$ {item.fee.toFixed(2)}</span>
                          </div>
                          <span className="text-xs font-bold text-white group-hover:text-cyan-300 block truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {item.sub}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Informações de Agilidade & Segurança */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 text-xs">
                    <div className="flex items-center gap-2 text-slate-300">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Pilotos com foto e verificação mútua</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Radio className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
                      <span>GPS inteligente atualizado a cada 15s</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300">
                      <Wallet className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Créditos pré-pagos seguros pela Central</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {activeDeliveries.map((delivery) => {
                const badge = getStatusBadgeClasses(delivery.status);
                const hasCourier = !!delivery.courierName;

                return (
                  <div
                    key={delivery.id}
                    className="p-5 rounded-3xl bg-slate-900 border border-cyan-500/40 shadow-xl space-y-4 relative overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono font-black text-cyan-400 text-sm bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800">
                          {delivery.code}
                        </span>

                        <span className="px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 font-bold text-xs">
                          {delivery.serviceCategory === 'passageiro' ? '👤 Viagem de Passageiro' : '📦 Encomenda Expressa'}
                        </span>

                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>

                        {delivery.pracaZoneName && (
                          <span className="px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-cyan-400" />
                            {delivery.pracaZoneName}
                          </span>
                        )}
                      </div>

                      <div className="text-right flex items-center sm:flex-col justify-between sm:justify-center">
                        <span className="text-[11px] text-slate-400">Valor da Viagem:</span>
                        <span className="text-lg font-black text-white">
                          R$ {delivery.deliveryFee.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* PIN Security Badge (U-Code) */}
                    {delivery.pinCode && (
                      <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                            <Key className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-cyan-300 block">
                              Seu Código PIN de Segurança:
                            </span>
                            <span className="text-[11px] text-slate-300">
                              Informe ao motorista para validar e concluir a viagem no destino.
                            </span>
                          </div>
                        </div>
                        <span className="text-xl font-mono font-black text-cyan-400 tracking-widest bg-slate-950 px-3 py-1.5 rounded-xl border border-cyan-500/50">
                          {delivery.pinCode}
                        </span>
                      </div>
                    )}

                    {/* 📡 Radar de Telemetria GPS Inteligente (Atualizado a cada 15 segundos) */}
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/40 shadow-inner space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                          </span>
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Radio className="w-3.5 h-3.5 text-emerald-400" />
                            GPS Inteligente em Tempo Real (Ciclos de 15s)
                          </span>
                        </div>

                        <span className="text-[11px] text-emerald-300 font-mono bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                          {hasCourier ? 'Sinal Ativo com o Motorista' : 'Buscando Motorista Mais Próximo'}
                        </span>
                      </div>

                      {hasCourier ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
                            <span className="text-[10px] text-slate-400 font-medium">Distância em Linha:</span>
                            <p className="text-sm font-black text-cyan-300 flex items-center gap-1.5">
                              <Compass className="w-4 h-4 text-cyan-400" />
                              {delivery.status === 'a_caminho_entrega' || delivery.status === 'corrida_iniciada'
                                ? delivery.distanceToDestinationMeters !== undefined
                                  ? `${delivery.distanceToDestinationMeters}m até seu destino`
                                  : 'Em trajeto para o destino'
                                : delivery.distanceToPassengerMeters !== undefined
                                ? `${delivery.distanceToPassengerMeters}m até seu embarque`
                                : 'Motorista se aproximando'}
                            </p>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-0.5">
                            <span className="text-[10px] text-slate-400 font-medium">Previsão Estimada de Chegada:</span>
                            <p className="text-sm font-black text-emerald-400 flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-emerald-400" />
                              {delivery.estimatedArrivalMinutes !== undefined
                                ? `~${delivery.estimatedArrivalMinutes} minutos`
                                : '~2 a 4 minutos'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-300">
                          Seu ponto de embarque ({delivery.pickupAddress}) foi transmitido com coordenadas GPS calibradas para a fila de mototaxistas credenciados de Alagoinha.
                        </p>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-900">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Geolocalização dupla (celular passageiro + celular motorista)
                        </span>

                        <a
                          href={gerarUrlGoogleMapsRota(
                            delivery.currentCourierLat,
                            delivery.currentCourierLng,
                            delivery.destino_latitude || delivery.origem_latitude,
                            delivery.destino_longitude || delivery.origem_longitude,
                            delivery.deliveryAddress
                          )}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                        >
                          <Route className="w-3 h-3 text-emerald-400" />
                          <span>Ver Rota no Google Maps</span>
                        </a>
                      </div>
                    </div>

                    {/* Route Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> Ponto de Partida / Embarque
                        </span>
                        <p className="font-semibold text-white text-sm">{delivery.pickupAddress}</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                          <Navigation className="w-3.5 h-3.5" /> Ponto de Chegada / Destino
                        </span>
                        <p className="font-semibold text-white text-sm">{delivery.deliveryAddress}</p>
                      </div>
                    </div>

                    {/* Driver assigned status */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {hasCourier ? (
                        <div className="flex items-center gap-3">
                          {delivery.courierPhotoUrl ? (
                            <img
                              src={delivery.courierPhotoUrl}
                              alt={delivery.courierName || 'Piloto'}
                              className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-400 shrink-0 shadow-md"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-lg shrink-0">
                              🛵
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-slate-400">Motorista Parceiro Confirmado:</p>
                            <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                              <span>{delivery.courierName}</span>
                              <span className="text-emerald-400 text-xs font-semibold">★ 4.9</span>
                            </h4>
                            <p className="text-[11px] text-emerald-400 font-medium">Motorista credenciado pela Central Nexo Viagens</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 animate-pulse">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-sm">Aguardando motorista aceitar</h4>
                            <p className="text-[11px] text-amber-300/90">
                              A viagem foi disponibilizada para os motoristas credenciados neste ponto de referência.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        {hasCourier && (
                          <>
                            <button
                              type="button"
                              onClick={() => setChatDelivery(delivery)}
                              className="px-3.5 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Chat Rápido</span>
                              {delivery.mensagens_chat && delivery.mensagens_chat.length > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px]">
                                  {delivery.mensagens_chat.length}
                                </span>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => setSosDelivery(delivery)}
                              className="px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow"
                            >
                              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                              <span>SOS</span>
                            </button>
                          </>
                        )}

                        {delivery.courierPhone && (
                          <a
                            href={`https://wa.me/${cleanWhatsAppNumber(delivery.courierPhone)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>WhatsApp</span>
                          </a>
                        )}

                        {/* Sugestão 1: Botão de Compartilhar Viagem (Segurança da Família) */}
                        <button
                          type="button"
                          onClick={() => {
                            const trackingCode = delivery.code.replace('#', '');
                            const trackingUrl = `${window.location.origin}/?rastreio=${trackingCode}`;
                            const msg = encodeURIComponent(
                              `Olá! Estou em viagem com a Nexo Viagens em Alagoinha.\nAcompanhe meu trajeto em tempo real pelo link de segurança da família:\n${trackingUrl}`
                            );
                            window.open(`https://wa.me/?text=${msg}`, '_blank');
                          }}
                          className="px-3.5 py-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow"
                          title="Compartilhar rota e mototaxista com familiares via WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Compartilhar Viagem</span>
                        </button>

                        {delivery.status === 'aguardando_entregador' && (
                          <button
                            onClick={() => cancelarEntrega(delivery.id, 'Cancelado pelo passageiro')}
                            className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-xs font-bold transition-colors cursor-pointer"
                          >
                            Cancelar Viagem
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HISTÓRICO DE VIAGENS */}
      {activeTab === 'historico' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-white text-base">Histórico de Viagens & Deslocamentos</h3>
              <p className="text-xs text-slate-400">Todas as viagens concluídas na plataforma Nexo Viagens.</p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Buscar por código, destino, motorista..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="py-3 px-3">Código</th>
                  <th className="py-3 px-3">Data / Hora</th>
                  <th className="py-3 px-3">Modalidade</th>
                  <th className="py-3 px-3">Partida</th>
                  <th className="py-3 px-3">Destino</th>
                  <th className="py-3 px-3">Motorista</th>
                  <th className="py-3 px-3">Valor</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-center">Avaliação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      Nenhuma viagem encontrada no histórico.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((del) => {
                    const badge = getStatusBadgeClasses(del.status);
                    return (
                      <tr key={del.id} className="hover:bg-slate-850 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-cyan-400">{del.code}</td>
                        <td className="py-3 px-3 text-slate-400">
                          {new Date(del.createdAt).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(del.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-200">
                            {del.serviceCategory === 'passageiro' ? '👤 Passageiro' : '📦 Encomenda'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-300 max-w-xs truncate">{del.pickupAddress}</td>
                        <td className="py-3 px-3 text-white font-medium max-w-xs truncate">{del.deliveryAddress}</td>
                        <td className="py-3 px-3 text-slate-300 font-semibold">{del.courierName || '—'}</td>
                        <td className="py-3 px-3 font-bold text-white">R$ {del.deliveryFee.toFixed(2)}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {del.status === 'concluida' ? (
                            del.avaliacao_estrelas ? (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-[11px]" title={del.avaliacao_comentario || 'Sem comentário'}>
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>{del.avaliacao_estrelas.toFixed(1)}</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setRatingDelivery(del);
                                  setRatingStars(5);
                                  setRatingComment('');
                                  setRatingSuccessMsg(null);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Star className="w-3 h-3" />
                                <span>Avaliar</span>
                              </button>
                            )
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CRÉDITOS & RECARGAS PIX */}
      {activeTab === 'extrato' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div>
              <span className="text-xs text-slate-400 block font-semibold">Saldo Atual na Conta:</span>
              <h2 className="text-3xl font-black text-cyan-400">
                R$ {currentMerchant.creditBalance.toFixed(2)}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Utilize seus créditos pré-pagos para pagar viagens com segurança sem precisar passar dinheiro em mãos.
              </p>
            </div>

            <button
              onClick={() => setShowRechargeModal(true)}
              className="px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer self-start sm:self-auto"
            >
              <CreditCard className="w-4 h-4" />
              <span>Adicionar Créditos via Pix</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <h3 className="font-bold text-white text-sm">Histórico de Recargas Pix</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                  <tr>
                    <th className="py-3 px-3">Código</th>
                    <th className="py-3 px-3">Data</th>
                    <th className="py-3 px-3">Valor</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Conferido por</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {myRecharges.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">
                        Nenhuma recarga registrada até o momento.
                      </td>
                    </tr>
                  ) : (
                    myRecharges.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-850">
                        <td className="py-3 px-3 font-mono font-bold text-cyan-400">{rec.code}</td>
                        <td className="py-3 px-3 text-slate-400">
                          {new Date(rec.createdAt).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(rec.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-400">+ R$ {rec.amountRequested.toFixed(2)}</td>
                        <td className="py-3 px-3">
                          {rec.status === 'confirmado' ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                              Crédito Liberado
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                              Em Análise Central
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-400">{rec.adminConfirmedBy || 'Pendente'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SOLICITAR VIAGEM - NEXO VIAGENS */}
      {showNewRideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm">
          <form
            onSubmit={handleCreateRide}
            className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto text-slate-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base sm:text-lg">Pedir Viagem - Nexo Viagens</h3>
                  <p className="text-xs text-cyan-400">Motoristas Credenciados • Central Alagoinha</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewRideModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
              >
                ✕
              </button>
            </div>

            {rideFormError && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{rideFormError}</span>
              </div>
            )}

            {/* SELETOR DE MODALIDADE: PASSAGEIRO VS ENCOMENDA FLASH */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Tipo de Viagem:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setServiceCategory('passageiro')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    serviceCategory === 'passageiro'
                      ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-md shadow-cyan-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-xl block mb-1">👤</span>
                  <span className="font-bold text-xs block text-white">Viagem de Passageiro</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Transporte de pessoa</span>
                </button>

                <button
                  type="button"
                  onClick={() => setServiceCategory('encomenda')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    serviceCategory === 'encomenda'
                      ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-md shadow-cyan-500/10'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-xl block mb-1">📦</span>
                  <span className="font-bold text-xs block text-white">Envio de Encomenda</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Pacotes, produtos ou itens</span>
                </button>
              </div>
            </div>

            {/* PONTO DE REFERÊNCIA / ZONA */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-cyan-300">
                  Ponto de Referência / Região da Viagem *
                </label>
                <span className="text-[10px] text-slate-400">Atendimento por zona</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {DEFAULT_OPERATING_ZONES.map((zone) => (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => setSelectedPracaId(zone.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedPracaId === zone.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-white ring-1 ring-cyan-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-xs font-bold block text-white truncate">{zone.name}</span>
                    <span className="text-[10px] text-cyan-400 font-medium block mt-0.5">
                      Tarifa: R$ {zone.standardFee.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400">
                {currentZone.description}
              </p>
            </div>

            {/* Se Encomenda: Descrição do Item */}
            {serviceCategory === 'encomenda' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  O que está sendo transportado? *
                </label>
                <input
                  type="text"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="Ex: Documento, encomenda, pacote, compras..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>
            )}

            {/* Ponto de Embarque / Partida */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Local de Embarque (Onde o motorista vai te buscar?) *
                </label>
                <button
                  type="button"
                  onClick={handleEstouAquiGps}
                  disabled={gpsDetecting}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  title="Detectar sua localização atual exata com o GPS do celular"
                >
                  <Crosshair className={`w-3.5 h-3.5 text-emerald-400 ${gpsDetecting ? 'animate-spin' : ''}`} />
                  <span>{gpsDetecting ? 'Detectando GPS...' : '📍 Estou Aqui (GPS do Celular)'}</span>
                </button>
              </div>

              <input
                type="text"
                value={pickupAddress}
                onChange={(e) => {
                  setPickupAddress(e.target.value);
                  setGpsOriginCoords(null);
                }}
                placeholder="Ex: Ponto de Referência Central, Rua Nova nº 100, Em frente à Farmácia..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                required
              />

              {gpsOriginCoords && (
                <div className="mt-1.5 p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between text-[11px] text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <strong>GPS Calibrado:</strong> {gpsOriginCoords.label} (±{gpsOriginCoords.accuracy}m)
                  </span>
                  <span className="text-[10px] text-emerald-400/80 font-mono">Rota Inteligente Ativa</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 pt-1.5 overflow-x-auto">
                <span className="text-[10px] text-slate-400 shrink-0">Atalhos:</span>
                {['Ponto Central', 'Igreja Matriz', 'Prefeitura', 'Rua Nova'].map((point) => (
                  <button
                    key={point}
                    type="button"
                    onClick={() => {
                      setPickupAddress(point);
                      const matched = PONTOS_REFERENCIA_ALAGOINHA.find((p) => p.nome.includes(point));
                      if (matched) {
                        setGpsOriginCoords({
                          lat: matched.lat,
                          lng: matched.lon,
                          accuracy: 15,
                          label: matched.nome,
                        });
                      }
                    }}
                    className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] whitespace-nowrap cursor-pointer"
                  >
                    {point}
                  </button>
                ))}
              </div>
            </div>

            {/* Ponto de Desembarque / Destino */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Destino (Para onde você vai?) *
              </label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => {
                  setDeliveryAddress(e.target.value);
                  setGpsDestCoords(null);
                }}
                placeholder="Ex: Pátio de Festas, Bairro São José, Saída para Cuitegi..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                required
              />
              <div className="flex items-center gap-1.5 pt-1.5 overflow-x-auto">
                <span className="text-[10px] text-slate-400 shrink-0">Atalhos:</span>
                {['Pátio de Festas', 'Bairro São José', 'Lot. Santa Tereza', 'Sítio Maguary'].map((point) => (
                  <button
                    key={point}
                    type="button"
                    onClick={() => handleSelectDestinoAtalho(point)}
                    className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] whitespace-nowrap cursor-pointer"
                  >
                    {point}
                  </button>
                ))}
              </div>
            </div>

            {/* Dados do Passageiro */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do Passageiro *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  WhatsApp para Contato e GPS *
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="(83) 99999-0000"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>
            </div>

            {/* FORMA DE PAGAMENTO EXCLUSIVA: 100% CRÉDITOS PRÉ-PAGOS DA CENTRAL */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Pagamento Exclusivo via Créditos Nexo Viagens
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      A Central arrecada antecipadamente e repassa diretamente ao motorista parceiro
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono text-[10px] font-bold">
                  100% Digital
                </span>
              </div>

              {/* Saldo vs Custo */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block">Seu Saldo Atual</span>
                  <span className={`text-xs font-black ${currentMerchant.creditBalance < deliveryFee ? 'text-rose-400' : 'text-emerald-400'}`}>
                    R$ {currentMerchant.creditBalance.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Custo da Viagem</span>
                  <span className="text-xs font-black text-cyan-300">
                    R$ {deliveryFee.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Saldo Restante</span>
                  <span className={`text-xs font-black ${currentMerchant.creditBalance - deliveryFee < 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                    R$ {Math.max(0, currentMerchant.creditBalance - deliveryFee).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Alerta de Saldo Insuficiente ou Confirmação */}
              {currentMerchant.creditBalance < deliveryFee ? (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs space-y-2.5">
                  <div className="flex items-start gap-2 text-rose-300">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    <div>
                      <span className="font-bold block">Saldo Insuficiente de Créditos</span>
                      <p className="text-[11px] text-rose-200 mt-0.5">
                        Faltam R$ {(deliveryFee - currentMerchant.creditBalance).toFixed(2)} para solicitar esta viagem. A Nexo Viagens opera 100% via créditos pré-pagos arrecadados pela Central para garantir o repasse aos motoristas.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewRideModal(false);
                      setShowRechargeModal(true);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Recarregar Créditos via Pix Agora</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Saldo suficiente! O valor de R$ {deliveryFee.toFixed(2)} será debitado do seu saldo e repassado pela Central ao motorista parceiro.
                  </span>
                </div>
              )}
            </div>

            {/* Observações */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Ponto de Referência ou Observação para o Motorista
              </label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Ex: Estou de camisa azul no ponto de referência, aguardando na calçada..."
                rows={2}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder:text-slate-500 text-xs focus:outline-none focus:border-cyan-400 resize-none"
              />
            </div>

            {/* Summary Banner */}
            <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between text-xs">
              <div>
                <span className="text-cyan-300 font-bold block">{currentZone.name}</span>
                <span className="text-[11px] text-slate-400">Veículo: Motorista Credenciado Nexo Viagens</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[10px] block">Valor Total:</span>
                <span className="text-base font-black text-cyan-400">R$ {deliveryFee.toFixed(2)}</span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowNewRideModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || currentMerchant.creditBalance < deliveryFee}
                className={`px-6 py-2.5 rounded-xl font-black text-xs shadow-lg transition-all cursor-pointer ${
                  currentMerchant.creditBalance < deliveryFee
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-cyan-500/20'
                }`}
              >
                {isSubmitting
                  ? 'Solicitando...'
                  : currentMerchant.creditBalance < deliveryFee
                  ? 'Saldo Insuficiente (Recarregar via Pix)'
                  : `Confirmar e Pedir Viagem (R$ ${deliveryFee.toFixed(2)})`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: RECARGA DE CRÉDITOS VIA PIX */}
      {showRechargeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-white text-base">Recarregar Créditos via Pix</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRechargeModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
              >
                ✕
              </button>
            </div>

            {rechargeSuccessMsg ? (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="font-bold">{rechargeSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleRechargeSubmit} className="space-y-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div>
                    <span className="text-slate-400 block font-semibold mb-1">Chave Pix da Central:</span>
                    <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800 font-mono text-cyan-300">
                      <span className="truncate">{settings.centralPixKey}</span>
                      <button
                        type="button"
                        onClick={handleCopyPix}
                        className="ml-2 text-xs font-bold text-white hover:text-cyan-400 flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedPixKey ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Sugestão 4: PIX Copia e Cola Automático */}
                  <div>
                    <span className="text-slate-400 block font-semibold mb-1">Pix Copia e Cola (Qualquer Banco):</span>
                    <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800 font-mono text-emerald-300 text-[11px]">
                      <span className="truncate max-w-[240px]">{generatedPixCode}</span>
                      <button
                        type="button"
                        onClick={handleCopyPixCode}
                        className="ml-2 text-xs font-bold text-white hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedPixCode ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500">Beneficiário: Central Nexo Alagoinha</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Valor da Recarga (R$) *
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {[20, 30, 50].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setRechargeAmount(amt)}
                        className={`py-2 rounded-xl font-bold border cursor-pointer ${
                          rechargeAmount === amt
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                            : 'bg-slate-950 border-slate-800 text-slate-300'
                        }`}
                      >
                        R$ {amt},00
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="5"
                    step="1"
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-sm focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>

                <div className="space-y-2">
                  {/* Sugestão 4: Validação Instantânea de Pix */}
                  <button
                    type="button"
                    onClick={handleInstantWebhookPix}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-slate-950 font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-slate-950" />
                    <span>⚡ Confirmar Pix Instantâneo (Automático)</span>
                  </button>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold border border-slate-700 cursor-pointer"
                  >
                    Registrar Comprovante Manualmente
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CHAT MODAL */}
      {chatDelivery && (
        <RideChatModal
          delivery={chatDelivery}
          currentUserId={currentMerchant.id}
          currentUserType="passageiro"
          currentUserName={currentMerchant.name}
          onClose={() => setChatDelivery(null)}
          onSendMessage={(text) => enviarMensagemChat(chatDelivery.id, text, 'passageiro', currentMerchant.name)}
        />
      )}

      {/* SOS MODAL */}
      {sosDelivery && (
        <RideSosModal
          delivery={sosDelivery}
          actorType="passageiro"
          actorName={currentMerchant.name}
          onClose={() => setSosDelivery(null)}
          onAcionarSos={(motivo) => acionarSos(sosDelivery.id, 'passageiro', currentMerchant.name, motivo)}
        />
      )}

      {/* AVALIAÇÃO MODAL */}
      {ratingDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Avaliar Viagem</h3>
                  <p className="text-xs text-slate-400">
                    Corrida {ratingDelivery.code} • Motorista: {ratingDelivery.courierName || 'Credenciado'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRatingDelivery(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {ratingSuccessMsg ? (
              <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="font-bold text-sm">{ratingSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleRatingSubmit} className="space-y-4 text-xs">
                <div className="text-center space-y-2">
                  <span className="text-slate-300 font-semibold block text-sm">Como foi sua experiência?</span>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingStars(star)}
                        className="p-1.5 transition-transform hover:scale-125 cursor-pointer"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            ratingStars >= star
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-700 hover:text-amber-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-amber-400">
                    {ratingStars === 5 && 'Excelente (5.0 ★)'}
                    {ratingStars === 4 && 'Muito Boa (4.0 ★)'}
                    {ratingStars === 3 && 'Regular (3.0 ★)'}
                    {ratingStars === 2 && 'Ruim (2.0 ★)'}
                    {ratingStars === 1 && 'Péssima (1.0 ★)'}
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Comentário ou Elogio (Opcional)
                  </label>
                  <textarea
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    placeholder="Ex: Motorista muito educado, chegou rápido e conduziu com segurança..."
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400">
                  <p>Sua avaliação ajuda a manter o padrão de segurança e qualidade dos motoristas em Alagoinha-PB.</p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setRatingDelivery(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    Confirmar Avaliação
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
