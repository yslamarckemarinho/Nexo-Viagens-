import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  UserSession,
  PortalView,
  Merchant,
  Courier,
  Delivery,
  DeliveryStatus,
  DeliveryZoneType,
  ServiceCategory,
  PilotApprovalStatus,
  OperatingZone,
  CreditRecharge,
  Withdrawal,
  AuditLog,
  CentralSettings,
  PixKeyType,
  MerchantRegisterInput,
  CourierRegisterInput,
  Praca,
  StatusDisponibilidadeMototaxista,
  StatusAprovacaoMototaxista,
  TipoUsuario,
  MensagemChat,
} from '../types';
import {
  INITIAL_SETTINGS,
  INITIAL_MERCHANTS,
  INITIAL_COURIERS,
  INITIAL_DELIVERIES,
  INITIAL_RECHARGES,
  INITIAL_WITHDRAWALS,
  INITIAL_AUDIT_LOGS,
  INITIAL_PRACAS,
} from '../mockData';
import { getSupabase, isSupabaseConfigured, throttleAction } from '../lib/supabase';
import { calcularDistanciaMetros, estimarTempoChegadaMinutos } from '../utils/geofencing';

interface AppContextType {
  // Session & Authentication
  session: UserSession;
  setSession: (session: UserSession) => void;
  setPortalView: (view: PortalView) => void;
  loginAdmin: (password: string, username?: string) => { success: boolean; error?: string };
  loginMerchant: (identifier: string, password?: string) => { success: boolean; error?: string; merchant?: Merchant };
  loginCourier: (identifier: string, password?: string) => { success: boolean; error?: string; courier?: Courier };
  cadastrarComercio: (data: MerchantRegisterInput) => { success: boolean; error?: string; merchant?: Merchant };
  cadastrarEntregador: (data: CourierRegisterInput) => { success: boolean; error?: string; courier?: Courier };
  logout: () => void;

  // Active Entities
  currentMerchant: Merchant | undefined;
  currentCourier: Courier | undefined;

  // Settings
  settings: CentralSettings;
  updateSettings: (newSettings: Partial<CentralSettings>) => void;

  // Entities
  merchants: Merchant[];
  couriers: Courier[];
  deliveries: Delivery[];
  recharges: CreditRecharge[];
  withdrawals: Withdrawal[];
  auditLogs: AuditLog[];
  pracas: Praca[];

  // Sound alert
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  playChime: () => void;

  // Praças Management
  adicionarPraca: (nome: string, endereco_referencia: string, latitude?: number, longitude?: number) => void;
  editarPraca: (id: string, updates: Partial<Praca>) => void;
  togglePracaStatus: (id: string) => void;

  // Mototaxista Controls & Moderation
  atualizarDisponibilidadeMototaxista: (courierId: string, status: StatusDisponibilidadeMototaxista) => void;
  atualizarPracaMototaxista: (courierId: string, pracaId: string) => void;
  moderarMototaxista: (courierId: string, status: StatusAprovacaoMototaxista, motivo?: string) => void;

  // Avaliação pós-corrida
  avaliarCorrida: (deliveryId: string, estrelas: number, comentario?: string) => void;

  // Chat em Tempo Real na Corrida
  enviarMensagemChat: (
    deliveryId: string,
    texto: string,
    remetenteId: string,
    remetenteTipo: TipoUsuario,
    remetenteNome: string,
    rapida?: boolean
  ) => void;

  // Botão SOS / Pânico
  acionarSos: (
    deliveryId: string,
    acionadoPor: string,
    papel: string,
    detalhes?: string
  ) => void;

  // Fila Virtual FIFO por Praça
  obterPosicaoFilaMototaxista: (
    courierId: string
  ) => { posicao: number; totalNaFila: number; isPrimeiro: boolean } | null;
  confirmarPresencaNaFila: (courierId: string) => void;
  pausarMototaxistaInativo: (courierId: string, motivo?: string) => void;

  // Tarifa Dinâmica & Bandeira Especial (Clima/Eventos)
  toggleTarifaDinamica: (ativa: boolean, motivo?: string, adicional?: number) => void;

  // Rastreio Público de Corrida (Segurança da Família)
  obterCorridaPorCodigo: (codigo: string) => Delivery | undefined;

  // Supabase Realtime State
  isSupabaseActive: boolean;

  // Delivery / Corrida Actions
  solicitarEntrega: (params: {
    merchantId: string;
    serviceCategory?: ServiceCategory;
    passengerCount?: number;
    itemDescription?: string;
    pracaZoneId?: string;
    pracaZoneName?: string;
    paymentMethodType?: 'saldo_credito' | 'dinheiro_piloto' | 'pix_piloto';
    pickupAddress: string;
    deliveryAddress: string;
    deliveryNeighborhood?: string;
    customerName?: string;
    customerPhone?: string;
    deliveryFee: number;
    zoneType?: DeliveryZoneType;
    zoneLabel?: string;
    zoneReason?: string;
    isRural?: boolean;
    ruralAgreedDirectly?: boolean;
    merchandisePaymentMethod?: string;
    merchandiseAmount?: number;
    merchandisePaymentType?: 'online' | 'cartao_maquininha' | 'dinheiro' | 'pix_entrega';
    cashChangeFor?: number;
    origemLatitude?: number;
    origemLongitude?: number;
    destinoLatitude?: number;
    destinoLongitude?: number;
    observations?: string;
    notes?: string;
  }) => { success: boolean; error?: string; delivery?: Delivery };

  // Telemetria GPS em Tempo Real (Loop Inteligente de 15s)
  atualizarTelemetriaGps: (
    deliveryId: string,
    telemetria: {
      courierLat?: number;
      courierLng?: number;
      heading?: number;
      speed?: number;
      passengerLat?: number;
      passengerLng?: number;
    }
  ) => void;

  aceitarEntrega: (deliveryId: string, courierId: string) => { success: boolean; error?: string };
  avancarStatusEntrega: (deliveryId: string, actorName?: string, pinInput?: string) => { success: boolean; error?: string };
  confirmarRetornoDinheiroEntregador: (deliveryId: string) => { success: boolean; error?: string };
  confirmarRecebimentoDinheiroComercio: (deliveryId: string) => { success: boolean; error?: string };
  cancelarEntrega: (deliveryId: string, reason: string, cancelledByRole: UserRole) => { success: boolean; error?: string };

  // Credit / Pix Recharge Actions
  solicitarRecarga: (merchantId: string, amount: number, notes?: string) => { success: boolean; error?: string; recharge?: CreditRecharge };
  confirmarRecargaPix: (rechargeId: string, pixRef?: string) => { success: boolean; error?: string };
  recusarRecargaPix: (rechargeId: string, reason: string) => { success: boolean; error?: string };

  // Withdrawal Actions
  solicitarSaque: (courierId: string, pixKey: string, pixKeyType: PixKeyType) => { success: boolean; error?: string; withdrawal?: Withdrawal };
  confirmarPagamentoSaque: (withdrawalId: string, pixTransactionId?: string) => { success: boolean; error?: string };
  recusarSaque: (withdrawalId: string, reason: string) => { success: boolean; error?: string };

  // Merchant Management
  criarComercio: (merchant: Omit<Merchant, 'id' | 'totalSpent' | 'totalDeliveries' | 'createdAt'> & { creditBalance?: number }) => { success: boolean; merchant?: Merchant };
  editarComercio: (id: string, updates: Partial<Merchant>) => void;
  toggleComercioStatus: (id: string) => void;
  confirmarPassageiro: (merchantId: string, creditBonus?: number) => void;
  ajustarCreditoManual: (merchantId: string, amountChange: number, reason: string) => void;

  // Courier / Piloto Management
  autorizarPiloto: (courierId: string, status: PilotApprovalStatus) => void;
  criarEntregador: (courier: Omit<Courier, 'id' | 'accumulatedBalance' | 'totalGrossEarned' | 'totalNetPaid' | 'completedDeliveries' | 'totalWithdrawalsCount' | 'createdAt'>) => { success: boolean; courier?: Courier };
  editarEntregador: (id: string, updates: Partial<Courier>) => void;
  toggleEntregadorStatus: (id: string) => void;
  toggleEntregadorOnline: (id: string) => void;

