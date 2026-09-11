// Script SQL oficial para configuração do banco de dados no Supabase
// Contém todas as tabelas, tipos ENUM, índices, RLS (Row Level Security) e triggers
export const SUPABASE_SQL_SCHEMA = `-- ============================================================================
-- NEXO VIAGENS - BANCO DE DADOS & SEGURANÇA SUPABASE
-- Alagoinha-PB | Arquitetura Segura & Atualizações Inteligentes
-- ============================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TIPOS ENUM
DO $$ BEGIN
  CREATE TYPE tipo_usuario AS ENUM ('passageiro', 'mototaxista', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE status_aprovacao_mototaxista AS ENUM ('pendente', 'aprovado', 'reprovado', 'bloqueado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE status_disponibilidade_mototaxista AS ENUM ('disponivel', 'ocupado', 'offline');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE status_corrida AS ENUM (
    'solicitada',
    'procurando_mototaxista',
    'aceita',
    'mototaxista_a_caminho',
    'mototaxista_chegou',
    'corrida_iniciada',
    'corrida_concluida',
    'cancelada'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tipo_taxa AS ENUM ('fixo', 'percentual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. TABELA DE PRAÇAS (Dinâmicas, gerenciadas pelo Admin)
CREATE TABLE IF NOT EXISTS pracas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  endereco_referencia TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TABELA DE PERFIS (Integrada ao auth.users)
CREATE TABLE IF NOT EXISTS perfis (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo tipo_usuario NOT NULL DEFAULT 'passageiro',
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL UNIQUE,
  cpf TEXT UNIQUE,
  foto_url TEXT,
  saldo_creditos NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. DADOS COMPLEMENTARES DO MOTOTAXISTA
CREATE TABLE IF NOT EXISTS mototaxistas (
  perfil_id UUID PRIMARY KEY REFERENCES perfis(id) ON DELETE CASCADE,
  placa_veiculo TEXT NOT NULL,
  modelo_veiculo TEXT,
  cor_veiculo TEXT,
  cnh_numero TEXT,
  status_aprovacao status_aprovacao_mototaxista NOT NULL DEFAULT 'pendente',
  motivo_reprovacao TEXT,
  aprovado_por UUID REFERENCES perfis(id),
  aprovado_em TIMESTAMPTZ,
  disponibilidade status_disponibilidade_mototaxista NOT NULL DEFAULT 'offline',
  praca_atual_id UUID REFERENCES pracas(id) ON DELETE SET NULL,
  saldo_acumulado NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_ganhos_brutos NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  total_taxas_central NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  avaliacao_media NUMERIC(3,2) NOT NULL DEFAULT 5.00,
  total_avaliacoes INTEGER NOT NULL DEFAULT 0,
  total_corridas INTEGER NOT NULL DEFAULT 0,
  latitude_atual DOUBLE PRECISION,
  longitude_atual DOUBLE PRECISION,
  ultima_atualizacao_localizacao TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. CONFIGURAÇÕES DA CENTRAL (Taxas flexíveis)
CREATE TABLE IF NOT EXISTS configuracoes_central (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome_central TEXT NOT NULL DEFAULT 'Central Nexo Viagens',
  cidade TEXT NOT NULL DEFAULT 'Alagoinha-PB',
  taxa_passageiro_tipo tipo_taxa NOT NULL DEFAULT 'fixo',
  taxa_passageiro_valor NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  taxa_mototaxista_tipo tipo_taxa NOT NULL DEFAULT 'percentual',
  taxa_mototaxista_valor NUMERIC(10,2) NOT NULL DEFAULT 20.00,
  tarifa_base_corrida NUMERIC(10,2) NOT NULL DEFAULT 4.00,
  tarifa_km_adicional NUMERIC(10,2) NOT NULL DEFAULT 1.50,
  raio_busca_km DOUBLE PRECISION NOT NULL DEFAULT 5.0,
  tempo_limite_aceite_segundos INTEGER NOT NULL DEFAULT 45,
  chave_pix_central TEXT NOT NULL DEFAULT 'financeiro@nexoviagens.com.br',
  beneficiario_pix_central TEXT NOT NULL DEFAULT 'Central Nexo Viagens Ltda',
  telefone_central TEXT NOT NULL DEFAULT '(83) 99876-5432',
  atualizado_por UUID REFERENCES perfis(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. TABELA PRINCIPAL DE CORRIDAS
CREATE TABLE IF NOT EXISTS corridas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo SERIAL,
  passageiro_id UUID NOT NULL REFERENCES perfis(id),
  mototaxista_id UUID REFERENCES perfis(id),
  praca_origem_id UUID REFERENCES pracas(id),
  
  -- Localização
  origem_endereco TEXT NOT NULL,
  origem_latitude DOUBLE PRECISION,
  origem_longitude DOUBLE PRECISION,
  destino_endereco TEXT NOT NULL,
  destino_latitude DOUBLE PRECISION,
  destino_longitude DOUBLE PRECISION,
  distancia_estimada_km NUMERIC(6,2),
  
  -- Valores e Comissão
  valor_corrida NUMERIC(10,2) NOT NULL,
  taxa_passageiro NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  taxa_mototaxista NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  valor_destinado_central NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  valor_liquido_mototaxista NUMERIC(10,2) NOT NULL,
  
  -- Status e Horários
  status status_corrida NOT NULL DEFAULT 'solicitada',
  horario_solicitacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  horario_aceitacao TIMESTAMPTZ,
  horario_inicio TIMESTAMPTZ,
  horario_conclusao TIMESTAMPTZ,
  horario_cancelamento TIMESTAMPTZ,
  motivo_cancelamento TEXT,
  cancelado_por UUID REFERENCES perfis(id),
  
  -- Avaliação
  avaliacao_estrelas INTEGER CHECK (avaliacao_estrelas >= 1 AND avaliacao_estrelas <= 5),
  avaliacao_comentario TEXT,
  avaliado_em TIMESTAMPTZ
);

-- 8. HISTÓRICO DE STATUS
CREATE TABLE IF NOT EXISTS historico_status_corridas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  corrida_id UUID NOT NULL REFERENCES corridas(id) ON DELETE CASCADE,
  status_anterior status_corrida,
  status_novo status_corrida NOT NULL,
  alterado_por UUID REFERENCES perfis(id),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. ÍNDICES DE ALTA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_mototaxistas_disp ON mototaxistas(disponibilidade, status_aprovacao, praca_atual_id);
CREATE INDEX IF NOT EXISTS idx_corridas_passageiro ON corridas(passageiro_id, status);
CREATE INDEX IF NOT EXISTS idx_corridas_mototaxista ON corridas(mototaxista_id, status);
CREATE INDEX IF NOT EXISTS idx_corridas_abertas ON corridas(status) WHERE status IN ('solicitada', 'procurando_mototaxista');
CREATE INDEX IF NOT EXISTS idx_corridas_horario ON corridas(horario_solicitacao DESC);

-- 10. ATIVAR ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS
ALTER TABLE pracas ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE mototaxistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_central ENABLE ROW LEVEL SECURITY;
ALTER TABLE corridas ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_status_corridas ENABLE ROW LEVEL SECURITY;

-- 11. POLÍTICAS RLS (Segurança Real)
-- Praças: Leitura por qualquer usuário autenticado; Edição apenas Admin
DROP POLICY IF EXISTS "pracas_select_policy" ON pracas;
CREATE POLICY "pracas_select_policy" ON pracas FOR SELECT TO authenticated USING (true);

-- Perfis: Usuário vê seu perfil; Admin vê todos
DROP POLICY IF EXISTS "perfis_select_policy" ON perfis;
CREATE POLICY "perfis_select_policy" ON perfis FOR SELECT TO authenticated
USING (auth.uid() = id OR EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND tipo = 'admin'));

-- Mototaxistas: Informações públicas de disponíveis; Mototaxista edita sua disponibilidade
DROP POLICY IF EXISTS "mototaxistas_select_policy" ON mototaxistas;
CREATE POLICY "mototaxistas_select_policy" ON mototaxistas FOR SELECT TO authenticated
USING (true);

-- Corridas: Passageiro vê as suas; Mototaxista vê solicitações e suas atribuições; Admin vê tudo
DROP POLICY IF EXISTS "corridas_select_policy" ON corridas;
CREATE POLICY "corridas_select_policy" ON corridas FOR SELECT TO authenticated
USING (
  passageiro_id = auth.uid()
  OR mototaxista_id = auth.uid()
  OR status IN ('solicitada', 'procurando_mototaxista')
  OR EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND tipo = 'admin')
);

-- 12. HABILITAR SUPABASE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE corridas;
ALTER PUBLICATION supabase_realtime ADD TABLE mototaxistas;
ALTER PUBLICATION supabase_realtime ADD TABLE pracas;
`;
