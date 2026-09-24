// ==========================================
// NEXO VIAGENS - MODELOS & TIPOS DO SISTEMA
// Preparado para Supabase, RLS & Realtime
// ==========================================

export type TipoUsuario = 'passageiro' | 'mototaxista' | 'admin';

// Compatibilidade com código existente
export type UserRole = 'admin' | 'merchant' | 'courier';

export type StatusAprovacaoMototaxista = 'pendente' | 'aprovado' | 'reprovado' | 'bloqueado';
export type PilotApprovalStatus = StatusAprovacaoMototaxista;

export type StatusDisponibilidadeMototaxista = 'disponivel' | 'ocupado' | 'offline';

export type StatusCorrida =
  | 'solicitada'
  | 'procurando_mototaxista'
  | 'aceita'
  | 'mototaxista_a_caminho'
  | 'mototaxista_chegou'
  | 'corrida_iniciada'
  | 'corrida_concluida'
  | 'cancelada';

export type DeliveryStatus = StatusCorrida | 'aguardando_entregador' | 'entregador_aceitou' | 'a_caminho_coleta' | 'pedido_coletado' | 'a_caminho_entrega' | 'concluida';

export type DeliveryZoneType = string;
export type ServiceCategory = 'passageiro' | 'encomenda';

export type TipoTaxa = 'fixo' | 'percentual';

// PRAÇAS DINÂMICAS
export interface Praca {
  id: string;
  nome: string;
  endereco_referencia: string;
  latitude?: number;
  longitude?: number;
  ativa: boolean;
  mototaxistas_vinculados?: number;
  mototaxistas_disponiveis?: number;
  created_at?: string;
  updated_at?: string;
}

export interface MensagemChat {
  id: string;
  corrida_id?: string;
  remetente_id: string;
  remetente_tipo: TipoUsuario;
  remetente_nome: string;
  texto: string;
  enviada_em: string;
  rapida?: boolean;
}

// Compatibilidade com OperatingZone
export interface OperatingZone {
  id: string;
  name: string;
  shortName: string;
  bubbleArea: string;
  badgeColor: string;
  icon: string;
  standardFee: number;
  description: string;
}

// PERFIL DE USUÁRIO (Supabase auth.users -> public.perfis)
export interface Perfil {
  id: string;
  tipo: TipoUsuario;
  nome: string;
  telefone: string;
  cpf?: string;
  foto_url?: string;
  ativo: boolean;
  saldo_creditos?: number;
  created_at?: string;
  updated_at?: string;
}

// MOTOTAXISTA
export interface Mototaxista {
  id: string;
  perfil_id?: string;
  nome?: string;
  telefone?: string;
  name?: string;
  phone?: string;
  cpf?: string;
  foto_url?: string;
  placa_veiculo?: string;
  modelo_veiculo?: string;
  cor_veiculo?: string;
  cnh_numero?: string;
  status_aprovacao?: StatusAprovacaoMototaxista;
  motivo_reprovacao?: string;
  aprovado_por?: string;
  aprovado_em?: string;
  disponibilidade?: StatusDisponibilidadeMototaxista;
  praca_atual_id?: string;
  praca_atual_nome?: string;
  praca_entrou_em?: string;
  ultima_atividade_fila?: string;
  alerta_inatividade?: boolean;
  posicao_fila?: number;
  bloqueado_por_avaliacao?: boolean;
  motivo_bloqueio_avaliacao?: string;
  saldo_acumulado?: number;
  total_ganhos_brutos?: number;
  total_taxas_central?: number;
  total_saques_pagos?: number;
  avaliacao_media?: number;
  total_avaliacoes?: number;
  total_corridas?: number;
  latitude_atual?: number;
  longitude_atual?: number;
  ultima_atualizacao_localizacao?: string;
  login_usuario?: string;
  senha?: string;
  created_at?: string;
  updated_at?: string;
}

// Compatibilidade com Courier
export interface Courier extends Mototaxista {
  name: string;
  phone: string;
  vehicleType: 'moto';
  vehiclePlate?: string;
  pixKey: string;
  pixKeyType: PixKeyType;
  photoUrl?: string;
  active: boolean;
  isOnline: boolean;
  approvalStatus: PilotApprovalStatus;
  isApproved: boolean;
  authorizedAt?: string;
  authorizedBy?: string;
  assignedZoneId?: string;
  accumulatedBalance: number;
  totalGrossEarned: number;
  totalNetPaid: number;
  completedDeliveries: number;
  totalWithdrawalsCount: number;
  loginUsername?: string;
  password?: string;
  createdAt: string;
}