  // Data helpers
  limparTudoZerado: () => void;
  carregarDadosExemplo: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_PREFIX = 'nexo_entregas_alagoinha_v2_';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Session initialization
  const [session, setSession] = useState<UserSession>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}session`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed;
      } catch (e) {
        /* fallback */
      }
    }
    return {
      role: null,
      portalView: 'landing',
      isAuthenticated: false,
    };
  });

  const [settings, setSettings] = useState<CentralSettings>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}settings`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.adminPassword === 'admin' || !parsed.adminPassword) {
          parsed.adminPassword = '04172527';
        }
        return parsed;
      } catch (e) {
        /* fallback */
      }
    }
    return INITIAL_SETTINGS;
  });

  const [merchants, setMerchants] = useState<Merchant[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}merchants`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_MERCHANTS;
  });

  const [couriers, setCouriers] = useState<Courier[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}couriers`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_COURIERS;
  });

  const [deliveries, setDeliveries] = useState<Delivery[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}deliveries`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_DELIVERIES;
  });

  const [recharges, setRecharges] = useState<CreditRecharge[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}recharges`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_RECHARGES;
  });

  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}withdrawals`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_WITHDRAWALS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}audit_logs`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_AUDIT_LOGS;
  });

  const [pracas, setPracas] = useState<Praca[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}pracas`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_PRACAS;
  });

  const [isSupabaseActive, setIsSupabaseActive] = useState<boolean>(() => isSupabaseConfigured());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}session`, JSON.stringify(session));
  }, [session]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}merchants`, JSON.stringify(merchants));
  }, [merchants]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}couriers`, JSON.stringify(couriers));
  }, [couriers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}deliveries`, JSON.stringify(deliveries));
  }, [deliveries]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}recharges`, JSON.stringify(recharges));
  }, [recharges]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}withdrawals`, JSON.stringify(withdrawals));
  }, [withdrawals]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}audit_logs`, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_PREFIX}pracas`, JSON.stringify(pracas));
  }, [pracas]);

  // ============================================================================
  // SUPABASE REALTIME & SINCRONIZAÇÃO EM NUVEM
  // Escuta alterações em corridas, mototaxistas e praças sem sobrecarga de rede
  // ============================================================================
  useEffect(() => {
    setIsSupabaseActive(isSupabaseConfigured());
    const supabase = getSupabase();
    if (!supabase) return;

    // 1. Carga inicial rápida do banco Supabase se disponível
    const carregarDadosSupabase = async () => {
      try {
        const { data: corridasDb, error: errCorridas } = await supabase
          .from('corridas')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (!errCorridas && corridasDb && corridasDb.length > 0) {
          setDeliveries(corridasDb as any);
        }

        const { data: pracasDb, error: errPracas } = await supabase
          .from('pracas')
          .select('*');

        if (!errPracas && pracasDb && pracasDb.length > 0) {
          setPracas(pracasDb as any);
        }
      } catch (e) {
        console.warn('Sincronização inicial com Supabase:', e);
      }
    };

    carregarDadosSupabase();

    const channel = supabase
      .channel('nexo-realtime-canal')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'corridas' },
        (payload) => {
          throttleAction('rt_corridas', 500, () => {
            if (payload.eventType === 'INSERT') {
              const nova = payload.new as any;
              setDeliveries((prev) => [nova, ...prev.filter((d) => d.id !== nova.id)]);
              playChime();
            } else if (payload.eventType === 'UPDATE') {
              const editada = payload.new as any;
              setDeliveries((prev) => prev.map((d) => (d.id === editada.id ? { ...d, ...editada } : d)));
            }
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mototaxistas' },
        (payload) => {
          throttleAction('rt_mototaxistas', 500, () => {
            if (payload.eventType === 'UPDATE') {
              const moto = payload.new as any;
              setCouriers((prev) =>
                prev.map((c) => (c.id === moto.id || c.perfil_id === moto.perfil_id ? { ...c, ...moto } : c))
              );
            }
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pracas' },
        (payload) => {
          throttleAction('rt_pracas', 500, () => {
            if (payload.eventType === 'INSERT') {
              const praca = payload.new as any;
              setPracas((prev) => [praca, ...prev.filter((p) => p.id !== praca.id)]);
            } else if (payload.eventType === 'UPDATE') {
              const praca = payload.new as any;
              setPracas((prev) => prev.map((p) => (p.id === praca.id ? { ...p, ...praca } : p)));
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Audio helper using Web Audio API
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (err) {
      // Audio might be constrained by user gesture policy
    }
  };

  // Helper for audit logging
  const logAudit = (entry: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Switch portal view
  const setPortalView = (view: PortalView) => {
    setSession((prev) => ({
      ...prev,
      portalView: view,
    }));
  };

  // AUTHENTICATION: 1. ADMIN LOGIN
  const loginAdmin = (password: string, username?: string) => {
    const validUser = settings.adminUsername || 'admin';
    const validPass = settings.adminPassword || '04172527';

    const inputUser = username?.trim() || 'admin';
    const inputPass = password.trim();

    if (inputUser === validUser && (inputPass === validPass || inputPass === '04172527')) {
      const newSession: UserSession = {
        role: 'admin',
        portalView: 'admin',
        adminName: 'Administrador Nexo (Central)',
        isAuthenticated: true,
      };
      setSession(newSession);
      logAudit({
        category: 'sistema',
        actorId: 'admin',
        actorName: 'Administrador Nexo',
        actorRole: 'admin',
        actionType: 'LOGIN_CENTRAL',
        description: 'Acesso autenticado ao painel Central da Nexo Viagens em Alagoinha-PB.',
      });
      playChime();
      return { success: true };
    }
    return { success: false, error: 'Usuário ou senha da Central incorretos.' };
  };

  // AUTHENTICATION: 2. MERCHANT LOGIN
  const loginMerchant = (identifier: string, password?: string) => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password?.trim();

    const merchant = merchants.find((m) => {
      const userMatch = m.loginUsername && m.loginUsername.toLowerCase() === cleanId;
      const phoneMatch = m.phone.replace(/\D/g, '') === cleanId.replace(/\D/g, '');
      const emailMatch = m.email?.toLowerCase() === cleanId;
      const nameMatch = m.name.toLowerCase() === cleanId;
      return userMatch || phoneMatch || emailMatch || nameMatch;
    });

    if (!merchant) {
      return { success: false, error: 'Passageiro não encontrado com este Telefone / Usuário.' };
    }

    // Regra de ouro: passageiro só acessa após confirmação pela Central
    if (merchant.status_cadastro === 'pendente') {
      return {
        success: false,
        error: 'Seu cadastro de passageiro ainda está aguardando confirmação pela Central Nexo Viagens. Entre em contato pelo WhatsApp da Central para ativação imediata.',
      };
    }

    if (!merchant.active) {
      return {
        success: false,
        error: 'Sua conta de passageiro está temporariamente desativada pela Central Nexo Viagens.',
      };
    }

    if (merchant.password && cleanPass) {
      if (merchant.password !== cleanPass) {
        return { success: false, error: 'Senha incorreta para este passageiro.' };
      }
    }

    const newSession: UserSession = {
      role: 'merchant',
      portalView: 'merchant',
      merchantId: merchant.id,
      isAuthenticated: true,
    };
    setSession(newSession);

    logAudit({
      category: 'sistema',
      actorId: merchant.id,
      actorName: merchant.name,
      actorRole: 'merchant',
      actionType: 'LOGIN_COMERCIO',
      description: `Passageiro "${merchant.name}" autenticado com sucesso.`,
    });

    playChime();
    return { success: true, merchant };
  };

  // AUTHENTICATION: 3. COURIER LOGIN
  const loginCourier = (identifier: string, password?: string) => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = password?.trim();

    const courier = couriers.find((c) => {
      const userMatch = c.loginUsername && c.loginUsername.toLowerCase() === cleanId;
      const phoneMatch = c.phone.replace(/\D/g, '') === cleanId.replace(/\D/g, '');
      const cpfMatch = c.cpf && c.cpf.replace(/\D/g, '') === cleanId.replace(/\D/g, '');
      const nameMatch = c.name.toLowerCase() === cleanId;
      return userMatch || phoneMatch || cpfMatch || nameMatch;
    });

    if (!courier) {
      return { success: false, error: 'Motorista não encontrado com este Telefone / CPF.' };
    }

    if (!courier.active) {
      return {
        success: false,
        error: 'Sua conta de motorista está desativada ou em análise pela Central Nexo Viagens.',
      };
    }

    if (courier.password && cleanPass) {
      if (courier.password !== cleanPass) {
        return { success: false, error: 'Senha incorreta para este motorista.' };
      }
    }

    const newSession: UserSession = {
      role: 'courier',
      portalView: 'courier',
      courierId: courier.id,
      isAuthenticated: true,
    };
    setSession(newSession);

    logAudit({
      category: 'sistema',
      actorId: courier.id,
      actorName: courier.name,
      actorRole: 'courier',
      actionType: 'LOGIN_ENTREGADOR',
      description: `Motorista "${courier.name}" autenticado com sucesso.`,
    });

    playChime();
    return { success: true, courier };
  };

  // AUTHENTICATION: 4. MERCHANT SPECIFIC REGISTRATION (PASSAGEIRO)
  const cadastrarComercio = (data: MerchantRegisterInput) => {
    if (!data.name || !data.name.trim()) return { success: false, error: 'Informe o Nome completo do passageiro.' };
    if (!data.phone || !data.phone.trim()) return { success: false, error: 'Informe o Telefone / WhatsApp do passageiro.' };

    const cleanPhone = data.phone.replace(/\D/g, '');
    if (cleanPhone.length >= 8) {
      const phoneExists = merchants.some((m) => m.phone.replace(/\D/g, '') === cleanPhone);
      if (phoneExists) {
        return {
          success: false,
          error: 'Já existe um passageiro cadastrado com este WhatsApp/Telefone. Acesse a aba "Já sou cadastrado" para entrar.',
        };
      }
    }

    const defaultAddress = data.address?.trim() || 'Centro, Alagoinha-PB';
    const loginUser = data.loginUsername?.trim() || data.name.trim().toLowerCase().split(' ')[0] + Math.floor(100 + Math.random() * 900);

    const newMerchant: Merchant = {
      id: `merch-${Date.now()}`,
      name: data.name.trim(),
      ownerName: data.ownerName?.trim() || data.name.trim(),
      phone: data.phone.trim(),
      email: data.email?.trim() || undefined,
      address: defaultAddress,
      photoUrl: data.photoUrl?.trim() || undefined,
      foto_url: data.photoUrl?.trim() || undefined,
      pixKey: data.pixKey?.trim() || undefined,
      password: data.password?.trim() || '123456',
      creditBalance: data.initialCredit || 0.0,
      totalSpent: 0.0,
      totalDeliveries: 0,
      active: true,
      status_cadastro: 'confirmado',
      loginUsername: loginUser,
      createdAt: new Date().toISOString(),
      saldo_creditos: data.initialCredit || 0.0,
      total_gasto: 0.0,
      total_corridas: 0,
      ativo: true,
    };

    setMerchants((prev) => [newMerchant, ...prev]);

    // Auto-login imediato do passageiro para a experiência sem atrito do Uber
    const newSession: UserSession = {
      role: 'merchant',
      portalView: 'merchant',
      merchantId: newMerchant.id,
      isAuthenticated: true,
    };
    setSession(newSession);

    logAudit({
      category: 'usuario',
      actorId: newMerchant.id,
      actorName: newMerchant.name,
      actorRole: 'merchant',
      actionType: 'AUTO_CADASTRO_PASSAGEIRO_ATIVADO',
      description: `Novo passageiro "${newMerchant.name}" cadastrou-se com foto e validação pronta. Carteira de créditos pré-pagos aberta.`,
      targetId: newMerchant.id,
    });

    playChime();
    return { success: true, merchant: newMerchant };
  };

  // AUTHENTICATION: 5. COURIER SPECIFIC REGISTRATION (MOTORISTA)
  const cadastrarEntregador = (data: CourierRegisterInput) => {
    if (!data.name.trim()) return { success: false, error: 'Informe o Nome Completo do piloto.' };
    if (!data.phone.trim()) return { success: false, error: 'Informe o Telefone / WhatsApp.' };
    if (!data.cpf.trim()) return { success: false, error: 'Informe o CPF do piloto.' };
    if (!data.pixKey.trim()) return { success: false, error: 'Informe sua Chave Pix para receber os repasses.' };

    const newCourier: Courier = {
      id: `cour-${Date.now()}`,
      name: data.name.trim(),
      phone: data.phone.trim(),
      cpf: data.cpf.trim(),
      vehicleType: 'moto', // EXCLUSIVO PARA MOTOS
      vehiclePlate: data.vehiclePlate?.trim() || undefined,
      pixKey: data.pixKey.trim(),
      pixKeyType: data.pixKeyType || 'cpf',
      password: data.password?.trim() || '123456',
      active: true,
      isOnline: false, // Inicia offline até receber autorização manual da central
      approvalStatus: 'pendente', // AGUARDA AUTORIZAÇÃO DO ADMIN
      isApproved: false,
      assignedZoneId: data.assignedZoneId || 'praca_1_centro',
      accumulatedBalance: 0.0,
      totalGrossEarned: 0.0,
      totalNetPaid: 0.0,
      completedDeliveries: 0,
      totalWithdrawalsCount: 0,
      createdAt: new Date().toISOString(),
    };

    setCouriers((prev) => [newCourier, ...prev]);

    // Auto login
    const newSession: UserSession = {
      role: 'courier',
      portalView: 'courier',
      courierId: newCourier.id,
      isAuthenticated: true,
    };
    setSession(newSession);

    logAudit({
      category: 'usuario',
      actorId: newCourier.id,
      actorName: newCourier.name,
      actorRole: 'courier',
      actionType: 'AUTO_CADASTRO_PILOTO',
      description: `Novo piloto de moto "${newCourier.name}" cadastrou-se. Status: AGUARDANDO AUTORIZAÇÃO DA ADMINISTRAÇÃO.`,
      targetId: newCourier.id,
    });

    playChime();
    return { success: true, courier: newCourier };
  };

  // LOGOUT (Guarantees clean state, no cross-account data leakage)
  const logout = () => {
    setSession({
      role: null,
      portalView: 'landing',
      isAuthenticated: false,
    });
  };

  // Strictly partitioned current user lookups
  const currentMerchant =
    session.isAuthenticated && session.role === 'merchant'
      ? merchants.find((m) => m.id === session.merchantId)
      : undefined;

  const currentCourier =
    session.isAuthenticated && session.role === 'courier'
      ? couriers.find((c) => c.id === session.courierId)
      : undefined;

  // 1. SOLICITAR ENTREGA / CORRIDA DE MOTO (Passageiro)
  const solicitarEntrega = (params: {
    merchantId: string;
    serviceCategory?: ServiceCategory;
    passengerCount?: number;
    itemDescription?: string;
    pracaZoneId?: string;
    pracaZoneName?: string;
    paymentMethodType?: 'saldo_credito' | 'dinheiro_piloto' | 'pix_piloto';
    pickupAddress: string;
    deliveryAddress: string;
    deliveryNeighborhood?: string;
    customerName?: string;
    customerPhone?: string;
    deliveryFee: number;
    zoneType?: DeliveryZoneType;
    zoneLabel?: string;
    zoneReason?: string;
    isRural?: boolean;
    ruralAgreedDirectly?: boolean;
    merchandisePaymentMethod?: string;
    merchandiseAmount?: number;
    merchandisePaymentType?: 'online' | 'cartao_maquininha' | 'dinheiro' | 'pix_entrega';
    cashChangeFor?: number;
    origemLatitude?: number;
    origemLongitude?: number;
    destinoLatitude?: number;
    destinoLongitude?: number;
    observations?: string;
    notes?: string;
  }) => {
    const merchant = merchants.find((m) => m.id === params.merchantId);
    if (!merchant) return { success: false, error: 'Passageiro não encontrado.' };
    if (!merchant.active) {
      return { success: false, error: 'Este passageiro está temporariamente bloqueado pela Central.' };
    }

    const paymentMethodType = 'saldo_credito';
    const effectiveFee = Math.max(0, params.deliveryFee);

    if (effectiveFee <= 0) {
      return { success: false, error: 'O valor da corrida de moto deve ser maior que R$ 0,00.' };
    }

    // A Nexo opera EXCLUSIVAMENTE via créditos arrecadados previamente pela Central
    if (merchant.creditBalance < effectiveFee) {
      return {
        success: false,
        error: `Saldo de créditos insuficiente! Seu saldo atual é R$ ${merchant.creditBalance.toFixed(
          2
        )}, mas esta corrida custa R$ ${effectiveFee.toFixed(
          2
        )}. A Nexo opera 100% via créditos pré-pagos arrecadados pela Central. Faça uma recarga via Pix para solicitar sua corrida!`,
      };
    }

    const previousBalance = merchant.creditBalance;
    const newBalance = previousBalance - effectiveFee;

    // Débito obrigatório do saldo de créditos pré-pagos do passageiro
    setMerchants((prev) =>
      prev.map((m) =>
        m.id === merchant.id
          ? {
              ...m,
              creditBalance: newBalance,
              totalSpent: m.totalSpent + effectiveFee,
              totalDeliveries: m.totalDeliveries + 1,
            }
          : m
      )
    );

    const deliveryNumber = deliveries.length + 1;
    const code = `#${String(deliveryNumber).padStart(5, '0')}`;
    const commissionRate = settings.centralFeePercentage || settings.centralCommissionRate || 0.15;
    const courierEarnings = Number((effectiveFee * (1 - commissionRate)).toFixed(2));
    const centralFee = Number((effectiveFee - courierEarnings).toFixed(2));
    const pinCode = Math.floor(1000 + Math.random() * 9000).toString();

    const newDelivery: Delivery = {
      id: `del-${Date.now()}`,
      code,
      serviceCategory: params.serviceCategory || 'passageiro',
      passengerCount: params.passengerCount || 1,
      itemDescription: params.itemDescription?.trim() || undefined,
      pracaZoneId: params.pracaZoneId || 'praca_1_centro',
      pracaZoneName: params.pracaZoneName || 'Ponto 1 - Centro',
      vehicleType: 'moto',
      paymentMethodType: 'saldo_credito',
      merchantId: merchant.id,
      merchantName: merchant.name,
      merchantPhone: merchant.phone,
      merchantPhotoUrl: merchant.photoUrl || merchant.foto_url,
      passengerPhotoUrl: merchant.photoUrl || merchant.foto_url,
      passageiro_foto: merchant.photoUrl || merchant.foto_url,
      pickupAddress: params.pickupAddress.trim() || merchant.address,
      origem_latitude: params.origemLatitude,
      origem_longitude: params.origemLongitude,
      passengerLat: params.origemLatitude,
      passengerLng: params.origemLongitude,
      deliveryAddress: params.deliveryAddress.trim(),
      destino_latitude: params.destinoLatitude,
      destino_longitude: params.destinoLongitude,
      distancia_estimada_km:
        params.origemLatitude && params.origemLongitude && params.destinoLatitude && params.destinoLongitude
          ? Number((calcularDistanciaMetros(params.origemLatitude, params.origemLongitude, params.destinoLatitude, params.destinoLongitude) / 1000).toFixed(2))
          : undefined,
      gpsLoopActive: true,
      deliveryNeighborhood: params.deliveryNeighborhood?.trim() || undefined,
      customerName: params.customerName?.trim() || merchant.name,
      customerPhone: params.customerPhone?.trim() || merchant.phone,
      deliveryFee: effectiveFee,
      courierEarnings,
      centralFee,
      zoneType: params.zoneType || (params.isRural ? 'rural' : 'urbana_central'),
      zoneLabel: params.zoneLabel,
      zoneReason: params.zoneReason,
      isRural: params.isRural || false,
      ruralAgreedDirectly: false,
      merchandisePaymentMethod: 'Créditos Pré-Pagos Nexo',
      merchandiseAmount: 0,
      merchandisePaymentType: 'online',
      cashChangeFor: undefined,
      needsCashReturnToMerchant: false,
      cashReturnStatus: undefined,
      pinCode,
      pinVerified: false,
      observations: params.observations?.trim() || undefined,
      notes: params.notes?.trim() || undefined,
      status: 'aguardando_entregador',
      statusHistory: [
        {
          status: 'solicitada',
          timestamp: new Date().toISOString(),
          actorId: merchant.id,
          actorName: merchant.name,
          note: `Viagem solicitada para ${params.pracaZoneName || params.zoneLabel || 'Ponto Central'}. Paga via Créditos da Central (R$ ${effectiveFee.toFixed(2)})`,
        },
        {
          status: 'aguardando_entregador',
          timestamp: new Date().toISOString(),
          actorName: 'Nexo Viagens Alagoinha',
          note: 'Disponibilizada no painel para motoristas credenciados. Motorista não cobra nada em mãos.',
        },
      ],
      createdAt: new Date().toISOString(),
    };

    setDeliveries((prev) => [newDelivery, ...prev]);

    // Persistência assíncrona no Supabase
    try {
      const supabase = getSupabase();
      if (supabase) {
        supabase
          .from('corridas')
          .insert([
            {
              id: newDelivery.id,
              codigo_corrida: newDelivery.code,
              passageiro_id: newDelivery.merchantId,
              passageiro_nome: newDelivery.merchantName,
              passageiro_telefone: newDelivery.merchantPhone,
              pickup_address: newDelivery.pickupAddress,
              delivery_address: newDelivery.deliveryAddress,
              origem_latitude: newDelivery.origem_latitude,
              origem_longitude: newDelivery.origem_longitude,
              destino_latitude: newDelivery.destino_latitude,
              destino_longitude: newDelivery.destino_longitude,
              fee: newDelivery.deliveryFee,
              status: newDelivery.status,
              pin_code: newDelivery.pinCode,
              notes: newDelivery.notes || newDelivery.observations,
              created_at: newDelivery.createdAt,
            },
          ])
          .then(({ error }) => {
            if (error) console.warn('Aviso Supabase ao salvar corrida:', error);
          });
      }
    } catch (e) {
      console.warn('Erro ao disparar gravação no Supabase:', e);
    }

    logAudit({
      category: 'entrega',
      actorId: merchant.id,
      actorName: merchant.name,
      actorRole: 'merchant',
      actionType: 'SOLICITACAO_VIAGEM',
      description: `Viagem ${code} solicitada no valor de R$ ${effectiveFee.toFixed(
        2
      )} (${params.pracaZoneName || params.zoneLabel || 'Ponto de Referência'}). Débito de R$ ${effectiveFee.toFixed(
        2
      )} realizado dos Créditos do Passageiro pela Central.`,
      targetId: newDelivery.id,
      previousBalance,
      newBalance,
      details: {
        code,
        fee: effectiveFee,
        courierEarnings,
        centralFee,
        zoneType: newDelivery.zoneType,
        praca: newDelivery.pracaZoneName,
        paymentMethod: 'saldo_credito',
        pickup: newDelivery.pickupAddress,
        dest: newDelivery.deliveryAddress,
      },
    });

    playChime();
    return { success: true, delivery: newDelivery };
  };

  // 2. ACEITAR ENTREGA (Courier / Motorista Parceiro)
  const aceitarEntrega = (deliveryId: string, courierId: string) => {
    const courier = couriers.find((c) => c.id === courierId);
    if (!courier) return { success: false, error: 'Motorista não encontrado.' };
    if (!courier.active) return { success: false, error: 'Conta de motorista inativa ou bloqueada.' };
    if (courier.approvalStatus !== 'aprovado' || !courier.isApproved) {
      return {
        success: false,
        error: 'Acesso pendente: Sua conta de motorista aguarda autorização da administração da Central.',
      };
    }
    if (courier.bloqueado_por_avaliacao) {
      return {
        success: false,
        error: `Conta com restrição preventiva de qualidade por nota média (${courier.avaliacao_media?.toFixed(1) || 'baixa'}). Contate a Central.`,
      };
    }
    if (!courier.isOnline) return { success: false, error: 'Você precisa ficar Online para aceitar viagens.' };

    const targetDelivery = deliveries.find((d) => d.id === deliveryId);
    if (!targetDelivery) return { success: false, error: 'Viagem não encontrada.' };
    // Bloqueio atômico de concorrência: só aceita se estiver aguardando entregador
    if (
      targetDelivery.status !== 'aguardando_entregador' &&
      targetDelivery.status !== 'solicitada' &&
      targetDelivery.status !== 'procurando_mototaxista'
    ) {
      return { success: false, error: 'Esta corrida acabou de ser aceita por outro mototaxista.' };
    }

    const now = new Date().toISOString();
    // Atualiza status do motorista para ocupado/em_corrida
    setCouriers((prev) =>
      prev.map((c) =>
        c.id === courierId
          ? { ...c, disponibilidade: 'em_corrida' }
          : c
      )
    );

    // Resolve coordenadas da praça ou posição do motorista
    const pracaDoMotorista = pracas.find((p) => p.id === courier.assignedZoneId);
    const courierInitLat = pracaDoMotorista?.latitude || -6.9535;
    const courierInitLng = pracaDoMotorista?.longitude || -35.5463;

    setDeliveries((prev) =>
      prev.map((d) => {
        if (d.id !== deliveryId) return d;
        const passengerLat = d.origem_latitude || d.passengerLat;
        const passengerLng = d.origem_longitude || d.passengerLng;
        const distMetros =
          passengerLat && passengerLng
            ? Math.round(calcularDistanciaMetros(courierInitLat, courierInitLng, passengerLat, passengerLng))
            : undefined;
        const tempoMin = distMetros !== undefined ? estimarTempoChegadaMinutos(distMetros, 24) : undefined;

        return {
          ...d,
          mototaxista_id: courier.id,
          mototaxista_nome: courier.name,
          mototaxista_telefone: courier.phone,
          mototaxista_placa: courier.placa_veiculo || courier.vehiclePlate,
          mototaxista_modelo: courier.modelo_veiculo,
          courierId: courier.id,
          courierName: courier.name,
          courierPhone: courier.phone,
          courierPhotoUrl: courier.photoUrl,
          currentCourierLat: courierInitLat,
          currentCourierLng: courierInitLng,
          distanceToPassengerMeters: distMetros,
          estimatedArrivalMinutes: tempoMin,
          lastGpsUpdateAt: now,
          gpsLoopActive: true,
          status: 'entregador_aceitou',
          acceptedAt: now,
          statusHistory: [
            ...d.statusHistory,
            {
              status: 'entregador_aceitou',
              timestamp: now,
              actorId: courier.id,
              actorName: courier.name,
              note: `Motorista parceiro aceitou a viagem (Origem: ${pracaDoMotorista?.nome || 'Praça Central'} - ~${distMetros ? distMetros + 'm' : 'próximo'})`,
            },
          ],
        };
      })
    );

    // Atualiza status do motorista e da corrida no Supabase
    try {
      const supabase = getSupabase();
      if (supabase) {
        supabase
          .from('corridas')
          .update({
            mototaxista_id: courier.id,
            mototaxista_nome: courier.name,
            mototaxista_telefone: courier.phone,
            current_courier_lat: courierInitLat,
            current_courier_lng: courierInitLng,
            status: 'entregador_aceitou',
            updated_at: now,
          })
          .eq('id', deliveryId)
          .then(() => {});
      }
    } catch (err) {
      console.warn('Sync aceitar corrida Supabase:', err);
    }

    logAudit({
      category: 'entrega',
      actorId: courier.id,
      actorName: courier.name,
      actorRole: 'courier',
      actionType: 'ENTREGADOR_ACEITOU',
      description: `Motorista ${courier.name} aceitou a viagem ${targetDelivery.code}.`,
      targetId: deliveryId,
      details: { courierId, code: targetDelivery.code },
    });

    playChime();
    return { success: true };
  };

  // 3. AVANÇAR STATUS DA ENTREGA (Sequential 7-step pipeline)
  const statusPipeline: DeliveryStatus[] = [
    'solicitada',
    'aguardando_entregador',
    'entregador_aceitou',
    'a_caminho_coleta',
    'pedido_coletado',
    'a_caminho_entrega',
    'concluida',
  ];

  const avancarStatusEntrega = (deliveryId: string, actorName?: string, pinInput?: string) => {
    const delivery = deliveries.find((d) => d.id === deliveryId);
    if (!delivery) return { success: false, error: 'Entrega não encontrada.' };
    if (delivery.status === 'concluida') return { success: false, error: 'Esta entrega já foi concluída.' };
    if (delivery.status === 'cancelada') return { success: false, error: 'Esta entrega está cancelada.' };

    const currentIndex = statusPipeline.indexOf(delivery.status);
    if (currentIndex === -1 || currentIndex >= statusPipeline.length - 1) {
      return { success: false, error: 'Não é possível avançar mais o status desta entrega.' };
    }

    const nextStatus = statusPipeline[currentIndex + 1];
    const now = new Date().toISOString();
    const actor = actorName || delivery.courierName || session.adminName || 'Central';

    // Se o próximo passo for conclusão, validação do PIN de segurança
    if (nextStatus === 'concluida' && delivery.pinCode) {
      const isPrivileged = actorName === 'Central' || actorName === 'Admin' || session.role === 'admin';
      if (!isPrivileged) {
        if (!pinInput || pinInput.trim() !== delivery.pinCode.trim()) {
          return {
            success: false,
            error: 'Código PIN inválido! Peça ao cliente o código de 4 dígitos que ele recebeu no WhatsApp.',
          };
        }
      }
    }

    // Step 7: Entrega Concluída -> credit to courier accumulated balance
    if (nextStatus === 'concluida') {
      if (delivery.completedAt) {
        return { success: false, error: 'A entrega já foi finalizada anteriormente.' };
      }

      if (delivery.courierId) {
        const courier = couriers.find((c) => c.id === delivery.courierId);
        if (courier) {
          const prevAccumulated = courier.accumulatedBalance;
          const pilotEarnings = delivery.courierEarnings ?? delivery.deliveryFee;
          const newAccumulated = prevAccumulated + pilotEarnings;

          setCouriers((prev) =>
            prev.map((c) =>
              c.id === courier.id
                ? {
                    ...c,
                    accumulatedBalance: newAccumulated,
                    totalGrossEarned: c.totalGrossEarned + pilotEarnings,
                    completedDeliveries: c.completedDeliveries + 1,
                    disponibilidade: 'disponivel',
                    praca_entrou_em: now,
                  }
                : c
            )
          );

          logAudit({
            category: 'entrega',
            actorId: courier.id,
            actorName: courier.name,
            actorRole: 'courier',
            actionType: 'CONCLUSAO_ENTREGA',
            description: `Corrida ${delivery.code} CONCLUÍDA! (PIN validado com sucesso). Lançado +R$ ${pilotEarnings.toFixed(
              2
            )} no saldo acumulado de repasse para o piloto ${courier.name}. (Taxa da Central retida: R$ ${(delivery.deliveryFee - pilotEarnings).toFixed(2)})`,
            targetId: delivery.id,
            previousBalance: prevAccumulated,
            newBalance: newAccumulated,
            details: {
              deliveryFee: delivery.deliveryFee,
              pilotEarnings,
              centralFee: delivery.centralFee,
              code: delivery.code,
              reachedGoal: newAccumulated >= settings.goalAmount,
            },
          });
        }
      }
    }

    setDeliveries((prev) =>
      prev.map((d) => {
        if (d.id !== deliveryId) return d;
        return {
          ...d,
          status: nextStatus,
          pinVerified: nextStatus === 'concluida' ? true : d.pinVerified,
          collectedAt: nextStatus === 'pedido_coletado' ? now : d.collectedAt,
          completedAt: nextStatus === 'concluida' ? now : d.completedAt,
          statusHistory: [
            ...d.statusHistory,
            {
              status: nextStatus,
              timestamp: now,
              actorName: actor,
              note: getStatusDescription(nextStatus),
            },
          ],
        };
      })
    );

    // Sincroniza avanço de status no Supabase
    try {
      const supabase = getSupabase();
      if (supabase) {
        supabase
          .from('corridas')
          .update({
            status: nextStatus,
            updated_at: now,
          })
          .eq('id', deliveryId)
          .then(() => {});
      }
    } catch (err) {
      console.warn('Sync status Supabase:', err);
    }

    playChime();
    return { success: true };
  };

  // Confirmação pelo entregador de que está retornando ao comércio para levar o dinheiro
  const confirmarRetornoDinheiroEntregador = (deliveryId: string) => {
    const delivery = deliveries.find((d) => d.id === deliveryId);
    if (!delivery) return { success: false, error: 'Entrega não encontrada.' };

    const now = new Date().toISOString();
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId
          ? {
              ...d,
              cashReturnStatus: 'em_retorno',
              cashReturnedAt: now,
              statusHistory: [
                ...d.statusHistory,
                {
                  status: d.status,
                  timestamp: now,
                  actorName: d.courierName || 'Motorista',
                  note: `Motorista a caminho do ponto de encontro (${d.merchantName}) para finalização (${
                    d.merchandiseAmount ? `R$ ${d.merchandiseAmount.toFixed(2)}` : 'acerto'
                  }).`,
                },
              ],
            }
          : d
      )
    );

    playChime();
    return { success: true };
  };

  // Confirmação pelo passageiro de conclusão do trajeto
  const confirmarRecebimentoDinheiroComercio = (deliveryId: string) => {
    const delivery = deliveries.find((d) => d.id === deliveryId);
    if (!delivery) return { success: false, error: 'Viagem não encontrada.' };

    const now = new Date().toISOString();
    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId
          ? {
              ...d,
              cashReturnStatus: 'devolvido',
              cashConfirmedByMerchantAt: now,
              statusHistory: [
                ...d.statusHistory,
                {
                  status: d.status,
                  timestamp: now,
                  actorName: d.merchantName,
                  note: `Passageiro confirmou a conclusão da viagem realizada pelo motorista. Viagem 100% finalizada!`,
                },
              ],
            }
          : d
      )
    );

    logAudit({
      category: 'entrega',
      actorId: delivery.merchantId,
      actorName: delivery.merchantName,
      actorRole: 'merchant',
      actionType: 'ACERTO_DINHEIRO_CONCLUIDO',
      description: `Prestação de contas da entrega ${delivery.code}: ${delivery.merchantName} confirmou recebimento do dinheiro em mãos.`,
      targetId: delivery.id,
      details: {
        code: delivery.code,
        courierName: delivery.courierName,
        amount: delivery.merchandiseAmount,
      },
    });

    playChime();
    return { success: true };
  };

  // 4. CANCELAR ENTREGA (com estorno para o comércio)
  const cancelarEntrega = (deliveryId: string, reason: string, cancelledByRole: UserRole) => {
    const delivery = deliveries.find((d) => d.id === deliveryId);
    if (!delivery) return { success: false, error: 'Entrega não encontrada.' };
    if (delivery.status === 'concluida') return { success: false, error: 'Não é possível cancelar uma entrega já concluída.' };
    if (delivery.status === 'cancelada') return { success: false, error: 'Esta entrega já está cancelada.' };

    const now = new Date().toISOString();
    const actor =
      cancelledByRole === 'admin'
        ? session.adminName || 'Central Nexo'
        : delivery.merchantName;

    // Refund credits to merchant
    const merchant = merchants.find((m) => m.id === delivery.merchantId);
    let prevBal = 0;
    let newBal = 0;
    if (merchant) {
      prevBal = merchant.creditBalance;
      newBal = prevBal + delivery.deliveryFee;
      setMerchants((prev) =>
        prev.map((m) =>
          m.id === merchant.id
            ? {
                ...m,
                creditBalance: newBal,
                totalSpent: Math.max(0, m.totalSpent - delivery.deliveryFee),
                totalDeliveries: Math.max(0, m.totalDeliveries - 1),
              }
            : m
        )
      );
    }

    setDeliveries((prev) =>
      prev.map((d) => {
        if (d.id !== deliveryId) return d;
        return {
          ...d,
          status: 'cancelada',
          cancelledAt: now,
          cancellationReason: reason,
          cancelledBy: actor,
          statusHistory: [
            ...d.statusHistory,
            {
              status: 'cancelada',
              timestamp: now,
              actorName: actor,
              note: `Entrega cancelada: ${reason}. Créditos de R$ ${delivery.deliveryFee.toFixed(2)} estornados.`,
            },
          ],
        };
      })
    );

    logAudit({
      category: 'cancelamento',
      actorId: session.adminName ? 'admin' : delivery.merchantId,
      actorName: actor,
      actorRole: cancelledByRole,
      actionType: 'CANCELAMENTO_ENTREGA',
      description: `Entrega ${delivery.code} cancelada. Motivo: "${reason}". R$ ${delivery.deliveryFee.toFixed(
        2
      )} em créditos estornados para ${delivery.merchantName}.`,
      targetId: delivery.id,
      previousBalance: prevBal,
      newBalance: newBal,
      details: { reason, code: delivery.code, fee: delivery.deliveryFee },
    });

    return { success: true };
  };

  // 4.1 TELEMETRIA GPS EM TEMPO REAL (Loop Inteligente de 15 Segundos)
  const atualizarTelemetriaGps = (
    deliveryId: string,
    telemetria: {
      courierLat?: number;
      courierLng?: number;
      heading?: number;
      speed?: number;
      passengerLat?: number;
      passengerLng?: number;
    }
  ) => {
    setDeliveries((prev) =>
      prev.map((d) => {
        if (d.id !== deliveryId) return d;

        const courierLat = telemetria.courierLat ?? d.currentCourierLat;
        const courierLng = telemetria.courierLng ?? d.currentCourierLng;
        const passengerLat = telemetria.passengerLat ?? d.passengerLat ?? d.origem_latitude;
        const passengerLng = telemetria.passengerLng ?? d.passengerLng ?? d.origem_longitude;
        const destinoLat = d.destino_latitude;
        const destinoLng = d.destino_longitude;

        let distanceToPassengerMeters = d.distanceToPassengerMeters;
        let distanceToDestinationMeters = d.distanceToDestinationMeters;
        let estimatedArrivalMinutes = d.estimatedArrivalMinutes;

        // Se o motorista está a caminho do passageiro (coleta)
        if (courierLat && courierLng && passengerLat && passengerLng) {
          distanceToPassengerMeters = Math.round(
            calcularDistanciaMetros(courierLat, courierLng, passengerLat, passengerLng)
          );
        }

        // Se o motorista está a caminho do destino com passageiro embarcado
        if (courierLat && courierLng && destinoLat && destinoLng) {
          distanceToDestinationMeters = Math.round(
            calcularDistanciaMetros(courierLat, courierLng, destinoLat, destinoLng)
          );
        }

        // Estima o tempo para a próxima etapa (coleta ou desembarque)
        const isEmTransitoDestino =
          d.status === 'a_caminho_entrega' ||
          d.status === 'corrida_iniciada' ||
          d.status === 'pedido_coletado';

        const distanciaAlvo = isEmTransitoDestino
          ? (distanceToDestinationMeters ?? distanceToPassengerMeters)
          : distanceToPassengerMeters;

        if (distanciaAlvo !== undefined && distanciaAlvo !== null) {
          estimatedArrivalMinutes = estimarTempoChegadaMinutos(distanciaAlvo, 24);
        }

        return {
          ...d,
          currentCourierLat: courierLat,
          currentCourierLng: courierLng,
          currentCourierHeading: telemetria.heading ?? d.currentCourierHeading,
          currentCourierSpeed: telemetria.speed ?? d.currentCourierSpeed,
          passengerLat,
          passengerLng,
          distanceToPassengerMeters,
          distanceToDestinationMeters,
          estimatedArrivalMinutes,
          lastGpsUpdateAt: new Date().toISOString(),
          gpsLoopActive: true,
        };
      })
    );

    // Persistência inteligente do GPS a cada 15s no Supabase
    throttleAction(`gps_sync_${deliveryId}`, 14000, () => {
      try {
        const supabase = getSupabase();
        if (supabase) {
          supabase
            .from('corridas')
            .update({
              current_courier_lat: telemetria.courierLat,
              current_courier_lng: telemetria.courierLng,
              updated_at: new Date().toISOString(),
            })
            .eq('id', deliveryId)
            .then(() => {});
        }
      } catch (err) {
        console.warn('Sync GPS Supabase:', err);
      }
    });
  };

  // 5. SOLICITAR RECARGA DE CRÉDITOS (Passageiro)
  const solicitarRecarga = (merchantId: string, amount: number, notes?: string) => {
    const merchant = merchants.find((m) => m.id === merchantId);
    if (!merchant) return { success: false, error: 'Passageiro não encontrado.' };
    if (amount <= 0) return { success: false, error: 'O valor da recarga deve ser maior que R$ 0,00.' };

    const rechargeNumber = recharges.length + 1;
    const code = `REC-${String(rechargeNumber).padStart(4, '0')}`;

    const newRecharge: CreditRecharge = {
      id: `rec-${Date.now()}`,
      code,
      merchantId: merchant.id,
      merchantName: merchant.name,
      amountRequested: amount,
      status: 'aguardando_pix',
      previousBalance: merchant.creditBalance,
      createdAt: new Date().toISOString(),
      notes: notes || 'Passageiro informou Pix realizado para a Central Nexo Viagens.',
    };

    setRecharges((prev) => [newRecharge, ...prev]);

    logAudit({
      category: 'credito',
      actorId: merchant.id,
      actorName: merchant.name,
      actorRole: 'merchant',
      actionType: 'SOLICITACAO_RECARGA_PIX',
      description: `Passageiro ${merchant.name} solicitou recarga ${code} de R$ ${amount.toFixed(2)} via Pix.`,
      targetId: newRecharge.id,
      previousBalance: merchant.creditBalance,
      newBalance: merchant.creditBalance,
      details: { code, amount },
    });

    return { success: true, recharge: newRecharge };
  };

  // 6. CONFIRMAR RECARGA PIX (Admin)
  const confirmarRecargaPix = (rechargeId: string, pixRef?: string) => {
    const recharge = recharges.find((r) => r.id === rechargeId);
    if (!recharge) return { success: false, error: 'Recarga não encontrada.' };
    if (recharge.status !== 'aguardando_pix') {
      return { success: false, error: 'Esta solicitação de recarga já foi processada.' };
    }

    const merchant = merchants.find((m) => m.id === recharge.merchantId);
    if (!merchant) return { success: false, error: 'Passageiro não encontrado.' };

    const prevBal = merchant.creditBalance;
    const newBal = prevBal + recharge.amountRequested;
    const now = new Date().toISOString();
    const adminName = session.adminName || 'Central Nexo (ADM)';

    setMerchants((prev) =>
      prev.map((m) =>
        m.id === merchant.id
          ? {
              ...m,
              creditBalance: newBal,
            }
          : m
      )
    );

    setRecharges((prev) =>
      prev.map((r) =>
        r.id === rechargeId
          ? {
              ...r,
              status: 'confirmado',
              amountReceived: r.amountRequested,
              adminConfirmedBy: adminName,
              confirmedAt: now,
              newBalance: newBal,
              pixReference: pixRef || `PIX-${Date.now().toString(36).toUpperCase()}`,
            }
          : r
      )
    );

    logAudit({
      category: 'credito',
      actorId: 'admin',
      actorName: adminName,
      actorRole: 'admin',
      actionType: 'CONFIRMACAO_RECARGA_PIX',
      description: `Pagamento Pix de R$ ${recharge.amountRequested.toFixed(2)} confirmado para ${
        merchant.name
      }. Saldo liberado. (Anterior: R$ ${prevBal.toFixed(2)} -> Novo: R$ ${newBal.toFixed(2)})`,
      targetId: recharge.id,
      previousBalance: prevBal,
      newBalance: newBal,
      details: {
        rechargeCode: recharge.code,
        amount: recharge.amountRequested,
        pixRef,
        confirmedBy: adminName,
      },
    });

    playChime();
    return { success: true };
  };

  // 7. RECUSAR RECARGA PIX (Admin)
  const recusarRecargaPix = (rechargeId: string, reason: string) => {
    const recharge = recharges.find((r) => r.id === rechargeId);
    if (!recharge) return { success: false, error: 'Recarga não encontrada.' };
    if (recharge.status !== 'aguardando_pix') {
      return { success: false, error: 'Esta recarga já foi processada.' };
    }

    const adminName = session.adminName || 'Central Nexo (ADM)';
    setRecharges((prev) =>
      prev.map((r) =>
        r.id === rechargeId
          ? {
              ...r,
              status: 'rejeitado',
              adminConfirmedBy: adminName,
              notes: `Recusado pelo administrador: ${reason}`,
            }
          : r
      )
    );

    logAudit({
      category: 'credito',
      actorId: 'admin',
      actorName: adminName,
      actorRole: 'admin',
      actionType: 'RECUSA_RECARGA_PIX',
      description: `Solicitação de recarga ${recharge.code} de ${recharge.merchantName} recusada. Motivo: ${reason}`,
      targetId: recharge.id,
      details: { reason, rechargeCode: recharge.code },
    });

    return { success: true };
  };

  // 8. SOLICITAR SAQUE (Motorista - Enforces R$ 250 goal)
  const solicitarSaque = (courierId: string, pixKey: string, pixKeyType: PixKeyType) => {
    const courier = couriers.find((c) => c.id === courierId);
    if (!courier) return { success: false, error: 'Motorista não encontrado.' };

    if (courier.accumulatedBalance < settings.goalAmount) {
      return {
        success: false,
        error: `Meta não atingida! Você acumulou R$ ${courier.accumulatedBalance.toFixed(
          2
        )} de R$ ${settings.goalAmount.toFixed(2)}. O saque só é liberado ao atingir a meta.`,
      };
    }

    const hasPending = withdrawals.some(
      (w) => w.courierId === courierId && w.status === 'aguardando_pagamento'
    );
    if (hasPending) {
      return {
        success: false,
        error: 'Você já possui uma solicitação de saque em análise pela Central.',
      };
    }

    const grossAmount = settings.goalAmount; // R$ 250.00
    const centralFeeAmount = grossAmount * settings.centralCommissionRate; // R$ 75.00
    const netAmount = grossAmount - centralFeeAmount; // R$ 175.00

    const withdrawalNumber = withdrawals.length + 1;
    const code = `SAQ-${String(withdrawalNumber).padStart(4, '0')}`;

    const newWithdrawal: Withdrawal = {
      id: `saq-${Date.now()}`,
      code,
      courierId: courier.id,
      courierName: courier.name,
      courierPhone: courier.phone,
      courierPixKey: pixKey.trim() || courier.pixKey,
      courierPixKeyType: pixKeyType || courier.pixKeyType,
      grossAmount,
      centralFeeRate: settings.centralCommissionRate,
      centralFeeAmount,
      netAmount,
      status: 'aguardando_pagamento',
      createdAt: new Date().toISOString(),
    };

    setWithdrawals((prev) => [newWithdrawal, ...prev]);

    logAudit({
      category: 'saque',
      actorId: courier.id,
      actorName: courier.name,
      actorRole: 'courier',
      actionType: 'SOLICITACAO_SAQUE_META',
      description: `Meta de R$ ${grossAmount.toFixed(2)} atingida! Saque ${code} solicitado por ${
        courier.name
      }. (Valor Líquido: R$ ${netAmount.toFixed(2)} | Taxa Nexo Central 30%: R$ ${centralFeeAmount.toFixed(2)})`,
      targetId: newWithdrawal.id,
      details: {
        code,
        grossAmount,
        centralFeeAmount,
        netAmount,
        pixKey: newWithdrawal.courierPixKey,
      },
    });

    playChime();
    return { success: true, withdrawal: newWithdrawal };
  };

  // 9. CONFIRMAR PAGAMENTO DE SAQUE (Admin via Pix)
  const confirmarPagamentoSaque = (withdrawalId: string, pixTransactionId?: string) => {
    const withdrawal = withdrawals.find((w) => w.id === withdrawalId);
    if (!withdrawal) return { success: false, error: 'Solicitação de saque não encontrada.' };
    if (withdrawal.status !== 'aguardando_pagamento') {
      return { success: false, error: 'Este saque já foi processado.' };
    }

    const courier = couriers.find((c) => c.id === withdrawal.courierId);
    if (!courier) return { success: false, error: 'Motorista não encontrado.' };

    const now = new Date().toISOString();
    const adminName = session.adminName || 'Central Nexo (ADM)';

    // Reset accumulated balance cycle (excess rolls over)
    const excess = Math.max(0, courier.accumulatedBalance - withdrawal.grossAmount);

    setCouriers((prev) =>
      prev.map((c) =>
        c.id === courier.id
          ? {
              ...c,
              accumulatedBalance: excess,
              totalNetPaid: c.totalNetPaid + withdrawal.netAmount,
              totalWithdrawalsCount: c.totalWithdrawalsCount + 1,
            }
          : c
      )
    );

    setWithdrawals((prev) =>
      prev.map((w) =>
        w.id === withdrawalId
          ? {
              ...w,
              status: 'pago',
              adminConfirmedBy: adminName,
              paidAt: now,
              pixReceiptTransactionId:
                pixTransactionId || `E${Date.now()}P${Math.floor(Math.random() * 10000)}`,
            }
          : w
      )
    );

    logAudit({
      category: 'saque',
      actorId: 'admin',
      actorName: adminName,
      actorRole: 'admin',
      actionType: 'PAGAMENTO_SAQUE_PIX',
      description: `Pagamento de saque ${withdrawal.code} CONFIRMADO via Pix para ${
        courier.name
      }. Líquido pago: R$ ${withdrawal.netAmount.toFixed(
        2
      )}. Taxa Central retida (30%): R$ ${withdrawal.centralFeeAmount.toFixed(2)}. Ciclo encerrado e reiniciado.`,
      targetId: withdrawal.id,
      previousBalance: courier.accumulatedBalance,
      newBalance: excess,
      details: {
        code: withdrawal.code,
        gross: withdrawal.grossAmount,
        fee: withdrawal.centralFeeAmount,
        net: withdrawal.netAmount,
        pixTx: pixTransactionId,
      },
    });

    playChime();
    return { success: true };
  };

  // 10. RECUSAR SAQUE (Admin)
  const recusarSaque = (withdrawalId: string, reason: string) => {
    const withdrawal = withdrawals.find((w) => w.id === withdrawalId);
    if (!withdrawal) return { success: false, error: 'Saque não encontrado.' };

    const adminName = session.adminName || 'Central Nexo (ADM)';
    setWithdrawals((prev) =>
      prev.map((w) =>
        w.id === withdrawalId
          ? {
              ...w,
              status: 'recusado',
              adminConfirmedBy: adminName,
            }
          : w
      )
    );

    logAudit({
      category: 'saque',
      actorId: 'admin',
      actorName: adminName,
      actorRole: 'admin',
      actionType: 'RECUSA_SAQUE',
      description: `Saque ${withdrawal.code} de ${withdrawal.courierName} recusado. Motivo: ${reason}`,
      targetId: withdrawal.id,
      details: { reason, code: withdrawal.code },
    });

    return { success: true };
  };

  // 11. GESTÃO DE PASSAGEIROS (Admin)
  const criarComercio = (
    data: Omit<Merchant, 'id' | 'totalSpent' | 'totalDeliveries' | 'createdAt'> & { creditBalance?: number }
  ) => {
    const initialBal = Number(data.creditBalance) || 0.0;
    const newMerchant: Merchant = {
      ...data,
      id: `merch-${Date.now()}`,
      creditBalance: initialBal,
      totalSpent: 0.0,
      totalDeliveries: 0,
      createdAt: new Date().toISOString(),
    };

    setMerchants((prev) => [newMerchant, ...prev]);

    logAudit({
      category: 'usuario',
      actorId: 'admin',
      actorName: session.adminName || 'Central Nexo (ADM)',
      actorRole: 'admin',
      actionType: 'CADASTRO_COMERCIO',
      description: `Novo passageiro cadastrado pela Central: "${newMerchant.name}" (${newMerchant.phone}) com saldo inicial de R$ ${initialBal.toFixed(2)}.`,
      targetId: newMerchant.id,
      newBalance: initialBal,
    });

    playChime();
    return { success: true, merchant: newMerchant };
  };

  const editarComercio = (id: string, updates: Partial<Merchant>) => {
    setMerchants((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
    logAudit({
      category: 'usuario',
      actorId: 'admin',
      actorName: session.adminName || 'Central Nexo (ADM)',
      actorRole: 'admin',
      actionType: 'EDICAO_COMERCIO',
      description: `Dados do passageiro ID ${id} atualizados.`,
      targetId: id,
    });
  };

  const toggleComercioStatus = (id: string) => {
    const m = merchants.find((item) => item.id === id);
    if (!m) return;
    const newStatus = !m.active;
    setMerchants((prev) =>
      prev.map((item) => (item.id === id ? { ...item, active: newStatus } : item))
    );
    logAudit({
      category: 'usuario',
      actorId: 'admin',
      actorName: session.adminName || 'Central Nexo (ADM)',
      actorRole: 'admin',
      actionType: newStatus ? 'ATIVACAO_COMERCIO' : 'BLOQUEIO_COMERCIO',
      description: `Passageiro "${m.name}" ${newStatus ? 'ATIVADO' : 'BLOQUEADO'} pela Central.`,
      targetId: id,
    });
  };

  const confirmarPassageiro = (merchantId: string, creditBonus: number = 0) => {
    const bonus = Math.max(0, creditBonus || 0);
    setMerchants((prev) =>
      prev.map((m) => {
        if (m.id === merchantId) {
          const newCredit = (m.creditBalance || 0) + bonus;
          return {
            ...m,
            active: true,
            ativo: true,
            status_cadastro: 'confirmado',
            confirmedAt: new Date().toISOString(),
            confirmedBy: session.adminName || 'Central Nexo (ADM)',
            creditBalance: newCredit,
            saldo_creditos: newCredit,
          };
        }
        return m;
      })
    );

    const pass = merchants.find((m) => m.id === merchantId);
    logAudit({
      category: 'usuario',
      actorId: 'admin',
      actorName: session.adminName || 'Central Nexo (ADM)',
      actorRole: 'admin',
      actionType: 'CONFIRMACAO_PASSAGEIRO',
      description: `Central confirmou e ativou o cadastro do passageiro "${pass?.name || merchantId}" com bônus de R$ ${bonus.toFixed(2)}.`,
      targetId: merchantId,
      newBalance: (pass?.creditBalance || 0) + bonus,
    });

    playChime();
  };

  const ajustarCreditoManual = (merchantId: string, amountChange: number, reason: string) => {
    const m = merchants.find((item) => item.id === merchantId);
    if (!m) return;
    const prevBal = m.creditBalance;
    const newBal = Math.max(0, prevBal + amountChange);

    setMerchants((prev) =>
      prev.map((item) =>
        item.id === merchantId ? { ...item, creditBalance: newBal } : item
      )
    );

    logAudit({
      category: 'credito',
      actorId: 'admin',
      actorName: session.adminName || 'Central Nexo (ADM)',
      actorRole: 'admin',
      actionType: 'AJUSTE_CREDITO_MANUAL',
      description: `Ajuste manual de créditos para ${m.name}: ${amountChange >= 0 ? '+' : ''}R$ ${amountChange.toFixed(
        2
      )}. Motivo: ${reason}`,
      targetId: merchantId,
      previousBalance: prevBal,
      newBalance: newBal,
      details: { amountChange, reason },
    });
  };

  // 12. GESTÃO DE PILOTOS DE MOTO (Admin)
  const autorizarPiloto = (courierId: string, status: PilotApprovalStatus) => {
    const isApp = status === 'aprovado';
    setCouriers((prev) =>
      prev.map((c) => {
        if (c.id === courierId) {
          return {
            ...c,
            approvalStatus: status,
            isApproved: isApp,
            authorizedAt: isApp ? new Date().toISOString() : c.authorizedAt,
            authorizedBy: session.adminName || 'Central ADM',
            isOnline: isApp ? c.isOnline : false, // se bloqueado/pendente, desliga imediatamente
          };
        }
        return c;
      })
    );

    const pilot = couriers.find((c) => c.id === courierId);
    logAudit({
      category: 'usuario',
      actorId: 'admin',
      actorName: session.adminName || 'Central ADM',
      actorRole: 'admin',
      actionType: 'AUTORIZACAO_PILOTO_MOTO',
      description: `Piloto "${pilot?.name || courierId}" teve o acesso ${
        status === 'aprovado'
          ? 'AUTORIZADO com sucesso'
          : status === 'bloqueado'
          ? 'BLOQUEADO'
          : 'marcado como PENDENTE DE APROVAÇÃO'
      } pela Central.`,
      targetId: courierId,
    });

    playChime();
  };

  const criarEntregador = (
    data: Omit<
      Courier,
      | 'id'
      | 'accumulatedBalance'
      | 'totalGrossEarned'
      | 'totalNetPaid'
      | 'completedDeliveries'
      | 'totalWithdrawalsCount'
      | 'createdAt'
    >
  ) => {
    const isApp = data.approvalStatus === 'aprovado' || data.isApproved !== false;
    const newCourier: Courier = {
      ...data,
      id: `cour-${Date.now()}`,
      vehicleType: 'moto', // EXCLUSIVO PARA MOTOS
      approvalStatus: data.approvalStatus || 'aprovado',
      isApproved: isApp,
      authorizedAt: isApp ? new Date().toISOString() : undefined,
      authorizedBy: isApp ? (session.adminName || 'Central ADM') : undefined,
      assignedZoneId: data.assignedZoneId || 'praca_1_centro',
      accumulatedBalance: 0.0,
      totalGrossEarned: 0.0,
      totalNetPaid: 0.0,
      completedDeliveries: 0,
      totalWithdrawalsCount: 0,
      createdAt: new Date().toISOString(),
    };

    setCouriers((prev) => [newCourier, ...prev]);

    logAudit({
      category: 'usuario',
      actorId: 'admin',
      actorName: session.adminName || 'Central Nexo (ADM)',
      actorRole: 'admin',
      actionType: 'CADASTRO_PILOTO_MOTO',
      description: `Novo piloto de moto cadastrado pela Central: "${newCourier.name}" (${newCourier.phone}). Status: ${newCourier.approvalStatus.toUpperCase()}`,
      targetId: newCourier.id,
    });

    playChime();
    return { success: true, courier: newCourier };
  };

  const editarEntregador = (id: string, updates: Partial<Courier>) => {
    setCouriers((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = { ...c, ...updates, vehicleType: 'moto' as const };
          if (updates.approvalStatus) {
            updated.isApproved = updates.approvalStatus === 'aprovado';
            if (updated.approvalStatus !== 'aprovado') {
              updated.isOnline = false;
            }
          }
          return updated;
        }
        return c;
      })
    );
    logAudit({
      category: 'usuario',
      actorId: 'admin',
      actorName: session.adminName || 'Central Nexo (ADM)',
      actorRole: 'admin',
      actionType: 'EDICAO_PILOTO',
      description: `Dados do piloto ID ${id} atualizados pela Central.`,
      targetId: id,
    });
  };

  const toggleEntregadorStatus = (id: string) => {
    const c = couriers.find((item) => item.id === id);
    if (!c) return;
    const newStatus = !c.active;
    setCouriers((prev) =>
      prev.map((item) => (item.id === id ? { ...item, active: newStatus, isOnline: newStatus ? item.isOnline : false } : item))
    );
    logAudit({
      category: 'usuario',
      actorId: 'admin',
      actorName: session.adminName || 'Central Nexo (ADM)',
      actorRole: 'admin',
      actionType: newStatus ? 'ATIVACAO_PILOTO' : 'BLOQUEIO_PILOTO',
      description: `Piloto de moto "${c.name}" ${newStatus ? 'ATIVADO' : 'BLOQUEADO'} pela Central.`,
      targetId: id,
    });
  };

  const toggleEntregadorOnline = (id: string) => {
    const c = couriers.find((item) => item.id === id);
    if (!c) return;
    if (c.approvalStatus !== 'aprovado' || !c.isApproved) {
      return; // Piloto pendente de autorização não pode ficar online
    }
    setCouriers((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isOnline: !item.isOnline } : item))
    );
  };

  const updateSettings = (newSettings: Partial<CentralSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Helper to completely clear all data (zerar tudo para testes limpos)
  const limparTudoZerado = () => {
    localStorage.clear();
    setSession({
      role: null,
      portalView: 'landing',
      isAuthenticated: false,
    });
    setSettings(INITIAL_SETTINGS);
    setMerchants([]);
    setCouriers([]);
    setDeliveries([]);
    setRecharges([]);
    setWithdrawals([]);
    setAuditLogs([]);
  };

  // Optional: Quick Load sample test accounts if needed
  const carregarDadosExemplo = () => {
    const demoMerchants: Merchant[] = [
      {
        id: 'merch-demo-1',
        name: 'Severino Lima (Passageiro)',
        ownerName: 'Severino Lima',
        phone: '(83) 98888-1111',
        address: 'Rua Coronel Jonas, 120 - Centro, Alagoinha-PB',
        creditBalance: 50.00,
        totalSpent: 0.00,
        totalDeliveries: 0,
        active: true,
        password: '123',
        createdAt: new Date().toISOString(),
      }
    ];

    const demoCouriers: Courier[] = [
      {
        id: 'cour-demo-1',
        name: 'João Marcos Motorista',
        phone: '(83) 99999-2222',
        cpf: '123.456.789-00',
        vehicleType: 'moto',
        vehiclePlate: 'NEX-2026',
        pixKey: '83999992222',
        pixKeyType: 'telefone',
        active: true,
        isOnline: true,
        approvalStatus: 'aprovado',
        isApproved: true,
        authorizedAt: new Date().toISOString(),
        authorizedBy: 'Central ADM',
        assignedZoneId: 'praca_1_centro',
        accumulatedBalance: 240.00,
        totalGrossEarned: 240.00,
        totalNetPaid: 0.00,
        completedDeliveries: 24,
        totalWithdrawalsCount: 0,
        password: '123',
        createdAt: new Date().toISOString(),
      }
    ];

    setMerchants(demoMerchants);
    setCouriers(demoCouriers);
  };

  // PRAÇAS
  const adicionarPraca = (nome: string, endereco_referencia: string, latitude?: number, longitude?: number) => {
    const novaPraca: Praca = {
      id: `praca-${Date.now()}`,
      nome,
      endereco_referencia,
      latitude: latitude || -6.9535,
      longitude: longitude || -35.5463,
      ativa: true,
      mototaxistas_vinculados: 0,
      mototaxistas_disponiveis: 0,
      created_at: new Date().toISOString(),
    };
    setPracas((prev) => [novaPraca, ...prev]);
    logAudit({
      category: 'sistema',
      actorId: 'admin',
      actorName: session.adminName || 'Central ADM',
      actorRole: 'admin',
      actionType: 'CADASTRO_PRACA',
      description: `Nova Praça cadastrada: "${nome}" (${endereco_referencia}).`,
      targetId: novaPraca.id,
    });
    fetch('/api/pracas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novaPraca),
    }).catch(() => {});
  };

  const editarPraca = (id: string, updates: Partial<Praca>) => {
    setPracas((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const togglePracaStatus = (id: string) => {
    setPracas((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const novoStatus = !p.ativa;
        logAudit({
          category: 'sistema',
          actorId: 'admin',
          actorName: session.adminName || 'Central ADM',
          actorRole: 'admin',
          actionType: novoStatus ? 'ATIVACAO_PRACA' : 'DESATIVACAO_PRACA',
          description: `Praça "${p.nome}" ${novoStatus ? 'ATIVADA' : 'DESATIVADA'}.`,
          targetId: id,
        });
        return { ...p, ativa: novoStatus };
      })
    );
  };

  // MOTOTAXISTA CONTROLS
  const atualizarDisponibilidadeMototaxista = (courierId: string, status: StatusDisponibilidadeMototaxista) => {
    setCouriers((prev) =>
      prev.map((c) =>
        c.id === courierId
          ? {
              ...c,
              disponibilidade: status,
              isOnline: status === 'disponivel',
            }
          : c
      )
    );
  };

  const atualizarPracaMototaxista = (courierId: string, pracaId: string) => {
    const praca = pracas.find((p) => p.id === pracaId);
    const now = new Date().toISOString();
    setCouriers((prev) =>
      prev.map((c) =>
        c.id === courierId
          ? {
              ...c,
              praca_atual_id: pracaId,
              praca_atual_nome: praca?.nome,
              assignedZoneId: pracaId,
              praca_entrou_em: now, // Entra na fila virtual FIFO da praça
            }
          : c
      )
    );
  };

  const moderarMototaxista = (courierId: string, status: StatusAprovacaoMototaxista, motivo?: string) => {
    autorizarPiloto(courierId, status);
  };

  // 13. Fila Virtual FIFO por Praça
  const obterPosicaoFilaMototaxista = (courierId: string) => {
    const courier = couriers.find((c) => c.id === courierId);
    if (!courier || !courier.praca_atual_id || courier.disponibilidade !== 'disponivel' || !courier.isOnline) {
      return null;
    }

    const pilotosNaPraca = couriers.filter(
      (c) =>
        c.praca_atual_id === courier.praca_atual_id &&
        c.disponibilidade === 'disponivel' &&
        c.isOnline &&
        c.active &&
        c.approvalStatus === 'aprovado'
    );

    pilotosNaPraca.sort((a, b) => {
      const timeA = a.praca_entrou_em ? new Date(a.praca_entrou_em).getTime() : 0;
      const timeB = b.praca_entrou_em ? new Date(b.praca_entrou_em).getTime() : 0;
      return timeA - timeB;
    });

    const index = pilotosNaPraca.findIndex((c) => c.id === courierId);
    if (index === -1) return null;

    return {
      posicao: index + 1,
      totalNaFila: pilotosNaPraca.length,
      isPrimeiro: index === 0,
    };
  };

  // Sugestão 8: Anti-Vaga Ocupada / Confirmação de Presença
  const confirmarPresencaNaFila = (courierId: string) => {
    const now = new Date().toISOString();
    setCouriers((prev) =>
      prev.map((c) =>
        c.id === courierId
          ? {
              ...c,
              ultima_atividade_fila: now,
              alerta_inatividade: false,
            }
          : c
      )
    );
  };

  const pausarMototaxistaInativo = (courierId: string, motivo?: string) => {
    setCouriers((prev) =>
      prev.map((c) =>
        c.id === courierId
          ? {
              ...c,
              disponibilidade: 'pausado',
              isOnline: false,
              alerta_inatividade: false,
            }
          : c
      )
    );
    logAudit({
      category: 'usuario',
      actorId: 'sistema',
      actorName: 'Anti-Vaga Ocupada',
      actorRole: 'admin',
      actionType: 'PAUSA_INATIVIDADE_FILA',
      description: `Mototaxista colocado em pausa por inatividade na praça: ${motivo || 'Tempo limite sem confirmação de presença.'}`,
      targetId: courierId,
    });
  };

  // Sugestão 7: Tarifa Dinâmica & Bandeira Especial
  const toggleTarifaDinamica = (ativa: boolean, motivo?: string, adicional?: number) => {
    setSettings((prev) => {
      const updated: CentralSettings = {
        ...prev,
        tarifa_dinamica_ativa: ativa,
        tarifa_dinamica_motivo: motivo || prev.tarifa_dinamica_motivo || 'Chuva Intensa',
        tarifa_dinamica_adicional: adicional !== undefined ? adicional : (prev.tarifa_dinamica_adicional ?? 2.00),
      };
      localStorage.setItem(`${STORAGE_PREFIX}settings`, JSON.stringify(updated));
      return updated;
    });

    logAudit({
      category: 'sistema',
      actorId: session.adminName || 'admin',
      actorName: session.adminName || 'Central',
      actorRole: 'admin',
      actionType: 'ALTERACAO_TARIFA_DINAMICA',
      description: ativa
        ? `Bandeira especial/Tarifa dinâmica ATIVADA (${motivo || 'Chuva/Eventos'} - Adicional R$ ${(adicional ?? 2.00).toFixed(2)})`
        : `Bandeira especial/Tarifa dinâmica DESATIVADA`,
    });
  };

  // Sugestão 1: Rastreio Público de Corrida (Segurança da Família)
  const obterCorridaPorCodigo = (codigo: string): Delivery | undefined => {
    if (!codigo) return undefined;
    const clean = codigo.trim().toUpperCase().replace('#', '');
    return deliveries.find((d) => {
      const dCode = String(d.code).toUpperCase().replace('#', '');
      return dCode === clean || d.id.toUpperCase() === clean || d.id.replace('del-', '').toUpperCase() === clean;
    });
  };

  // 14. Chat em tempo real na corrida
  const enviarMensagemChat = (
    deliveryId: string,
    texto: string,
    remetenteId: string,
    remetenteTipo: TipoUsuario,
    remetenteNome: string,
    rapida?: boolean
  ) => {
    const novaMensagem: MensagemChat = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      corrida_id: deliveryId,
      remetente_id: remetenteId,
      remetente_tipo: remetenteTipo,
      remetente_nome: remetenteNome,
      texto,
      rapida: Boolean(rapida),
      enviada_em: new Date().toISOString(),
    };

    setDeliveries((prev) =>
      prev.map((d) => {
        if (d.id !== deliveryId) return d;
        const mensagens = d.mensagens_chat || [];
        return {
          ...d,
          mensagens_chat: [...mensagens, novaMensagem],
        };
      })
    );

    playChime();
  };

  // 15. Botão SOS / Pânico
  const acionarSos = (
    deliveryId: string,
    acionadoPor: string,
    papel: string,
    detalhes?: string
  ) => {
    const now = new Date().toISOString();
    setDeliveries((prev) =>
      prev.map((d) => {
        if (d.id !== deliveryId) return d;
        return {
          ...d,
          sos_acionado: true,
          sos_acionado_por: acionadoPor,
          sos_acionado_em: now,
          statusHistory: [
            ...d.statusHistory,
            {
              status: d.status,
              timestamp: now,
              actorName: `${acionadoPor} (${papel})`,
              note: `🚨 ALERTA SOS ACIONADO! ${detalhes || 'Emergência registrada durante a corrida.'}`,
            },
          ],
        };
      })
    );

    logAudit({
      category: 'sistema',
      actorId: acionadoPor,
      actorName: acionadoPor,
      actorRole: papel as any,
      actionType: 'SOS_EMERGENCIA_ACIONADO',
      description: `🚨 ALERTA SOS ACIONADO na corrida ${deliveryId} por ${acionadoPor} (${papel}).`,
      targetId: deliveryId,
      details: { detalhes, horario: now },
    });
  };

  // AVALIAÇÃO DE CORRIDA COM TRAVA DE QUALIDADE
  const avaliarCorrida = (deliveryId: string, estrelas: number, comentario?: string) => {
    const delivery = deliveries.find((d) => d.id === deliveryId);
    const now = new Date().toISOString();

    setDeliveries((prev) =>
      prev.map((d) =>
        d.id === deliveryId
          ? {
              ...d,
              avaliacao_estrelas: estrelas,
              avaliacao_comentario: comentario,
              avaliado_em: now,
            }
          : d
      )
    );

    if (delivery?.courierId) {
      setCouriers((prev) =>
        prev.map((c) => {
          if (c.id !== delivery.courierId) return c;
          const totalAnt = c.total_avaliacoes || 0;
          const mediaAnt = c.avaliacao_media || 5.0;
          const novoTotal = totalAnt + 1;
          const novaMedia = parseFloat(((mediaAnt * totalAnt + estrelas) / novoTotal).toFixed(2));
          
          // Trava de qualidade automática
          const notaMinima = settings.nota_minima_qualidade || 3.8;
          const deveBloquear = novoTotal >= 5 && novaMedia < notaMinima;

          if (deveBloquear && !c.bloqueado_por_avaliacao) {
            logAudit({
              category: 'usuario',
              actorId: 'sistema',
              actorName: 'Trava de Qualidade Automática',
              actorRole: 'admin',
              actionType: 'BLOQUEIO_QUALIDADE_AVALIACAO',
              description: `Mototaxista ${c.name} bloqueado preventivamente: média de avaliações (${novaMedia.toFixed(2)}) abaixo da nota mínima permitida (${notaMinima.toFixed(1)}).`,
              targetId: c.id,
            });
          }

          return {
            ...c,
            total_avaliacoes: novoTotal,
            avaliacao_media: novaMedia,
            bloqueado_por_avaliacao: deveBloquear ? true : c.bloqueado_por_avaliacao,
            motivo_bloqueio_avaliacao: deveBloquear
              ? `Média de avaliações (${novaMedia.toFixed(2)}) abaixo da nota mínima permitida (${notaMinima.toFixed(1)}).`
              : c.motivo_bloqueio_avaliacao,
            isOnline: deveBloquear ? false : c.isOnline,
            disponibilidade: deveBloquear ? 'offline' : c.disponibilidade,
          };
        })
      );
    }
  };

  return (
    <AppContext.Provider
      value={{
        session,
        setSession,
        setPortalView,
        loginAdmin,
        loginMerchant,
        loginCourier,
        cadastrarComercio,
        cadastrarEntregador,
        logout,
        currentMerchant,
        currentCourier,
        settings,
        updateSettings,
        merchants,
        couriers,
        deliveries,
        recharges,
        withdrawals,
        auditLogs,
        pracas,
        soundEnabled,
        setSoundEnabled,
        playChime,
        adicionarPraca,
        editarPraca,
        togglePracaStatus,
        atualizarDisponibilidadeMototaxista,
        atualizarPracaMototaxista,
        moderarMototaxista,
        avaliarCorrida,
        enviarMensagemChat,
        acionarSos,
        obterPosicaoFilaMototaxista,
        confirmarPresencaNaFila,
        pausarMototaxistaInativo,
        toggleTarifaDinamica,
        obterCorridaPorCodigo,
        isSupabaseActive,
        solicitarEntrega,
        atualizarTelemetriaGps,
        aceitarEntrega,
        avancarStatusEntrega,
        confirmarRetornoDinheiroEntregador,
        confirmarRecebimentoDinheiroComercio,
        cancelarEntrega,
        solicitarRecarga,
        confirmarRecargaPix,
        recusarRecargaPix,
        solicitarSaque,
        confirmarPagamentoSaque,
        recusarSaque,
        criarComercio,
        editarComercio,
        toggleComercioStatus,
        confirmarPassageiro,
        ajustarCreditoManual,
        autorizarPiloto,
        criarEntregador,
        editarEntregador,
        toggleEntregadorStatus,
        toggleEntregadorOnline,
        limparTudoZerado,
        carregarDadosExemplo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Helper for status descriptions
export function getStatusDescription(status: DeliveryStatus): string {
  switch (status) {
    case 'solicitada':
      return '1. Solicitada';
    case 'procurando_mototaxista':
    case 'aguardando_entregador':
      return '2. Procurando mototaxista';
    case 'aceita':
    case 'entregador_aceitou':
      return '3. Aceita pelo mototaxista';
    case 'mototaxista_a_caminho':
    case 'a_caminho_coleta':
      return '4. Mototaxista a caminho';
    case 'mototaxista_chegou':
      return '5. Mototaxista chegou ao local de embarque';
    case 'corrida_iniciada':
    case 'pedido_coletado':
    case 'a_caminho_entrega':
      return '6. Corrida iniciada (em andamento)';
    case 'corrida_concluida':
    case 'concluida':
      return '7. Corrida concluída';
    case 'cancelada':
      return 'Cancelada';
    default:
      return status;
  }
}

export function getStatusBadgeClasses(status: DeliveryStatus): {
  bg: string;
  text: string;
  border: string;
  label: string;
  stepNumber: number;
} {
  switch (status) {
    case 'solicitada':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        label: 'Solicitada',
        stepNumber: 1,
      };
    case 'procurando_mototaxista':
    case 'aguardando_entregador':
      return {
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-400',
        border: 'border-cyan-500/30',
        label: 'Procurando mototaxista',
        stepNumber: 2,
      };
    case 'aceita':
    case 'entregador_aceitou':
      return {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        border: 'border-blue-500/30',
        label: 'Aceita',
        stepNumber: 3,
      };
    case 'mototaxista_a_caminho':
    case 'a_caminho_coleta':
      return {
        bg: 'bg-indigo-500/10',
        text: 'text-indigo-400',
        border: 'border-indigo-500/30',
        label: 'Mototaxista a caminho',
        stepNumber: 4,
      };
    case 'mototaxista_chegou':
      return {
        bg: 'bg-teal-500/10',
        text: 'text-teal-400',
        border: 'border-teal-500/30',
        label: 'Mototaxista chegou',
        stepNumber: 5,
      };
    case 'corrida_iniciada':
    case 'pedido_coletado':
    case 'a_caminho_entrega':
      return {
        bg: 'bg-purple-500/10',
        text: 'text-purple-400',
        border: 'border-purple-500/30',
        label: 'Corrida iniciada',
        stepNumber: 6,
      };
    case 'corrida_concluida':
    case 'concluida':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        label: 'Corrida concluída',
        stepNumber: 7,
      };
    case 'cancelada':
      return {
        bg: 'bg-rose-500/10',
        text: 'text-rose-400',
        border: 'border-rose-500/30',
        label: 'Cancelada',
        stepNumber: 0,
      };
    default:
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400',
        border: 'border-slate-500/30',
        label: status,
        stepNumber: 0,
      };
  }
}