// PASSAGEIRO (Compatibilidade com Merchant)
export interface Passageiro {
  id: string;
  nome?: string;
  telefone?: string;
  cpf?: string;
  email?: string;
  endereco_frequente?: string;
  foto_url?: string;
  photoUrl?: string;
  saldo_creditos?: number;
  total_gasto?: number;
  total_corridas?: number;
  ativo?: boolean;
  status_cadastro?: 'pendente' | 'confirmado' | 'rejeitado';
  confirmedAt?: string;
  confirmedBy?: string;
  login_usuario?: string;
  senha?: string;
  created_at?: string;
}

export interface Merchant extends Passageiro {
  name: string;
  ownerName: string;
  phone: string;
  email?: string;
  address: string;
  photoUrl?: string;
  creditBalance: number;
  totalSpent: number;
  totalDeliveries: number;
  active: boolean;
  status_cadastro?: 'pendente' | 'confirmado' | 'rejeitado';
  confirmedAt?: string;
  confirmedBy?: string;
  pixKey?: string;
  loginUsername?: string;
  password?: string;
  createdAt: string;
}

// CORRIDA
export interface Corrida {
  id: string;
  codigo?: string | number;
  passageiro_id?: string;
  passageiro_nome?: string;
  passageiro_telefone?: string;
  passageiro_foto?: string;
  
  mototaxista_id?: string;
  mototaxista_nome?: string;
  mototaxista_telefone?: string;
  mototaxista_foto?: string;
  mototaxista_placa?: string;
  mototaxista_modelo?: string;
  
  praca_origem_id?: string;
  praca_origem_nome?: string;
  
  origem_endereco?: string;
  origem_latitude?: number;
  origem_longitude?: number;
  destino_endereco?: string;
  destino_latitude?: number;
  destino_longitude?: number;
  distancia_estimada_km?: number;
  
  // Valores e Taxas da Central
  valor_corrida?: number;
  taxa_passageiro?: number;
  taxa_mototaxista?: number;
  valor_destinado_central?: number;
  valor_liquido_mototaxista?: number;
  
  // Status e Horários
  status: StatusCorrida | DeliveryStatus;
  horario_solicitacao?: string;
  horario_aceitacao?: string;
  horario_inicio?: string;
  horario_conclusao?: string;
  horario_cancelamento?: string;
  motivo_cancelamento?: string;
  cancelado_por?: string;
  
  // Avaliação
  avaliacao_estrelas?: number;
  avaliacao_comentario?: string;
  avaliado_em?: string;
  
  // Chat Rápido no App & SOS de Emergência
  mensagens_chat?: MensagemChat[];
  sos_acionado?: boolean;
  sos_acionado_por?: string;
  sos_acionado_em?: string;
  
  observacoes?: string;
  historico_status?: StatusHistoryItem[];
}

export interface StatusHistoryItem {
  status: StatusCorrida | DeliveryStatus;
  timestamp: string;
  actorId?: string;
  actorName?: string;
  note?: string;
}

// Compatibilidade com Delivery
export interface Delivery extends Corrida {
  code: string;
  merchantId: string;
  merchantName: string;
  merchantPhone: string;
  merchantPhotoUrl?: string;
  passengerPhotoUrl?: string;
  courierId?: string;
  courierName?: string;
  courierPhone?: string;
  courierPhotoUrl?: string;
  pickupAddress: string;
  deliveryAddress: string;
  deliveryFee: number;
  courierEarnings?: number;
  centralFee?: number;
  statusHistory: StatusHistoryItem[];
  createdAt: string;
  acceptedAt?: string;
  collectedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  cancelledBy?: string;
  notes?: string;
  observations?: string;
  pracaZoneId?: string;
  pracaZoneName?: string;
  customerName?: string;
  customerPhone?: string;
  paymentMethodType?: 'saldo_credito' | 'dinheiro_piloto' | 'pix_piloto';
  merchandiseAmount?: number;
  serviceCategory?: ServiceCategory;
  zoneType?: DeliveryZoneType;
  zoneLabel?: string;
  zoneReason?: string;
  itemDescription?: string;
  deliveryNeighborhood?: string;
  merchandisePaymentMethod?: string;
  merchandisePaymentType?: string;
  cashChangeFor?: number;
  needsCashReturnToMerchant?: boolean;
  vehicleType?: string;
  pinCode?: string;
  pinVerified?: boolean;
  isRural?: boolean;
  ruralAgreedDirectly?: boolean;
  passengerCount?: number;
  cashReturnStatus?: string;
  cashReturnedAt?: string;
  // Telemetria e Rastreamento em Tempo Real (Loop Inteligente de 15s)
  currentCourierLat?: number;
  currentCourierLng?: number;
  currentCourierHeading?: number;
  currentCourierSpeed?: number;
  lastGpsUpdateAt?: string;
  passengerLat?: number;
  passengerLng?: number;
  distanceToPassengerMeters?: number;
  distanceToDestinationMeters?: number;
  estimatedArrivalMinutes?: number;
  gpsLoopActive?: boolean;
}

// CONFIGURAÇÃO DA CENTRAL
export interface ConfiguracoesCentral {
  id?: string;
  nome_central: string;
  cidade: string;
  taxa_passageiro_tipo: TipoTaxa;
  taxa_passageiro_valor: number;
  taxa_mototaxista_tipo: TipoTaxa;
  taxa_mototaxista_valor: number;
  tarifa_base_corrida: number;
  tarifa_km_adicional: number;
  meta_saque_mototaxista: number;
  nota_minima_qualidade: number; // Média mínima para não entrar em trava automática (ex: 3.8)
  raio_busca_km: number;
  tempo_limite_aceite_segundos: number;
  // Sugestão 7: Tarifa Dinâmica por Eventos e Chuva (Clima Local)
  tarifa_dinamica_ativa?: boolean;
  tarifa_dinamica_motivo?: string;
  tarifa_dinamica_adicional?: number;
  // Sugestão 8: Anti-Vaga Ocupada / Inatividade na Praça
  limite_inatividade_fila_minutos?: number;
  chave_pix_central: string;
  tipo_chave_pix_central: PixKeyType;
  beneficiario_pix_central: string;
  telefone_central: string;
  atualizado_em?: string;
}

// Compatibilidade com CentralSettings
export interface CentralSettings extends ConfiguracoesCentral {
  centralName: string;
  city: string;
  centralPixKey: string;
  centralPixKeyType: PixKeyType;
  centralPixBeneficiary: string;
  centralPhone: string;
  centralCommissionRate: number;
  goalAmount: number;
  baseDeliveryFee: number;
  minDeliveryFee: number;
  maxDeliveryFee: number;
  feeUrbanCentral: number;
  feeUrbanDistante: number;
  feePraca1Centro: number;
  feePraca2PatioFestas: number;
  feePraca3Rural?: number; // Descontinuado: foco 100% urbano em Alagoinha-PB
  operatingZones?: OperatingZone[];
  adminUsername?: string;
  adminPassword?: string;
}

export type PixKeyType = 'cpf' | 'cnpj' | 'telefone' | 'email' | 'aleatoria';

export type RechargeStatus = 'aguardando_pix' | 'confirmado' | 'rejeitado';

export interface CreditRecharge {
  id: string;
  code: string;
  merchantId: string;
  merchantName: string;
  amountRequested: number;
  amountReceived?: number;
  status: RechargeStatus;
  pixReference?: string;
  adminConfirmedBy?: string;
  previousBalance: number;
  newBalance?: number;
  createdAt: string;
  confirmedAt?: string;
  notes?: string;
}

export type WithdrawalStatus = 'aguardando_pagamento' | 'pago' | 'recusado';

export interface Withdrawal {
  id: string;
  code: string;
  courierId: string;
  courierName: string;
  courierPhone: string;
  courierPixKey: string;
  courierPixKeyType: PixKeyType;
  grossAmount: number;
  centralFeeRate: number;
  centralFeeAmount: number;
  netAmount: number;
  status: WithdrawalStatus;
  adminConfirmedBy?: string;
  createdAt: string;
  paidAt?: string;
  pixReceiptTransactionId?: string;
}

export type AuditCategory =
  | 'credito'
  | 'entrega'
  | 'saque'
  | 'usuario'
  | 'cancelamento'
  | 'sistema'
  | 'corrida'
  | 'praca';

export interface AuditLog {
  id: string;
  timestamp: string;
  category: AuditCategory;
  actorId: string;
  actorName: string;
  actorRole: UserRole | TipoUsuario | 'sistema';
  actionType: string;
  description: string;
  targetId?: string;
  previousBalance?: number;
  newBalance?: number;
  details?: Record<string, any>;
}

export type PortalView = 'landing' | 'admin' | 'merchant' | 'courier';

export interface UserSession {
  role: UserRole | TipoUsuario | null;
  portalView: PortalView;
  merchantId?: string; // ID do Passageiro
  courierId?: string;  // ID do Mototaxista
  adminName?: string;
  isAuthenticated: boolean;
}

export interface MerchantRegisterInput {
  name: string;
  ownerName?: string;
  phone: string;
  email?: string;
  address?: string;
  photoUrl?: string;
  pixKey?: string;
  loginUsername?: string;
  password?: string;
  initialCredit?: number;
}

export interface CourierRegisterInput {
  name: string;
  phone: string;
  cpf?: string;
  vehicleType?: 'moto';
  vehiclePlate: string;
  vehicleModel?: string;
  vehicleColor?: string;
  cnhNumber?: string;
  pixKey: string;
  pixKeyType: PixKeyType;
  photoUrl?: string;
  assignedZoneId?: string;
  loginUsername?: string;
  password?: string;
}
